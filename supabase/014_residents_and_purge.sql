-- TAWAGKO — resident directory, resident active flags, stale assistance purge
-- Run after 002, 003, 004, 005, 007, 008, 009, 010, 012 and 013.
--
-- Adds:
--   * users.is_active so personnel can enable/disable a resident account.
--   * list_residents_directory: personnel-credentialed read of every resident.
--   * set_resident_active: disable/enable a resident account. Residents can be
--     blocked at login by a separate guard (see is_active checks on sign in).
--   * purge_stale_assisted_requests: completed requests older than 3 days are
--     removed as requested.
--
-- Idempotent: safe to run more than once.

begin;

alter table users add column if not exists is_active boolean default true;

create or replace function public.list_residents_directory(
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
      'id',                 u.id,
      'fullName',           u.full_name,
      'username',           u.username,
      'email',              u.email,
      'contactNumber',      u.contact_number,
      'address',            u.address,
      'verificationStatus', u.verification_status,
      'isActive',           coalesce(u.is_active, true),
      'createdAt',          u.created_at
    ) order by u.full_name)
    from users u
    where u.role is null or u.role = 'resident'
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_residents_directory(text, text) to anon, authenticated;

create or replace function public.set_resident_active(
  p_username text,
  p_password text,
  p_user_id  uuid,
  p_active   boolean
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

  update users
  set is_active = coalesce(p_active, true), updated_at = now()
  where id = p_user_id;

  return found;
end;
$$;

grant execute on function public.set_resident_active(text, text, uuid, boolean)
  to anon, authenticated;

create or replace function public.purge_stale_assisted_requests(
  p_username text,
  p_password text,
  p_days     integer default 3
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;

  delete from assistance_requests
  where status = 'COMPLETED'
    and updated_at < now() - (coalesce(p_days, 3) || ' days')::interval;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.purge_stale_assisted_requests(text, text, integer)
  to anon, authenticated;

commit;

notify pgrst, 'reload schema';

select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'list_residents_directory',
    'set_resident_active',
    'purge_stale_assisted_requests'
  )
order by p.proname, arguments;
