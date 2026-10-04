-- TAWAGKO — connect every write path to the database
-- Run after 002, 003, 004, 005 and 007.
--
-- 1. Fixes the bug where a personnel member's phone number and Facebook URL
--    disappear after logging out and back in. The sign-in / token-claim /
--    create-account functions returned only the first five columns, so the
--    session was rebuilt without the contact details on every re-login.
--
-- 2. Replaces the remaining "delete every row, then re-insert the whole list"
--    writes for emergency contacts, barangay services, assistance requests and
--    verification requests. Those approaches destroyed row ids on every save and
--    lost the entire table whenever an insert failed.
--
-- 3. Adds resident self-service profile updates, scoped to auth.uid() so a
--    resident can only ever change their own row.
--
-- All personnel writes go through personnel_is_authorized(), which requires the
-- personnel password and a claimed token (is_active = true). All resident writes
-- are scoped to auth.uid().
--
-- Idempotent: safe to run more than once.

begin;

-- ---------------------------------------------------------------------------
-- 1. Personnel account payloads include the public contact details
-- ---------------------------------------------------------------------------

create or replace function public.create_personnel_account(
  p_username   text,
  p_password   text,
  p_full_name  text,
  p_position   text default null,
  p_department text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row personnel_accounts%rowtype;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'username is required';
  end if;
  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'full name is required';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'password must be at least 8 characters';
  end if;
  if exists (select 1 from personnel_accounts where lower(username) = lower(trim(p_username))) then
    raise exception 'that username is already taken';
  end if;

  insert into personnel_accounts (
    full_name, username, email, password_hash, position, department,
    is_active, token, created_at, updated_at
  )
  values (
    trim(p_full_name), trim(p_username), trim(p_username),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    nullif(trim(coalesce(p_position, '')), ''),
    nullif(trim(coalesce(p_department, '')), ''),
    false, NULL, now(), now()
  )
  returning * into v_row;

  return jsonb_build_object(
    'id',           v_row.id,
    'full_name',    v_row.full_name,
    'username',     v_row.username,
    'position',     v_row.position,
    'department',   v_row.department,
    'phone',        v_row.phone,
    'facebook_url', v_row.facebook_url,
    'needs_token',  true
  );
end;
$$;

grant execute on function public.create_personnel_account(text, text, text, text, text)
  to anon, authenticated;

create or replace function public.personnel_sign_in(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row personnel_accounts%rowtype;
begin
  if p_username is null or p_password is null then
    return null;
  end if;

  select * into v_row
  from personnel_accounts
  where lower(username) = lower(trim(p_username))
    and password_hash = extensions.crypt(p_password, password_hash)
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id',           v_row.id,
    'full_name',    v_row.full_name,
    'username',     v_row.username,
    'position',     v_row.position,
    'department',   v_row.department,
    'phone',        v_row.phone,
    'facebook_url', v_row.facebook_url,
    'needs_token',  (not v_row.is_active)
  );
end;
$$;

grant execute on function public.personnel_sign_in(text, text) to anon, authenticated;

create or replace function public.claim_personnel_token(
  p_username text,
  p_password text,
  p_token    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   personnel_accounts%rowtype;
  v_token text;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'token is required';
  end if;

  select value into v_token from app_settings where key = 'personnel_token';
  if v_token is null or v_token <> trim(p_token) then
    raise exception 'invalid personnel token';
  end if;

  select * into v_row
  from personnel_accounts
  where lower(username) = lower(trim(p_username))
    and password_hash = extensions.crypt(p_password, password_hash)
  limit 1;

  if not found then
    raise exception 'incorrect username or password';
  end if;

  update personnel_accounts
  set is_active = true,
      token = trim(p_token),
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'id',           v_row.id,
    'full_name',    v_row.full_name,
    'username',     v_row.username,
    'position',     v_row.position,
    'department',   v_row.department,
    'phone',        v_row.phone,
    'facebook_url', v_row.facebook_url,
    'needs_token',  false
  );
end;
$$;

grant execute on function public.claim_personnel_token(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Emergency contacts: single-row writes
-- ---------------------------------------------------------------------------
-- NOTE: p_id is declared LAST, after every defaulted parameter. Postgres rejects
-- a required parameter that follows one with a default (error 42P13), so the
-- optional id cannot sit in the middle of the list.
create or replace function public.upsert_emergency_contact(
  p_username       text,
  p_password       text,
  p_service_name   text,
  p_contact_number text,
  p_description    text default null,
  p_availability   text default 'Available',
  p_id             uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_service_name is null or length(trim(p_service_name)) = 0 then
    raise exception 'service name is required';
  end if;
  if p_contact_number is null or length(trim(p_contact_number)) = 0 then
    raise exception 'contact number is required';
  end if;

  if p_id is null then
    insert into emergency_contacts (service_name, description, contact_number, availability, last_updated)
    values (trim(p_service_name), nullif(trim(coalesce(p_description, '')), ''), trim(p_contact_number),
            coalesce(p_availability, 'Available'), now())
    returning id into v_id;
  else
    update emergency_contacts
    set service_name   = trim(p_service_name),
        description    = nullif(trim(coalesce(p_description, '')), ''),
        contact_number = trim(p_contact_number),
        availability   = coalesce(p_availability, 'Available'),
        last_updated   = now()
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'contact not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_emergency_contact(text, text, text, text, text, text, uuid)
  to anon, authenticated;

create or replace function public.delete_emergency_contact(
  p_username text,
  p_password text,
  p_id       uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  delete from emergency_contacts where id = p_id;
  return found;
end;
$$;

grant execute on function public.delete_emergency_contact(text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Barangay services: single-row writes
-- ---------------------------------------------------------------------------
-- p_id last for the same reason as upsert_emergency_contact (error 42P13).
create or replace function public.upsert_barangay_service(
  p_username       text,
  p_password       text,
  p_service_name   text,
  p_contact_number text default null,
  p_location       text default null,
  p_office_hours   text default null,
  p_availability   text default 'Available',
  p_description    text default null,
  p_id             uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_service_name is null or length(trim(p_service_name)) = 0 then
    raise exception 'service name is required';
  end if;

  if p_id is null then
    insert into barangay_services (service_name, contact_number, location, office_hours, availability, description)
    values (trim(p_service_name), nullif(trim(coalesce(p_contact_number, '')), ''),
            nullif(trim(coalesce(p_location, '')), ''), nullif(trim(coalesce(p_office_hours, '')), ''),
            coalesce(p_availability, 'Available'), nullif(trim(coalesce(p_description, '')), ''))
    returning id into v_id;
  else
    update barangay_services
    set service_name   = trim(p_service_name),
        contact_number = nullif(trim(coalesce(p_contact_number, '')), ''),
        location       = nullif(trim(coalesce(p_location, '')), ''),
        office_hours   = nullif(trim(coalesce(p_office_hours, '')), ''),
        availability   = coalesce(p_availability, 'Available'),
        description    = nullif(trim(coalesce(p_description, '')), '')
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'service not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_barangay_service(text, text, text, text, text, text, text, text, uuid)
  to anon, authenticated;

create or replace function public.delete_barangay_service(
  p_username text,
  p_password text,
  p_id       uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  delete from barangay_services where id = p_id;
  return found;
end;
$$;

grant execute on function public.delete_barangay_service(text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Assistance requests
--
-- Residents create their own rows, scoped to auth.uid(). Personnel update
-- status. Both are verified server-side.
-- ---------------------------------------------------------------------------
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
  v_uid uuid := auth.uid();
  v_id  uuid;
  v_req text;
  v_user users%rowtype;
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;
  if p_needs is null or array_length(p_needs, 1) is null then
    raise exception 'select at least one need';
  end if;

  select * into v_user from users where id = v_uid;
  if not found then
    raise exception 'profile not found';
  end if;

  v_req := 'REQ-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(replace(v_uid::text, '-', ''), 1, 4);

  insert into assistance_requests (
    request_id, resident_id, resident_name, contact_number, needs, urgency, details, status, submitted_at, updated_at
  )
  values (
    v_req, v_uid, v_user.full_name, coalesce(nullif(trim(coalesce(p_contact_number, '')), ''), v_user.contact_number),
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

create or replace function public.record_checkin(p_still_needs_assistance boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;

  insert into post_emergency_checkins (resident_id, still_needs_assistance, submitted_at)
  values (v_uid, coalesce(p_still_needs_assistance, false), now());

  return true;
end;
$$;

grant execute on function public.record_checkin(boolean) to authenticated;

create or replace function public.update_assistance_status(
  p_username    text,
  p_password    text,
  p_id          uuid,
  p_status      text,
  p_new_needs   text[] default null,
  p_new_urgency text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_status is null or length(trim(p_status)) = 0 then
    raise exception 'status is required';
  end if;

  update assistance_requests
  set status      = trim(p_status),
      needs       = coalesce(p_new_needs, needs),
      urgency     = coalesce(nullif(trim(coalesce(p_new_urgency, '')), ''), urgency),
      updated_at  = now()
  where id = p_id;

  return found;
end;
$$;

grant execute on function public.update_assistance_status(text, text, uuid, text, text[], text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Verification requests
--
-- submit_verification upserts the resident's single open request, so re-submitting
-- after a correction does not create duplicate rows.
-- ---------------------------------------------------------------------------
create or replace function public.submit_verification(p_document_uri text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user users%rowtype;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;
  if p_document_uri is null or length(trim(p_document_uri)) = 0 then
    raise exception 'document is required';
  end if;

  select * into v_user from users where id = v_uid;
  if not found then
    raise exception 'profile not found';
  end if;

  -- REJECTED is included so a rejected resident resubmitting updates the same
  -- row instead of creating a duplicate request.
  select id into v_id
  from verification_requests
  where resident_id = v_uid
    and status in ('PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'REJECTED')
  order by submitted_at desc
  limit 1;

  if v_id is null then
    insert into verification_requests (resident_id, resident_name, document_uri, status, submitted_at)
    values (v_uid, v_user.full_name, trim(p_document_uri), 'PENDING_VERIFICATION', now())
    returning id into v_id;
  else
    update verification_requests
    set document_uri  = trim(p_document_uri),
        status        = 'PENDING_VERIFICATION',
        submitted_at  = now(),
        reviewed_at   = NULL,
        correction_reason = NULL
    where id = v_id;
  end if;

  update users set verification_status = 'PENDING_VERIFICATION', updated_at = now() where id = v_uid;

  return jsonb_build_object('id', v_id, 'status', 'PENDING_VERIFICATION');
end;
$$;

grant execute on function public.submit_verification(text) to authenticated;

create or replace function public.review_verification(
  p_username          text,
  p_password          text,
  p_id                uuid,
  p_status            text,
  p_correction_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resident uuid;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_status not in ('VERIFIED', 'NEEDS_CORRECTION', 'REJECTED') then
    raise exception 'invalid status';
  end if;

  select resident_id into v_resident from verification_requests where id = p_id;
  if v_resident is null then
    raise exception 'request not found';
  end if;

  update verification_requests
  set status            = trim(p_status),
      reviewed_at       = now(),
      correction_reason = nullif(trim(coalesce(p_correction_reason, '')), '')
  where id = p_id;

  update users
  set verification_status = trim(p_status), updated_at = now()
  where id = v_resident;

  return true;
end;
$$;

grant execute on function public.review_verification(text, text, uuid, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Resident self-service profile
--
-- Scoped to auth.uid(): a resident can only ever update their own row.
-- ---------------------------------------------------------------------------
create or replace function public.update_my_resident_profile(
  p_phone   text default null,
  p_address text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_phone text;
begin
  if v_uid is null then
    raise exception 'sign in required';
  end if;

  v_phone := nullif(trim(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')), '');
  if v_phone is not null and length(v_phone) < 7 then
    raise exception 'phone number looks too short';
  end if;

  update users
  set contact_number = coalesce(v_phone, contact_number),
      address        = coalesce(nullif(trim(coalesce(p_address, '')), ''), address),
      updated_at     = now()
  where id = v_uid;

  if not found then
    raise exception 'profile not found';
  end if;

  return jsonb_build_object(
    'id',             v_uid,
    'contact_number', v_phone,
    'address',        nullif(trim(coalesce(p_address, '')), '')
  );
end;
$$;

grant execute on function public.update_my_resident_profile(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Reads the app needs, mapped to the camelCase shape the screens expect
-- ---------------------------------------------------------------------------
create or replace function public.get_my_resident_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',                 u.id,
    'fullName',           u.full_name,
    'username',           u.username,
    'email',              u.email,
    'contactNumber',      u.contact_number,
    'address',            u.address,
    'role',               u.role,
    'profilePhoto',       u.profile_photo,
    'verificationStatus', u.verification_status
  )
  from users u
  where u.id = auth.uid();
$$;

grant execute on function public.get_my_resident_profile() to authenticated;

create or replace function public.list_my_assistance_requests()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',           r.id,
    'requestId',    r.request_id,
    'residentId',   r.resident_id,
    'residentName', r.resident_name,
    'contactNumber',r.contact_number,
    'needs',        r.needs,
    'urgency',      r.urgency,
    'details',      r.details,
    'status',       r.status,
    'submittedAt',  r.submitted_at,
    'updatedAt',    r.updated_at
  ) order by r.submitted_at desc), '[]'::jsonb)
  from assistance_requests r
  where r.resident_id = auth.uid();
$$;

grant execute on function public.list_my_assistance_requests() to authenticated;

-- Personnel side: every request, gated on the personnel credentials because the
-- rows contain resident names and phone numbers.
create or replace function public.list_assistance_requests_directory(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',            r.id,
      'requestId',     r.request_id,
      'residentId',    r.resident_id,
      'residentName',  r.resident_name,
      'contactNumber', r.contact_number,
      'needs',         r.needs,
      'urgency',       r.urgency,
      'details',       r.details,
      'status',        r.status,
      'submittedAt',   r.submitted_at,
      'updatedAt',     r.updated_at
    ) order by r.submitted_at desc)
    from assistance_requests r
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_assistance_requests_directory(text, text)
  to anon, authenticated;

create or replace function public.list_emergency_contacts()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',           c.id,
    'serviceName',  c.service_name,
    'description',  c.description,
    'contactNumber',c.contact_number,
    'availability', c.availability,
    'lastUpdated',  c.last_updated
  ) order by c.service_name), '[]'::jsonb)
  from emergency_contacts c;
$$;

grant execute on function public.list_emergency_contacts() to anon, authenticated;

create or replace function public.list_barangay_services()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',           s.id,
    'serviceName',  s.service_name,
    'contactNumber',s.contact_number,
    'location',     s.location,
    'officeHours',  s.office_hours,
    'availability', s.availability,
    'description',  s.description
  ) order by s.service_name), '[]'::jsonb)
  from barangay_services s;
$$;

grant execute on function public.list_barangay_services() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Retire the remaining anon writes
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anon full access" on emergency_contacts;
drop policy if exists "Allow anon full access" on barangay_services;
revoke insert, update, delete on emergency_contacts from anon;
revoke insert, update, delete on barangay_services from anon;

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
    'update_my_resident_profile',
    'submit_verification',
    'review_verification',
    'create_assistance_request',
    'update_assistance_status',
    'record_checkin',
    'list_my_assistance_requests',
    'list_assistance_requests_directory',
    'list_emergency_contacts',
    'list_barangay_services',
    'upsert_emergency_contact',
    'delete_emergency_contact',
    'upsert_barangay_service',
    'delete_barangay_service',
    'personnel_sign_in',
    'claim_personnel_token'
  )
order by p.proname, arguments;
