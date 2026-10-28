-- Example fave pages: fills in two of the demo shop picks with a longer
-- review and extra photos, so /shop/demo-mini-muffin-tin and
-- /shop/demo-backpack-diaper-bag show what a fave's page looks like.
-- Run after migrations/0005_faves.sql. Safe to run again. Edit or replace
-- the words and photos from /admin › Shop.

update public.products set fave = true,
  photos = '["https://images.unsplash.com/photo-1776669234305-ee38904fb49c?w=1200&q=80&auto=format&fit=crop", "https://images.unsplash.com/photo-1732290136256-702cc4c030c0?w=1200&q=80&auto=format&fit=crop"]'::jsonb,
  details = '## Why it earned a spot

Toddler hands want food they can hold, and a regular muffin is two bites too big. Twenty four little cups means one batch covers snacks for most of the week, and the extras freeze flat in a bag.

## What I make in it

- Banana oat muffins with no added sugar
- Egg bites with spinach and cheese for grab-and-go breakfasts
- Frozen yogurt bites for teething days
- Mini meatloaves, which somehow get eaten when the big one doesn''t

## Tips

- Grease every cup, even with liners. The edges stick otherwise.
- Bake on the middle rack and start checking 5 minutes early. Minis go from done to dry fast.
- Fill cups about two thirds full so the tops stay round and easy to pop out.

## Anything I''d change?

It''s not nonstick enough to skip greasing, and it takes a minute to scrub the corners. For the price, I still buy this one again.'
where slug = 'demo-mini-muffin-tin';

update public.products set fave = true,
  photos = '["https://images.unsplash.com/photo-1773573924969-33c2ba2d7707?w=1200&q=80&auto=format&fit=crop", "https://images.unsplash.com/photo-1580639724233-04ed592f3ab0?w=1200&q=80&auto=format&fit=crop"]'::jsonb,
  details = '## Why it earned a spot

A backpack diaper bag leaves both hands free for a stroller, a toddler and a coffee. This one wipes clean, stands up on its own, and the zip pockets mean I''m not digging for a pacifier at the bottom.

## What I keep in it

- A changing pad and a slim wipes case in the front pocket
- Two outfits rolled up in a zip bag
- Bottles or a sippy cup in the insulated side pockets
- Snacks in a clip-on snack catcher
- My phone and keys in the top pocket so I can grab them with one hand

## Tips

- Clip it to the stroller handle with stroller hooks and it won''t tip the stroller.
- Restock it the night before an outing, not on the way out the door.

## Anything I''d change?

The straps could be a bit more padded for long days at the zoo. Everything else, I''d buy again.'
where slug = 'demo-backpack-diaper-bag';
