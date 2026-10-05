-- TAWAGKO — wipe all application data, preserve the personnel token
--
-- DELETES EVERY ROW in the ten data tables. Schema, RLS policies and the
-- personnel token in `app_settings` are left untouched.
--
-- Consequences:
--   * No personnel accounts remain. Nobody can sign in until someone creates an
--     account (Personnel Portal → Create one) and presents the token.
--   * No residents, verifications, assistance requests, check-ins, contacts,
--     services, officials or announcements.
--
-- Reference data (emergency contacts, services, announcements) is NOT re-seeded:
-- `seedSampleData()` is intentionally disabled, so everything stays empty until
-- personnel create their own.
--
-- Irreversible. Run only when you mean it.

begin;

-- Single statement: atomic, and CASCADE clears the FK graph between tables.
truncate table
  users,
  personnel_accounts,
  emergency_contacts,
  barangay_services,
  officials,
  announcements,
  assistance_requests,
  verification_requests,
  post_emergency_checkins,
  office_info
restart identity cascade;

-- push_tokens only exists after 015 has been run, so truncate it separately
-- and only when present. Stale tokens would otherwise keep receiving pushes.
do $$
begin
  if to_regclass('public.push_tokens') is not null then
    truncate table public.push_tokens restart identity cascade;
  end if;
end;
$$;

commit;

-- Sanity check: token must survive, everything else must be empty.
select key, length(value) as token_length from app_settings order by key;

select
  (select count(*) from users)                    as users,
  (select count(*) from personnel_accounts)       as personnel,
  (select count(*) from emergency_contacts)       as contacts,
  (select count(*) from barangay_services)        as services,
  (select count(*) from officials)                as officials,
  (select count(*) from announcements)            as announcements,
  (select count(*) from assistance_requests)      as requests,
  (select count(*) from verification_requests)    as verifications,
  (select count(*) from post_emergency_checkins)  as checkins;

-- Wipes any registered notification devices too (015 and later).
select
  case
    when to_regclass('public.push_tokens') is null then 'push_tokens not created yet'
    else 'push_tokens cleared by the block above'
  end as push_tokens;
