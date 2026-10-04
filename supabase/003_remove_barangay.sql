-- TAWAGKO — remove the redundant `barangay` column (run after 002_personnel_token.sql)
--
-- Rationale: TAWAGKO serves a single barangay, so the barangay name is a
-- constant of the app rather than user data. Keeping it per-user duplicated
-- the address and let the two drift out of sync. The resident's `address`
-- (house number, street) is kept because personnel need it to reach them.
--
-- Idempotent: safe to run more than once.

-- 1. Drop the previous 6-argument signature. Postgres cannot change a
--    function's parameters with CREATE OR REPLACE (it would just add an
--    overload), so the old one must be removed explicitly.
drop function if exists public.create_resident_profile(uuid, text, text, text, text, text);

-- 2. Recreate it without p_barangay. Role stays hardcoded to 'resident'.
create or replace function public.create_resident_profile(
  p_id             uuid,
  p_full_name      text,
  p_username       text,
  p_contact_number text default null,
  p_address        text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_row    users%rowtype;
begin
  if v_caller is null or p_id is distinct from v_caller then
    raise exception 'p_id must match the signed-in user';
  end if;

  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'full name is required';
  end if;

  insert into users as t (
    id, full_name, username, contact_number, address,
    role, verification_status
  )
  values (
    p_id, trim(p_full_name), trim(p_username), p_contact_number, p_address,
    'resident', 'PENDING_VERIFICATION'   -- role is never client-controlled
  )
  on conflict (id) do update
    set full_name  = excluded.full_name,
        username   = excluded.username,
        contact_number = excluded.contact_number,
        address    = excluded.address,
        updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'id',                  v_row.id,
    'full_name',           v_row.full_name,
    'username',            v_row.username,
    'address',             v_row.address,
    'verification_status', v_row.verification_status
  );
end;
$$;

grant execute on function public.create_resident_profile(uuid, text, text, text, text)
  to authenticated;

-- 3. Drop the column from each table that stored it.
alter table users                drop column if exists barangay;
alter table assistance_requests  drop column if exists barangay;
alter table verification_requests drop column if exists barangay;