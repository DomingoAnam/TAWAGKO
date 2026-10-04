-- TAWAGKO — self-healing resident profile
-- Run after 002, 003, 004, 005, 007, 008 and 009.
--
-- The bug this fixes
-- -----------------
-- Resident registration calls supabase.auth.signUp() and only then inserts the
-- `users` row via create_resident_profile(). When Supabase email confirmation is
-- enabled, signUp returns a user but NO session, so the app stops early and asks
-- the resident to confirm their email. The profile insert is then never reached.
--
-- The result: an auth user exists with no matching `users` row. Every
-- auth-scoped resident call then comes back empty —
--   * get_my_resident_profile()      -> null, so the profile renders blank
--   * submit_verification()          -> "profile not found"
--   * create_assistance_request()    -> "profile not found"
-- which is why the resident side appeared to have no data at all.
--
-- The fix creates the missing row on demand, using the verified email as the
-- name when the resident did not supply one. It is idempotent, so it costs one
-- extra lookup on an existing profile and self-repairs a missing one.
--
-- Idempotent: safe to run more than once.

begin;

create or replace function public.get_my_resident_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_row   users%rowtype;
  v_email text;
begin
  if v_uid is null then
    return null;
  end if;

  select * into v_row from users where id = v_uid;

  -- Self-heal: no profile row yet, so create the minimum viable one.
  if not found then
    select email into v_email from auth.users where id = v_uid;

    insert into users (id, full_name, username, email, role, verification_status)
    values (
      v_uid,
      -- Fall back to the email local part so the profile is never blank.
      coalesce(nullif(split_part(coalesce(v_email, ''), '@', 1), ''), 'Resident'),
      coalesce(nullif(split_part(coalesce(v_email, ''), '@', 1), ''), 'resident'),
      v_email,
      'resident',
      'PENDING_VERIFICATION'
    )
    on conflict (id) do nothing;

    select * into v_row from users where id = v_uid;
  end if;

  return jsonb_build_object(
    'id',                 v_row.id,
    'fullName',           v_row.full_name,
    'username',           v_row.username,
    'email',              v_row.email,
    'contactNumber',      v_row.contact_number,
    'address',            v_row.address,
    'role',               v_row.role,
    'profilePhoto',       v_row.profile_photo,
    'verificationStatus', v_row.verification_status
  );
end;
$$;

grant execute on function public.get_my_resident_profile() to authenticated;

-- Same self-heal for the other resident-scoped writes, so a resident who skipped
-- the profile insert can still submit a verification or a request.
create or replace function public.submit_verification(p_document_uri text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;
  if p_document_uri is null or length(trim(p_document_uri)) = 0 then
    raise exception 'document is required';
  end if;

  -- Guarantees the profile row exists before reading the resident name.
  perform public.get_my_resident_profile();

  select id into v_id
  from verification_requests
  where resident_id = v_uid
    and status in ('PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'REJECTED')
  order by submitted_at desc
  limit 1;

  if v_id is null then
    insert into verification_requests (resident_id, resident_name, document_uri, status, submitted_at)
    select v_uid, full_name, trim(p_document_uri), 'PENDING_VERIFICATION', now()
    from users where id = v_uid
    returning id into v_id;
  else
    update verification_requests
    set document_uri       = trim(p_document_uri),
        status             = 'PENDING_VERIFICATION',
        submitted_at       = now(),
        reviewed_at        = NULL,
        correction_reason  = NULL
    where id = v_id;
  end if;

  update users set verification_status = 'PENDING_VERIFICATION', updated_at = now() where id = v_uid;

  return jsonb_build_object('id', v_id, 'status', 'PENDING_VERIFICATION');
end;
$$;

grant execute on function public.submit_verification(text) to authenticated;

create or replace function public.create_assistance_request(
  p_needs          text[],
  p_urgency        text,
  p_details        text default null,
  p_contact_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_id    uuid;
  v_req   text;
  v_name  text;
  v_phone text;
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;
  if p_needs is null or array_length(p_needs, 1) is null then
    raise exception 'select at least one need';
  end if;

  perform public.get_my_resident_profile();

  select full_name, contact_number into v_name, v_phone from users where id = v_uid;
  if v_name is null then
    raise exception 'profile not found';
  end if;

  v_req := 'REQ-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(replace(v_uid::text, '-', ''), 1, 4);

  insert into assistance_requests (
    request_id, resident_id, resident_name, contact_number, needs, urgency, details, status, submitted_at, updated_at
  )
  values (
    v_req, v_uid, v_name, coalesce(nullif(trim(coalesce(p_contact_number, '')), ''), v_phone),
    p_needs, coalesce(nullif(trim(coalesce(p_urgency, '')), ''), 'Can Wait'),
    nullif(trim(coalesce(p_details, '')), ''), 'PENDING', now(), now()
  )
  returning id into v_id;

  insert into post_emergency_checkins (resident_id, still_needs_assistance, submitted_at)
  values (v_uid, true, now());

  return jsonb_build_object('id', v_id, 'request_id', v_req, 'status', 'PENDING');
end;
$$;

grant execute on function public.create_assistance_request(text[], text, text, text)
  to authenticated;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'get_my_resident_profile',
    'submit_verification',
    'create_assistance_request'
  )
order by p.proname, arguments;
