-- TAWAGKO — personnel read access to verification requests
-- Run after 002, 003, 004, 005, 007, 008, 009 and 010.
--
-- The bug this fixes
-- -----------------
-- schema.sql enables RLS on `verification_requests` but never creates a SELECT
-- policy for it (only emergency_contacts, barangay_services, officials,
-- announcements and office_info got one). The app read the table directly with
--
--   supabase.from('verification_requests').select('*')
--
-- which RLS correctly filters to zero rows. The personnel Verification tab
-- therefore showed "No verification requests" no matter how many residents had
-- submitted, and the dashboard's pending count stayed at zero.
--
-- These rows contain resident names and document URIs, so the read is gated on
-- the personnel credentials rather than opened to the public key.
--
-- Only PENDING_VERIFICATION rows are returned, so a decided request leaves the
-- list. It returns when the resident resubmits.
--
-- Idempotent: safe to run more than once.

begin;

create or replace function public.list_verification_requests_directory(
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

  -- Only requests awaiting a decision. Approving, rejecting or requesting a
  -- correction moves the row out of this list, and it reappears automatically
  -- when the resident resubmits, because submit_verification() sets the status
  -- back to PENDING_VERIFICATION on the same row.
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',               v.id,
      'residentId',       v.resident_id,
      'residentName',     v.resident_name,
      'documentUri',      v.document_uri,
      'status',           v.status,
      'submittedAt',      v.submitted_at,
      'reviewedAt',       v.reviewed_at,
      'correctionReason', v.correction_reason
    ) order by v.submitted_at desc)
    from verification_requests v
    where v.status = 'PENDING_VERIFICATION'
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.list_verification_requests_directory(text, text)
  to anon, authenticated;

-- A count-only variant so the dashboard summary does not have to pull every
-- document URI just to render a number.
create or replace function public.count_pending_verifications(
  p_username text,
  p_password text
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;

  return (
    select count(*)::int
    from verification_requests
    where status = 'PENDING_VERIFICATION'
  );
end;
$$;

grant execute on function public.count_pending_verifications(text, text)
  to anon, authenticated;

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
    'list_verification_requests_directory',
    'count_pending_verifications',
    'personnel_is_authorized'
  )
order by p.proname, arguments;
