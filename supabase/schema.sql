-- TAWAGKO Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  email text,
  password_hash text not null,
  contact_number text,
  address text,
  role text default 'resident' check (role in ('resident', 'personnel')),
  profile_photo text,
  verification_status text default 'PENDING_VERIFICATION',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Personnel accounts (token-based access: no password required)
create table if not exists personnel_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  email text,
  password_hash text, -- unused: personnel authenticate with a token
  position text,
  department text,
  is_active boolean default true,
  token text, -- personnel access token
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists personnel_accounts_token_key
  on personnel_accounts (token)
  where token is not null;

-- Emergency contacts
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  description text,
  contact_number text not null,
  availability text default 'Available',
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

-- Barangay services
create table if not exists barangay_services (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  contact_number text,
  location text,
  office_hours text,
  availability text default 'Available',
  description text,
  created_at timestamptz default now()
);

-- Officials
create table if not exists officials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  photo_url text,
  contact_number text,
  availability text default 'Available',
  created_at timestamptz default now()
);

-- Announcements
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text default 'COMMUNITY',
  date text,
  time text,
  important boolean default false,
  created_by text,
  created_at timestamptz default now()
);

-- Assistance requests
create table if not exists assistance_requests (
  id uuid primary key default gen_random_uuid(),
  request_id text unique not null,
  resident_id uuid references users(id),
  resident_name text,
  contact_number text,
  needs text[], -- array of strings
  urgency text,
  details text,
  status text default 'PENDING',
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Verification requests
create table if not exists verification_requests (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references users(id),
  resident_name text,
  document_uri text,
  status text default 'PENDING_VERIFICATION',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  correction_reason text
);

-- Post emergency check-ins
create table if not exists post_emergency_checkins (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references users(id),
  still_needs_assistance boolean,
  submitted_at timestamptz default now()
);

-- Barangay office info
create table if not exists office_info (
  id uuid primary key default gen_random_uuid(),
  address text,
  office_hours text,
  contact_number text,
  services text[],
  updated_at timestamptz default now()
);

-- Enable RLS (Row Level Security) on all tables
alter table users enable row level security;
alter table personnel_accounts enable row level security;
alter table emergency_contacts enable row level security;
alter table barangay_services enable row level security;
alter table officials enable row level security;
alter table announcements enable row level security;
alter table assistance_requests enable row level security;
alter table verification_requests enable row level security;
alter table post_emergency_checkins enable row level security;
alter table office_info enable row level security;

-- Public reference data is readable by the mobile app's anon key.
-- NOTE: anon WRITE access is a prototype trade-off — see 002_personnel_token.sql
-- for the locked-down approach used for personnel/admin data.
drop policy if exists "Anyone can view emergency contacts" on emergency_contacts;
drop policy if exists "Anyone can view barangay services" on barangay_services;
drop policy if exists "Anyone can view officials" on officials;
drop policy if exists "Anyone can view announcements" on announcements;
drop policy if exists "Anyone can view office info" on office_info;
drop policy if exists "Allow anon full access" on emergency_contacts;
drop policy if exists "Allow anon full access" on barangay_services;
drop policy if exists "Allow anon full access" on officials;
drop policy if exists "Allow anon full access" on announcements;
drop policy if exists "Allow anon full access" on office_info;

create policy "Anyone can view emergency contacts" on emergency_contacts for select using (true);
create policy "Anyone can view barangay services" on barangay_services for select using (true);
create policy "Anyone can view officials" on officials for select using (true);
create policy "Anyone can view announcements" on announcements for select using (true);
create policy "Anyone can view office info" on office_info for select using (true);

-- personnel_accounts has NO anon policy on purpose.
-- Token sync + verification go through the SECURITY DEFINER functions in
-- 002_personnel_token.sql, so the admin token is never readable or writable
-- with the public anon key.
