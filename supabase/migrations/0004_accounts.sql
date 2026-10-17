-- Reader accounts: sign in with an email link to keep the grocery list and
-- meal plan on every device and save recipes and posts.
-- Run once in the Supabase SQL editor of Coco's project, then under
-- Authentication › Sign In / Providers keep Email on and "Allow new users to
-- sign up" on, and under Authentication › URL Configuration add
-- https://cocoscare.com/account to the redirect URLs.
--
-- Readers are ordinary auth users. Only accounts in `admins` can edit the
-- site, so signing up never gives anyone admin rights.

-- One row per reader. Each tool column is { value, savedAt } so the newest
-- copy wins when two devices change it.
create table public.member_data (
  user_id uuid primary key references auth.users on delete cascade,
  grocery jsonb,
  meal_plan jsonb,
  updated_at timestamptz not null default now()
);

alter table public.member_data enable row level security;

create policy "readers see their own data" on public.member_data
  for select to authenticated using (user_id = auth.uid());
create policy "readers add their own data" on public.member_data
  for insert to authenticated with check (user_id = auth.uid());
create policy "readers change their own data" on public.member_data
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger member_data_touch before update on public.member_data
  for each row execute function public.touch_updated_at();

-- Saved recipes and posts. ref is the recipe id or the post slug; title,
-- href and image_url are copied in so "My saves" needs no other lookups.
create table public.saves (
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('recipe', 'post')),
  ref text not null check (char_length(ref) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200),
  href text not null check (href like '/%' and char_length(href) <= 300),
  image_url text check (image_url is null or char_length(image_url) <= 1000),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);

alter table public.saves enable row level security;

create policy "readers see their own saves" on public.saves
  for select to authenticated using (user_id = auth.uid());
create policy "readers add their own saves" on public.saves
  for insert to authenticated with check (user_id = auth.uid());
create policy "readers remove their own saves" on public.saves
  for delete to authenticated using (user_id = auth.uid());

-- What gets saved most, for /admin. Counts only, never who saved what.
create or replace function public.top_saves(max_rows int default 10)
returns table (kind text, ref text, title text, href text, saves bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.kind, s.ref, max(s.title), max(s.href), count(*)
  from public.saves s
  where public.is_admin()
  group by s.kind, s.ref
  order by count(*) desc, max(s.created_at) desc
  limit least(greatest(max_rows, 1), 50);
$$;

revoke all on function public.top_saves(int) from public, anon;
grant execute on function public.top_saves(int) to authenticated;

-- "Delete my account" on /account: removes the caller's login, which
-- removes their saves and synced lists with it (on delete cascade).
-- Admin accounts can't delete themselves here, so the site never loses
-- its last editor by accident.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if exists (select 1 from public.admins where user_id = auth.uid()) then
    raise exception 'Admin accounts are removed in Supabase, not here';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
