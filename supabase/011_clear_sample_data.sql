-- TAWAGKO — remove the leftover sample rows
--
-- The app no longer seeds sample data (see seedSampleData in
-- src/services/supabaseStorage.ts, which is now a no-op). Any contacts,
-- services or announcements still in the database came from the old seeding
-- routine and must be deleted by hand once.
--
-- This script deletes ONLY rows matching the old hard-coded sample values.
-- Anything personnel created themselves is left untouched.
--
-- Safe to run more than once. Review the SELECT output before committing.

begin;

-- Emergency contacts seeded by the old routine.
delete from emergency_contacts
where service_name in ('PNP', 'BFP', 'RHU / Hospital', 'DRRMO');

-- Barangay services seeded by the old routine.
delete from barangay_services
where service_name in (
  'Barangay Office',
  'Municipal Office',
  'Water Services',
  'Electricity Services',
  'Health Services'
);

-- Announcements seeded by the old routine.
delete from announcements
where title in (
  'Scheduled Water Interruption',
  'Barangay Assembly This Friday'
);

-- The old "officials" table is unused: officials now come from personnel
-- accounts. Only removes the two seeded placeholder rows.
delete from officials
where name in ('Hon. Juan Dela Cruz', 'Kagawad Maria Santos');

commit;

-- Should report zero rows across the board.
select
  (select count(*) from emergency_contacts) as contacts,
  (select count(*) from barangay_services)  as services,
  (select count(*) from announcements)      as announcements,
  (select count(*) from officials)          as officials_legacy;
