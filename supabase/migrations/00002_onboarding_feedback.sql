-- Onboarding feedback and user feedback tables

create table if not exists public.onboarding_feedback (
  id bigint generated always as identity primary key,
  pricing_preference text not null,
  created_at timestamptz default now()
);

alter table public.onboarding_feedback enable row level security;

create policy "Anyone can insert onboarding feedback"
  on public.onboarding_feedback for insert
  with check (true);

create table if not exists public.user_feedback (
  id bigint generated always as identity primary key,
  feedback text not null,
  created_at timestamptz default now()
);

alter table public.user_feedback enable row level security;

create policy "Anyone can insert user feedback"
  on public.user_feedback for insert
  with check (true);
