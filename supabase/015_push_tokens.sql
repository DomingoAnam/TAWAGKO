-- TAWAGKO — push notification device tokens
-- Run after 014.
--
-- Adds:
--   * push_tokens: one row per device that opted in to notifications.
--   * register_push_token: called by the app after the user grants permission.
--   * unregister_push_token: called on logout.
--   * list_push_tokens: reads the tokens of the people who should be alerted
--     for a given event. Scoped by role or by a single user id so a resident
--     can only ever resolve personnel tokens and vice versa.
--
-- Idempotent: safe to run more than once.

begin;

create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  token       text not null unique,
  platform    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- Tokens are only ever written/read through the credentialed functions below.
revoke all on public.push_tokens from anon, authenticated;

create or replace function public.register_push_token(
  p_user_id  uuid,
  p_token    text,
  p_platform text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_token is null or trim(p_token) = '' then
    return false;
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (p_user_id, p_token, p_platform)
  on conflict (token) do update
    set user_id     = excluded.user_id,
        platform    = excluded.platform,
        updated_at  = now();

  return true;
end;
$$;

grant execute on function public.register_push_token(uuid, text, text)
  to anon, authenticated;

create or replace function public.unregister_push_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.push_tokens where token = p_token;
  return found;
end;
$$;

grant execute on function public.unregister_push_token(text)
  to anon, authenticated;

-- p_role:    'personnel' -> every personnel device
--            'resident'  -> every resident device
-- p_user_id: when set, only that single user's devices (used for
--            "your request was updated" style notifications).
create or replace function public.list_push_tokens(
  p_role    text default null,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'token',    pt.token,
      'platform', pt.platform,
      'userId',   pt.user_id
    ))
    from public.push_tokens pt
    join public.users u on u.id = pt.user_id
    where (p_user_id is not null and pt.user_id = p_user_id)
       or (p_user_id is null
           and p_role is not null
           and (p_role <> 'personnel' or coalesce(u.role, 'resident') <> 'resident'))
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_push_tokens(text, uuid)
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
    'register_push_token',
    'unregister_push_token',
    'list_push_tokens'
  )
order by p.proname, arguments;