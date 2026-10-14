-- Coco's Care: posts, recipes and shop products, edited from /admin.
-- Run once in the Supabase SQL editor of Coco's own project.
--
-- Anyone can read what's published; only accounts listed in `admins` can
-- read drafts or change anything. After creating Coco's (and your) login
-- under Authentication › Users, add each one:
--   insert into public.admins (user_id) select id from auth.users where email = 'her@email.com';

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- SECURITY DEFINER so table policies can ask "is this an admin?" without
-- needing read access to `admins` themselves.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create policy "admins can see the admin list" on public.admins
  for select to authenticated using (public.is_admin());

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recipes. ingredients: [{ amount: number|null, unit: text, item: text }]
-- steps: [{ text: text, timer_seconds: int|null }]
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  summary text,
  image_url text,
  servings int not null default 4 check (servings between 1 and 100),
  prep_minutes int check (prep_minutes between 0 and 10000),
  cook_minutes int check (cook_minutes between 0 and 10000),
  ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(ingredients) = 'array'),
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  tips text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 160),
  note text,
  image_url text,
  url text check (url is null or url ~ '^https://'),
  price_label text,
  section text not null default 'mom' check (section in ('baby', 'toddler', 'kitchen', 'mom', 'outings')),
  color text not null default 'pink' check (color in ('pink', 'butter', 'periwinkle', 'mint')),
  featured boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Posts. body is Markdown; a line {{product:some-slug}} shows that product
-- as a card. A post with a recipe shows the recipe card after the body.
-- status: draft (Coco writing) → review (ready for Joseph) → published.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'recipes' check (category in ('recipes', 'mom-finds', 'outings', 'nanny-tips')),
  excerpt text,
  body text not null default '',
  cover_url text,
  recipe_id uuid references public.recipes on delete set null,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_published_idx on public.posts (published_at desc) where status = 'published';
create index posts_recipe_idx on public.posts (recipe_id);

create trigger recipes_touch before update on public.recipes for each row execute function public.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

alter table public.recipes enable row level security;
alter table public.products enable row level security;
alter table public.posts enable row level security;

create policy "published recipes are public" on public.recipes
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "admins manage recipes" on public.recipes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "published products are public" on public.products
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "published posts are public" on public.posts
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "admins manage posts" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Photos: a public bucket anyone can view, only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
