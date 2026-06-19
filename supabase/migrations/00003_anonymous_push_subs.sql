-- Allow anonymous push subscriptions

-- 1. Make user_id nullable (anonymous users don't have one)
alter table public.push_subscriptions alter column user_id drop not null;

-- 2. Drop old unique constraint (needs not-null columns)
alter table public.push_subscriptions drop constraint push_subscriptions_user_id_endpoint_key;

-- 3. Add partial unique indexes to prevent duplicates
create unique index push_subs_auth_unique
  on public.push_subscriptions (user_id, endpoint)
  where user_id is not null;

create unique index push_subs_anon_unique
  on public.push_subscriptions (endpoint)
  where user_id is null;

-- 4. Drop old unified RLS policy
drop policy if exists "Users can manage own push subs" on public.push_subscriptions;

-- 5. RLS policy for authenticated users
create policy "Authenticated push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. RLS policies for anonymous users
create policy "Anonymous push subscriptions insert"
  on public.push_subscriptions
  for insert
  with check (user_id is null);

create policy "Anonymous push subscriptions select"
  on public.push_subscriptions
  for select
  using (user_id is null);

create policy "Anonymous push subscriptions delete"
  on public.push_subscriptions
  for delete
  using (user_id is null);
