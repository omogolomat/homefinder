-- =============================================================================
-- HomeFinder Botswana — run in Supabase: SQL Editor → New query → Run
-- Order: run once. If a step fails, read the comment and fix or skip that block.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- PROFILES (id = auth.users id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'User' check (role in ('User', 'Agent', 'Admin')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- LISTINGS (matches web/js/api.js column names)
-- ---------------------------------------------------------------------------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles (id),
  title text not null,
  description text,
  price_bwp numeric not null,
  listing_type text not null,
  property_type text not null,
  city text not null,
  suburb text not null,
  bedrooms int,
  bathrooms int,
  image_urls text[] not null default '{}',
  agent_name text,
  agent_phone text,
  created_at timestamptz default now()
);

create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_listing_type_idx on public.listings (listing_type);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

drop policy if exists "listings_select_public" on public.listings;
create policy "listings_select_public" on public.listings for select using (true);

drop policy if exists "listings_insert_agent" on public.listings;
create policy "listings_insert_agent" on public.listings for insert
  with check (
    auth.uid() = agent_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('Agent', 'Admin')
    )
  );

drop policy if exists "listings_update_own" on public.listings;
create policy "listings_update_own" on public.listings for update
  using (auth.uid() = agent_id);

drop policy if exists "listings_delete_own" on public.listings;
create policy "listings_delete_own" on public.listings for delete
  using (auth.uid() = agent_id);

-- ---------------------------------------------------------------------------
-- FAVOURITES (user_favorites)
-- ---------------------------------------------------------------------------
create table if not exists public.user_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

alter table public.user_favorites enable row level security;

drop policy if exists "favorites_select_own" on public.user_favorites;
create policy "favorites_select_own" on public.user_favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.user_favorites;
create policy "favorites_insert_own" on public.user_favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.user_favorites;
create policy "favorites_delete_own" on public.user_favorites for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AUTO PROFILE ON SIGNUP (trigger on auth.users)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'User'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- If your Postgres build rejects "procedure", use instead:
-- for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- STORAGE: bucket property-images (public URLs for listing photos)
-- Create bucket in Dashboard → Storage → New bucket → name: property-images → Public: ON
-- Then run policies below (or run the insert if you prefer SQL-only).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
  on storage.objects for select
  using (bucket_id = 'property-images');

drop policy if exists "property_images_auth_upload" on storage.objects;
create policy "property_images_auth_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images');

drop policy if exists "property_images_auth_update" on storage.objects;
create policy "property_images_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-images' and split_part(name, '/', 1) = auth.uid()::text);

drop policy if exists "property_images_auth_delete" on storage.objects;
create policy "property_images_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and split_part(name, '/', 1) = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- OPTIONAL: promote a user to Agent (run after they have signed up once)
-- replace the email with the real account
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'Agent'
-- where id = (select id from auth.users where email = 'agent@example.com' limit 1);
