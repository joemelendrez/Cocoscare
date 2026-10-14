-- The WordPress login /admin uses to read drafts sent from Handoff Hero.
-- Set by /admin's "Connect WordPress" (WordPress's own Application Password
-- approval page), so nobody has to copy a password into Netlify. One row;
-- only admins can read or change it.
create table public.wordpress_connection (
  id boolean primary key default true check (id),
  site_url text not null,
  username text not null,
  app_password text not null,
  connected_by uuid default auth.uid() references auth.users on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.wordpress_connection enable row level security;

create policy "admins manage the wordpress connection" on public.wordpress_connection
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
