-- TAWAGKO — repair for 006 (atomic, idempotent, safe to run repeatedly)
--
-- Why this exists
-- ---------------
-- 006 drops the 5-argument update_personnel_profile() and then creates the
-- 7-argument version, because Postgres cannot `create or replace` a function
-- whose parameter list changed. Without an explicit transaction, an error
-- between the two statements leaves the profile function missing entirely and
-- profile edits fail with "Could not find the function ... in the schema cache".
--
-- This script re-applies everything 006 adds, wrapped in a transaction so the
-- drop and the create either both succeed or both roll back.
--
-- Run this instead of 006 if 006 failed. Safe to run more than once.

begin;

-- ---------------------------------------------------------------------------
-- Personnel contact columns
-- ---------------------------------------------------------------------------
alter table personnel_accounts add column if not exists phone text;
alter table personnel_accounts add column if not exists facebook_url text;

-- ---------------------------------------------------------------------------
-- Credential check
-- ---------------------------------------------------------------------------
create or replace function public.personnel_is_authorized(p_username text, p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from personnel_accounts
    where lower(username) = lower(trim(p_username))
      and password_hash = extensions.crypt(p_password, password_hash)
      and is_active = true
  );
$$;

grant execute on function public.personnel_is_authorized(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Announcements
-- ---------------------------------------------------------------------------
create or replace function public.publish_announcement(
  p_username     text,
  p_password     text,
  p_title        text,
  p_description  text,
  p_category     text default 'COMMUNITY',
  p_date         text default null,
  p_time         text default null,
  p_important    boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_author text;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_title is null or length(trim(p_title)) = 0 then
    raise exception 'title is required';
  end if;

  select full_name into v_author
  from personnel_accounts
  where lower(username) = lower(trim(p_username));

  insert into announcements (title, description, category, date, time, important, created_by, created_at)
  values (
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(nullif(trim(coalesce(p_category, '')), ''), 'COMMUNITY'),
    coalesce(p_date, to_char(now(), 'FMMonth DD, YYYY')),
    coalesce(p_time, to_char(now(), 'FMHH12:MI AM')),
    coalesce(p_important, false),
    v_author,
    now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.publish_announcement(text, text, text, text, text, text, text, boolean)
  to anon, authenticated;

create or replace function public.update_announcement(
  p_username     text,
  p_password     text,
  p_id           uuid,
  p_title        text,
  p_description  text,
  p_category     text default 'COMMUNITY',
  p_date         text default null,
  p_time         text default null,
  p_important    boolean default false
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

  update announcements
  set title       = trim(p_title),
      description = nullif(trim(coalesce(p_description, '')), ''),
      category    = coalesce(nullif(trim(coalesce(p_category, '')), ''), 'COMMUNITY'),
      date        = p_date,
      time        = p_time,
      important   = coalesce(p_important, false)
  where id = p_id;

  return found;
end;
$$;

grant execute on function public.update_announcement(text, text, uuid, text, text, text, text, text, boolean)
  to anon, authenticated;

create or replace function public.delete_announcement(
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

  delete from announcements where id = p_id;
  return found;
end;
$$;

grant execute on function public.delete_announcement(text, text, uuid) to anon, authenticated;

drop policy if exists "Allow anon full access" on announcements;
revoke insert, update, delete on announcements from anon;

-- ---------------------------------------------------------------------------
-- Officials directory
-- ---------------------------------------------------------------------------
create or replace function public.list_officials_directory()
-- "position" is quoted because POSITION is a reserved word in Postgres (the
-- position(x IN y) function). The quotes keep the JSON key as `position`.
returns table (
  id           uuid,
  full_name    text,
  "position"   text,
  department   text,
  phone        text,
  facebook_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p."position", p.department, p.phone, p.facebook_url
  from personnel_accounts p
  where p.is_active = true
    and p.full_name is not null
    and nullif(trim(p.full_name), '') is not null
  order by
    case p."position"
      when 'Barangay Captain' then 0
      when 'Barangay Secretary' then 1
      when 'Barangay Treasurer' then 2
      when 'Councilor' then 3
      else 4
    end,
    p.full_name;
$$;

grant execute on function public.list_officials_directory() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profile update, with contact details
--
-- Dropped and recreated inside this transaction: the parameter list changed, so
-- `create or replace` would fail with "cannot change name of input parameter".
-- Only the legacy 5-argument version is dropped. `create or replace` below is
-- used so this script stays idempotent and does not collide with the 7-argument
-- version once it exists (error 42723).
-- ---------------------------------------------------------------------------
drop function if exists public.update_personnel_profile(text, text, text, text, text);

create or replace function public.update_personnel_profile(
  p_username     text,
  p_password     text,
  p_full_name    text,
  p_position     text default null,
  p_department   text default null,
  p_phone        text default null,
  p_facebook_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row personnel_accounts%rowtype;
  v_phone text;
  v_fb    text;
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

  -- Keep only dialable characters so the Call button cannot be fed junk.
  v_phone := nullif(trim(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g')), '');
  if v_phone is not null and length(v_phone) < 7 then
    raise exception 'phone number looks too short';
  end if;

  -- Normalise to an absolute URL so Linking.openURL always resolves.
  if nullif(trim(coalesce(p_facebook_url, '')), '') is null then
    v_fb := null;
  elsif trim(p_facebook_url) ~* '^https?://' then
    v_fb := trim(p_facebook_url);
  else
    v_fb := 'https://' || trim(p_facebook_url);
  end if;

  update personnel_accounts
  set full_name    = trim(p_full_name),
      "position"   = nullif(trim(coalesce(p_position, '')), ''),
      department   = nullif(trim(coalesce(p_department, '')), ''),
      phone        = v_phone,
      facebook_url = v_fb,
      updated_at   = now()
  where id = v_row.id;

  return jsonb_build_object(
    'id',           v_row.id,
    'full_name',    trim(p_full_name),
    'username',     v_row.username,
    'position',     nullif(trim(coalesce(p_position, '')), ''),
    'department',   nullif(trim(coalesce(p_department, '')), ''),
    'phone',        v_phone,
    'facebook_url', v_fb
  );
end;
$$;

grant execute on function public.update_personnel_profile(text, text, text, text, text, text, text)
  to anon, authenticated;

commit;

-- ---------------------------------------------------------------------------
-- PostgREST caches its schema. Without this reload, correctly created functions
-- still return "Could not find the function ... in the schema cache".
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification. update_personnel_profile must show 7 arguments.
-- ---------------------------------------------------------------------------
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'update_personnel_profile',
    'list_officials_directory',
    'personnel_is_authorized',
    'publish_announcement',
    'update_announcement',
    'delete_announcement'
  )
order by p.proname, arguments;
