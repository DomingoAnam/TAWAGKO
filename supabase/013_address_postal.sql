-- TAWAGKO — address + postal code for contacts and services
-- Run after 002, 003, 004, 005, 007, 008, 009, 010 and 012.
--
-- Adds a postal code to both tables and an address to emergency contacts
-- (barangay services already have `location`). The upsert and list functions
-- are replaced so the new fields travel end to end.
--
-- Idempotent: safe to run more than once.

begin;

alter table emergency_contacts add column if not exists address text;
alter table emergency_contacts add column if not exists postal_code text;
alter table barangay_services    add column if not exists postal_code text;

-- Replace the emergency-contact upsert. p_address / p_postal_code are declared
-- after the defaulted parameters to avoid Postgres error 42P13.
drop function if exists public.upsert_emergency_contact(text, text, text, text, text, text, uuid, text);

create or replace function public.upsert_emergency_contact(
  p_username       text,
  p_password       text,
  p_service_name   text,
  p_contact_number text,
  p_description    text default null,
  p_availability   text default 'Available',
  p_id             uuid default null,
  p_photo          text default null,
  p_address        text default null,
  p_postal_code    text default null
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
      service_name, description, contact_number, availability, last_updated, photo_uri, address, postal_code
    )
    values (
      trim(p_service_name), nullif(trim(coalesce(p_description, '')), ''), trim(p_contact_number),
      coalesce(p_availability, 'Available'), now(), v_photo,
      nullif(trim(coalesce(p_address, '')), ''), nullif(trim(coalesce(p_postal_code, '')), '')
    )
    returning id into v_id;
  else
    update emergency_contacts
    set service_name   = trim(p_service_name),
        description    = nullif(trim(coalesce(p_description, '')), ''),
        contact_number = trim(p_contact_number),
        availability   = coalesce(p_availability, 'Available'),
        last_updated   = now(),
        photo_uri      = coalesce(v_photo, photo_uri),
        address        = coalesce(nullif(trim(coalesce(p_address, '')), ''), address),
        postal_code    = coalesce(nullif(trim(coalesce(p_postal_code, '')), ''), postal_code)
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'contact not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_emergency_contact(text, text, text, text, text, text, uuid, text, text, text)
  to anon, authenticated;

-- Replace the barangay-service upsert. `location` stays the address; postal
-- code is new. Drop the 10-arg version first.
drop function if exists public.upsert_barangay_service(text, text, text, text, text, text, text, text, uuid, text);

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
  p_photo          text default null,
  p_postal_code    text default null
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
      service_name, contact_number, location, office_hours, availability, description, photo_uri, postal_code
    )
    values (
      trim(p_service_name), nullif(trim(coalesce(p_contact_number, '')), ''),
      nullif(trim(coalesce(p_location, '')), ''), nullif(trim(coalesce(p_office_hours, '')), ''),
      coalesce(p_availability, 'Available'), nullif(trim(coalesce(p_description, '')), ''), v_photo,
      nullif(trim(coalesce(p_postal_code, '')), '')
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
        photo_uri      = coalesce(v_photo, photo_uri),
        postal_code    = coalesce(nullif(trim(coalesce(p_postal_code, '')), ''), postal_code)
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'service not found';
    end if;
  end if;

  return v_id;
end;
$$;

grant execute on function public.upsert_barangay_service(text, text, text, text, text, text, text, text, uuid, text, text)
  to anon, authenticated;

-- Rebuild the read functions with the new fields.
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
    'photoUri',     c.photo_uri,
    'address',      c.address,
    'postalCode',   c.postal_code
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
    'photoUri',     s.photo_uri,
    'postalCode',   s.postal_code
  ) order by s.service_name), '[]'::jsonb)
  from barangay_services s;
$$;

grant execute on function public.list_barangay_services() to anon, authenticated;

commit;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- Verification: emergency-contact upsert has 10 args, service upsert has 11.
-- ---------------------------------------------------------------------------
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('upsert_emergency_contact', 'upsert_barangay_service')
order by p.proname, arguments;
