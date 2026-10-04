-- TAWAGKO — images for emergency contacts and barangay services
-- Run after 002, 003, 004, 005, 007 and 008.
--
-- Personnel attach a photo when creating a contact or a service; the resident
-- side renders it on the left of the row instead of a generic icon.
--
-- Images are stored as data URIs in a text column rather than in Supabase
-- Storage. That keeps the app free of a storage bucket and its upload policies,
-- at the cost of row size — the client downscales to a small JPEG first, and
-- `max_image_bytes` below is enforced server-side so an oversized image is
-- rejected rather than silently bloating the table.
--
-- Idempotent: safe to run more than once.

begin;

alter table emergency_contacts add column if not exists photo_uri text;
alter table barangay_services   add column if not exists photo_uri text;

-- Recreate the upserts with the photo parameter. p_photo is declared last so it
-- sits after the defaulted parameters (Postgres error 42P13 otherwise).
create or replace function public.upsert_emergency_contact(
  p_username       text,
  p_password       text,
  p_service_name   text,
  p_contact_number text,
  p_description    text default null,
  p_availability   text default 'Available',
  p_id             uuid default null,
  p_photo          text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_photo text;
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

  v_photo := nullif(trim(coalesce(p_photo, '')), '');
  if v_photo is not null and length(v_photo) > 400000 then
    raise exception 'image is too large, please choose a smaller photo';
  end if;

  if p_id is null then
    insert into emergency_contacts (
      service_name, description, contact_number, availability, last_updated, photo_uri
    )
    values (
      trim(p_service_name), nullif(trim(coalesce(p_description, '')), ''), trim(p_contact_number),
      coalesce(p_availability, 'Available'), now(), v_photo
    )
    returning id into v_id;
  else
    update emergency_contacts
    set service_name   = trim(p_service_name),
        description    = nullif(trim(coalesce(p_description, '')), ''),
        contact_number = trim(p_contact_number),
        availability   = coalesce(p_availability, 'Available'),
        last_updated   = now(),
        photo_uri      = coalesce(v_photo, photo_uri)
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'contact not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_emergency_contact(text, text, text, text, text, text, uuid, text)
  to anon, authenticated;

drop function if exists public.upsert_barangay_service(text, text, text, text, text, text, text, text, uuid);

create or replace function public.upsert_barangay_service(
  p_username       text,
  p_password       text,
  p_service_name   text,
  p_contact_number text default null,
  p_location       text default null,
  p_office_hours   text default null,
  p_availability   text default 'Available',
  p_description    text default null,
  p_id             uuid default null,
  p_photo          text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_photo text;
begin
  if not public.personnel_is_authorized(p_username, p_password) then
    raise exception 'unauthorized';
  end if;
  if p_service_name is null or length(trim(p_service_name)) = 0 then
    raise exception 'service name is required';
  end if;

  v_photo := nullif(trim(coalesce(p_photo, '')), '');
  if v_photo is not null and length(v_photo) > 400000 then
    raise exception 'image is too large, please choose a smaller photo';
  end if;

  if p_id is null then
    insert into barangay_services (
      service_name, contact_number, location, office_hours, availability, description, photo_uri
    )
    values (
      trim(p_service_name), nullif(trim(coalesce(p_contact_number, '')), ''),
      nullif(trim(coalesce(p_location, '')), ''), nullif(trim(coalesce(p_office_hours, '')), ''),
      coalesce(p_availability, 'Available'), nullif(trim(coalesce(p_description, '')), ''), v_photo
    )
    returning id into v_id;
  else
    update barangay_services
    set service_name   = trim(p_service_name),
        contact_number = nullif(trim(coalesce(p_contact_number, '')), ''),
        location       = nullif(trim(coalesce(p_location, '')), ''),
        office_hours   = nullif(trim(coalesce(p_office_hours, '')), ''),
        availability   = coalesce(p_availability, 'Available'),
        description    = nullif(trim(coalesce(p_description, '')), ''),
        photo_uri      = coalesce(v_photo, photo_uri)
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'service not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_barangay_service(text, text, text, text, text, text, text, text, uuid, text)
  to anon, authenticated;

-- Include the photo in the reads the app renders.
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
    'lastUpdated',  c.last_updated,
    'photoUri',     c.photo_uri
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
    'description',  s.description,
    'photoUri',     s.photo_uri
  ) order by s.service_name), '[]'::jsonb)
  from barangay_services s;
$$;

grant execute on function public.list_barangay_services() to anon, authenticated;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification: both upserts must now show 8 and 10 arguments respectively.
-- ---------------------------------------------------------------------------
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'upsert_emergency_contact',
    'upsert_barangay_service',
    'list_emergency_contacts',
    'list_barangay_services'
  )
order by p.proname, arguments;
