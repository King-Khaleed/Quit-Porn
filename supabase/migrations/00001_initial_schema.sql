-- QuitPorn - Initial Schema Migration
-- Run this in Supabase SQL Editor

-- 1. Enable Anonymous Auth (do this in Supabase Dashboard too)
-- Go to Authentication → Settings → Allow anonymous sign-ins → ON

-- 2. Users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now(),
  last_streak_reset timestamptz,
  premium_expires timestamptz,
  settings jsonb default '{}'::jsonb
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Encrypted journal entries (server stores blobs only)
create table if not exists public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  encrypted_data text not null,
  mood text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can CRUD own entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_journal_entries_user_id on public.journal_entries(user_id);
create index idx_journal_entries_created_at on public.journal_entries(created_at);

-- 4. Push notification subscriptions
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subs"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Relapse logs (anonymized, for pattern analysis)
create table if not exists public.relapse_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  logged_at timestamptz default now(),
  mood_before text,
  trigger_context text,
  day_of_week int,
  time_block text
);

alter table public.relapse_logs enable row level security;

create policy "Users can manage own relapse logs"
  on public.relapse_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_relapse_logs_user_id on public.relapse_logs(user_id);

-- 6. User blocklist (custom blocked domains)
create table if not exists public.user_blocklist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  domain text not null,
  created_at timestamptz default now(),
  unique(user_id, domain)
);

alter table public.user_blocklist enable row level security;

create policy "Users can manage own blocklist"
  on public.user_blocklist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
