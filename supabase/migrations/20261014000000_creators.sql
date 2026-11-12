-- Creator profiles and the team CRM.
-- Passwords live only in Supabase Auth (auth.users). Nothing here stores them.
--
-- Core fields are columns. Agency-specific answers (dog breed, content
-- categories and so on) live in `details`, keyed by the field keys in
-- src/agency/crm.ts.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.application_status as enum ('new', 'reviewing', 'approved', 'rejected', 'inactive');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Admins: a user is an admin only if their auth id is in this table. Rows can
-- only be added with SQL or the service role (no API policies).
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Creators
-- ---------------------------------------------------------------------------
create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  -- Null for creators imported from the old site until they claim a login.
  auth_user_id uuid unique references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'signup' check (source in ('signup', 'import')),

  first_name text check (first_name is null or char_length(first_name) <= 80),
  last_name text check (last_name is null or char_length(last_name) <= 80),
  email citext not null unique check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),

  address_line_1 text check (address_line_1 is null or char_length(address_line_1) <= 200),
  address_line_2 text check (address_line_2 is null or char_length(address_line_2) <= 200),
  town text check (town is null or char_length(town) <= 80),
  county text check (county is null or char_length(county) <= 80),
  postcode text check (postcode is null or char_length(postcode) <= 12),
  country text check (country is null or char_length(country) <= 80),

  gender text check (gender is null or gender in ('woman', 'man', 'non_binary', 'self_described', 'prefer_not_to_say')),
  date_of_birth date check (date_of_birth is null or date_of_birth > date '1900-01-01'),

  clothing_size text check (clothing_size is null or char_length(clothing_size) <= 20),
  trouser_size text check (trouser_size is null or char_length(trouser_size) <= 20),
  shoe_size text check (shoe_size is null or char_length(shoe_size) <= 20),
  dietary_requirements text check (dietary_requirements is null or char_length(dietary_requirements) <= 500),
  allergies text check (allergies is null or char_length(allergies) <= 500),

  instagram_url text check (instagram_url is null or instagram_url ~ '^https://(www\.)?instagram\.com/'),
  instagram_followers integer check (instagram_followers is null or instagram_followers between 0 and 1000000000),
  tiktok_url text check (tiktok_url is null or tiktok_url ~ '^https://(www\.)?tiktok\.com/'),
  tiktok_followers integer check (tiktok_followers is null or tiktok_followers between 0 and 1000000000),
  youtube_url text check (youtube_url is null or youtube_url ~ '^https://(www\.)?youtube\.com/'),
  youtube_followers integer check (youtube_followers is null or youtube_followers between 0 and 1000000000),

  rate_per_post numeric(10, 2) check (rate_per_post is null or rate_per_post >= 0),
  join_gifting_network boolean not null default false,
  additional_notes text check (additional_notes is null or char_length(additional_notes) <= 2000),

  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object' and pg_column_size(details) < 16384),

  -- Null for imported creators: the old site's consent wording isn't on record.
  privacy_consent_at timestamptz,

  application_status public.application_status not null default 'new',
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 10000)
);

create index if not exists creators_created_at_idx on public.creators (created_at desc);
create index if not exists creators_status_idx on public.creators (application_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists creators_set_updated_at on public.creators;
create trigger creators_set_updated_at
  before update on public.creators
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.creators enable row level security;

drop policy if exists "Creators read own profile" on public.creators;
create policy "Creators read own profile" on public.creators
  for select to authenticated
  using ((select auth.uid()) = auth_user_id);

drop policy if exists "Creators update own profile" on public.creators;
create policy "Creators update own profile" on public.creators
  for update to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check ((select auth.uid()) = auth_user_id);

-- No insert or delete policies: profiles are created server-side, and the
-- team reads and updates through the admin functions below.

-- ---------------------------------------------------------------------------
-- Column privileges (a second layer on top of RLS)
--   * Nobody using the public API key can read admin_notes directly.
--   * Creators can only change their own personal fields; never their status,
--     email, owner, source or timestamps.
-- ---------------------------------------------------------------------------
revoke all on public.creators from anon, authenticated;

grant select (
  id, auth_user_id, created_at, updated_at, source,
  first_name, last_name, email, phone,
  address_line_1, address_line_2, town, county, postcode, country,
  gender, date_of_birth, clothing_size, trouser_size, shoe_size, dietary_requirements, allergies,
  instagram_url, instagram_followers, tiktok_url, tiktok_followers, youtube_url, youtube_followers,
  rate_per_post, join_gifting_network, additional_notes, details, privacy_consent_at, application_status
) on public.creators to authenticated;

grant update (
  first_name, last_name, phone,
  address_line_1, address_line_2, town, county, postcode, country,
  gender, date_of_birth, clothing_size, trouser_size, shoe_size, dietary_requirements, allergies,
  instagram_url, instagram_followers, tiktok_url, tiktok_followers, youtube_url, youtube_followers,
  rate_per_post, join_gifting_network, additional_notes, details
) on public.creators to authenticated;

revoke all on public.admins from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin-only functions. Each checks is_admin() inside the database, so they
-- are safe even though they bypass column privileges.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_creators(p_offset integer default 0, p_limit integer default 1000)
returns setof public.creators
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query
    select * from public.creators
    order by created_at desc, id
    offset greatest(p_offset, 0)
    limit least(greatest(p_limit, 1), 1000);
end;
$$;

create or replace function public.admin_get_creator(p_id uuid)
returns setof public.creators
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  return query select * from public.creators where id = p_id;
end;
$$;

create or replace function public.admin_update_creator(
  p_id uuid,
  p_status public.application_status,
  p_admin_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  update public.creators
     set application_status = p_status,
         admin_notes = nullif(btrim(p_admin_notes), '')
   where id = p_id;
  if not found then
    raise exception 'Creator not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_list_creators(integer, integer) from public, anon;
revoke all on function public.admin_get_creator(uuid) from public, anon;
revoke all on function public.admin_update_creator(uuid, public.application_status, text) from public, anon;
grant execute on function public.admin_list_creators(integer, integer) to authenticated;
grant execute on function public.admin_get_creator(uuid) to authenticated;
grant execute on function public.admin_update_creator(uuid, public.application_status, text) to authenticated;
