-- TAWAGKO — personnel self-registration + token claim (run after 002 and 003)
--
-- Model
-- -----
-- There is NO default personnel account. Personnel create their own account,
-- then present the shared personnel token to unlock the dashboard:
--
--   Create account  ->  account exists but is_active = false (no access)
--   Enter token     ->  token checked against app_settings, is_active = true
--   Dashboard       ->  accessible
--
-- The token is a shared authorization code, so it lives in `app_settings`
-- rather than on each account. Passwords are hashed by Postgres (pgcrypto
-- bcrypt) so plaintext never leaves the database and no service-role key is
-- needed in the app. The table stays locked behind RLS exactly as in 002.
--
-- Idempotent: safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

alter table personnel_accounts add column if not exists password_hash text;

-- 1. Remove any previously seeded default account.
delete from personnel_accounts where username = 'admin@tawagko.local';

-- 2. Shared token store.
create table if not exists app_settings (
  key   text primary key,
  value text not null
);

-- !! SET YOUR OWN CODE BEFORE USE !!
--
-- The token below is a placeholder and is intentionally NOT a real secret: this
-- file is committed to source control. Anyone who knows the token can register an
-- account and unlock the personnel dashboard, so never commit your real one.
--
-- After running this script, set your own token:
--
--   update app_settings
--      set value = 'your-own-token-here'
--    where key = 'personnel_token';
--
-- `on conflict do nothing` means re-running this script will NOT overwrite a token
-- you have already set.
insert into app_settings (key, value)
values ('personnel_token', 'CHANGE_ME_set_your_own_token')
on conflict (key) do nothing;

alter table app_settings enable row level security;
revoke all on table app_settings from anon;

-- 3. Create a personnel account. Access is NOT granted yet (is_active = false).
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
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'username',   v_row.username,
    'position',   v_row.position,
    'department', v_row.department,
    'needs_token', true
  );
end;
$$;

grant execute on function public.create_personnel_account(text, text, text, text, text)
  to anon, authenticated;

-- 4. Sign in. Returns needs_token = true when the account exists but has not
--    yet presented the personnel token.
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
    'id',          v_row.id,
    'full_name',   v_row.full_name,
    'username',    v_row.username,
    'position',    v_row.position,
    'department',  v_row.department,
    'needs_token', (not v_row.is_active)
  );
end;
$$;

grant execute on function public.personnel_sign_in(text, text) to anon, authenticated;

-- 5. Present the shared token to unlock dashboard access.
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
    'id',         v_row.id,
    'full_name',  v_row.full_name,
    'username',   v_row.username,
    'position',   v_row.position,
    'department', v_row.department,
    'needs_token', false
  );
end;
$$;

grant execute on function public.claim_personnel_token(text, text, text) to anon, authenticated;

-- 6. Edit own profile.
create or replace function public.update_personnel_profile(
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
  if p_full_name is null or length(trim(p_full_name)) = 0 then
    raise exception 'full name is required';
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
  set full_name  = trim(p_full_name),
      position   = nullif(trim(coalesce(p_position, '')), ''),
      department = nullif(trim(coalesce(p_department, '')), ''),
      updated_at = now()
  where id = v_row.id;

  return jsonb_build_object(
    'id',         v_row.id,
    'full_name',  trim(p_full_name),
    'username',   v_row.username,
    'position',   nullif(trim(coalesce(p_position, '')), ''),
    'department', nullif(trim(coalesce(p_department, '')), '')
  );
end;
$$;

grant execute on function public.update_personnel_profile(text, text, text, text, text)
  to anon, authenticated;

-- 7. Change own password.
create or replace function public.change_personnel_password(
  p_username     text,
  p_old_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_new_password is null or length(p_new_password) < 8 then
    raise exception 'new password must be at least 8 characters';
  end if;
  if p_new_password = p_old_password then
    raise exception 'new password must be different';
  end if;

  select id into v_id
  from personnel_accounts
  where lower(username) = lower(trim(p_username))
    and password_hash = extensions.crypt(p_old_password, password_hash)
  limit 1;

  if v_id is null then
    return false;
  end if;

  update personnel_accounts
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = v_id;

  return true;
end;
$$;

grant execute on function public.change_personnel_password(text, text, text) to anon, authenticated;

-- 8. Retire the old per-account token RPC; the token is now shared config.
drop function if exists public.verify_personnel_token(text);
drop function if exists public.authenticate_personnel(text, text);
drop function if exists public.sync_personnel_account(text, text, text, text, text);