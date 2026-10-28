-- Faves: only picks Coco marks as a fave show in the shop, and each fave
-- gets its own page (/shop/<link name>) with her longer review and extra
-- photos. Picks made just to show a card in a post (a "top 10 car seats"
-- roundup) stay out of the shop.
-- Run once in the Supabase SQL editor of Coco's project. Safe to run again.

alter table public.products add column if not exists fave boolean not null default false;
-- Her longer review, Markdown (same editor as posts, photos allowed).
alter table public.products add column if not exists details text;
-- Extra photos for the fave's page: ["https://…", …], shown after image_url.
alter table public.products add column if not exists photos jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_photos_array') then
    alter table public.products add constraint products_photos_array check (jsonb_typeof(photos) = 'array');
    -- Everything already in the shop stays there.
    update public.products set fave = true;
  end if;
end $$;

-- Recipes list the picks they use ("What I used"), so a fave's page can
-- show the recipes it's in.
alter table public.recipes add column if not exists gear text[] not null default '{}';
