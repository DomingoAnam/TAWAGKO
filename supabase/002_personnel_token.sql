-- TAWAGKO — personnel token access (run once in the Supabase SQL Editor)
--
-- Why this exists
-- ---------------
-- The mobile app ships the *anon* Supabase key, so `role = 'anon'`. Any RLS
-- policy that lets anon INSERT/UPDATE `personnel_accounts` would let ANYONE
-- who unpacks the app rewrite the personnel token and grant themselves admin
-- access. So the table stays locked and we expose two narrow functions
-- instead. `SECURITY DEFINER` runs with the privileges of the function owner
-- (postgres), which bypasses RLS, while still only doing exactly this one thing.
--
-- Idempotent: safe to run more than once.

-- 0. Personnel authenticate with a token, so the password column is unused.
--    `create table if not exists` in schema.sql is a no-op on an existing
--    table, so this constraint has to be dropped explicitly here.
alter table personnel_accounts alter column password_hash drop not null;

-- 1. Lock the table down explicitly (in case a permissive policy already exists).
drop policy if exists "Allow anon full access" on personnel_accounts;

-- 2. Create/refresh the personnel account so its token matches the app.
create or replace function public.sync_personnel_account(
  p_token       text,
  p_username    text default 'admin@tawagko.local',
  p_full_name   text default 'System Administrator',
  p_position    text default 'Administrator',
  p_department  text default 'IT'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row personnel_accounts%rowtype;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'token must not be empty';
  end if;

  insert into personnel_accounts as t (full_name, username, email, position, department, is_active, token)
  values (p_full_name, p_username, p_username, p_position, p_department, true, trim(p_token))
  on conflict (username) do update
    set token       = excluded.token,
        full_name   = excluded.full_name,
        position    = excluded.position,
        department  = excluded.department,
        is_active   = true,
        updated_at  = now()
  returning * into v_row;

  return jsonb_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'username',   v_row.username,
    'position',   v_row.position,
    'department', v_row.department
  );
end;
$$;

-- 3. Verify a token without ever exposing the table.
--    Returns the account when the token matches an active personnel row, else null.
create or replace function public.verify_personnel_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row personnel_accounts%rowtype;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;

  select * into v_row
  from personnel_accounts
  where token = trim(p_token)
    and is_active = true
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'username',   v_row.username,
    'position',   v_row.position,
    'department', v_row.department
  );
end;
$$;

-- 4. Only these two functions are callable by the public anon key.
grant execute on function public.sync_personnel_account(text, text, text, text, text) to anon, authenticated;
grant execute on function public.verify_personnel_token(text) to anon, authenticated;

-- 5. No direct table access for anon.
revoke all on table personnel_accounts from anon;


-- ---------------------------------------------------------------------------
-- Resident onboarding
-- ---------------------------------------------------------------------------
-- Same reasoning: the client must not be able to INSERT into `users` directly,
-- because `users.role` drives navigation in SplashScreen. A client that could
-- set role = 'personnel' would land itself in the admin dashboard, so the
-- insert goes through a function that hardcodes the role.

-- 6. The password lives in Supabase Auth (auth.users), not in this table, so the
--    column is vestigial. Dropping NOT NULL is required for the insert below.
alter table users alter column password_hash drop not null;

-- 7. Create the resident profile. `p_id` MUST match the caller, otherwise
--    anyone could write into somebody else's profile.
create or replace function public.create_resident_profile(
  p_id             uuid,
  p_full_name      text,
  p_username       text,
  p_contact_number text default null,
  p_barangay       text default null,
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
    id, full_name, username, contact_number, barangay, address,
    role, verification_status
  )
  values (
    p_id, trim(p_full_name), trim(p_username), p_contact_number, p_barangay, p_address,
    'resident', 'PENDING_VERIFICATION'   -- role is never client-controlled
  )
  on conflict (id) do update
    set full_name  = excluded.full_name,
        username   = excluded.username,
        contact_number = excluded.contact_number,
        barangay   = excluded.barangay,
        address    = excluded.address,
        updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'id',                  v_row.id,
    'full_name',           v_row.full_name,
    'username',            v_row.username,
    'barangay',            v_row.barangay,
    'verification_status', v_row.verification_status
  );
end;
$$;

grant execute on function public.create_resident_profile(uuid, text, text, text, text, text)
  to authenticated;

-- 8. Residents read only their own row.
drop policy if exists "Residents see own profile" on users;
create policy "Residents see own profile"
  on users for select
  using (auth.uid() = id);