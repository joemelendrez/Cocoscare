-- Placeholder shop picks with real Amazon links (tag joseph0f30b-20).
-- Run once in the Supabase SQL editor. Safe to run again.
--
-- Each link is an Amazon search for one specific, well-known product, so it
-- always lands on that product without guessing an ASIN. Swap in the exact
-- product link (and a photo) from /admin once Coco picks her real favorites.
-- Everything here keeps the "demo-" slug, so this still clears them all:
--   delete from public.products where slug like 'demo-%';

-- The 8 original placeholders: real product names and links.
update public.products p set name = v.name, note = v.note, url = v.url
from (values
  ('demo-floor-seat-with-tray', 'Bumbo Floor Seat with Play Tray', 'Holds them upright for tummy-time breaks, tray snaps on for snacks.', 'https://www.amazon.com/s?k=Bumbo+Floor+Seat+with+Play+Tray&tag=joseph0f30b-20'),
  ('demo-swaddle-blankets', 'aden + anais Muslin Swaddles', 'Breathable muslin: swaddle, burp cloth, nursing cover, stroller shade.', 'https://www.amazon.com/s?k=aden+anais+muslin+swaddle+blankets+4+pack&tag=joseph0f30b-20'),
  ('demo-silicone-suction-plates', 'ezpz Happy Mat', 'Plate and placemat in one that suctions to the table.', 'https://www.amazon.com/s?k=ezpz+Happy+Mat&tag=joseph0f30b-20'),
  ('demo-snack-spinner-cups', 'Munchkin Snack Catcher', 'Soft flaps let little hands in and keep the crackers from spilling.', 'https://www.amazon.com/s?k=Munchkin+Snack+Catcher&tag=joseph0f30b-20'),
  ('demo-mini-muffin-tin', 'Wilton Mini Muffin Pan, 24 Cup', 'Toddler-sized muffins, egg bites and frozen yogurt bites.', 'https://www.amazon.com/s?k=Wilton+mini+muffin+pan+24+cup&tag=joseph0f30b-20'),
  ('demo-glass-meal-prep-containers', 'Pyrex Simply Store Glass Containers', 'Oven, microwave and dishwasher safe, with snap-on lids.', 'https://www.amazon.com/s?k=Pyrex+Simply+Store+glass+food+storage+set&tag=joseph0f30b-20'),
  ('demo-ribbed-crop-tee', 'Owala FreeSip Water Bottle', 'Sip or swig, one hand, and it does not leak in the diaper bag.', 'https://www.amazon.com/s?k=Owala+FreeSip+water+bottle&tag=joseph0f30b-20'),
  ('demo-backpack-diaper-bag', 'Itzy Ritzy Dream Backpack Diaper Bag', 'Hands free, wipeable, with insulated bottle pockets.', 'https://www.amazon.com/s?k=Itzy+Ritzy+Dream+Backpack+diaper+bag&tag=joseph0f30b-20')
) as v(slug, name, note, url)
where p.slug = v.slug;

-- A few more, so every section has something.
insert into public.products (slug, name, note, url, section, color, featured, sort, status) values
('demo-hatch-rest', 'Hatch Rest Sound Machine and Night Light', 'White noise, soft light and an OK-to-wake color for later.', 'https://www.amazon.com/s?k=Hatch+Rest+sound+machine&tag=joseph0f30b-20', 'baby', 'periwinkle', false, 9, 'published'),
('demo-water-wow', 'Melissa & Doug Water Wow', 'Mess-free coloring with water. Great for restaurants.', 'https://www.amazon.com/s?k=Melissa+Doug+Water+Wow&tag=joseph0f30b-20', 'toddler', 'butter', false, 10, 'published'),
('demo-instant-pot', 'Instant Pot Duo 6 Quart', 'Dump-and-go dinners on busy weeknights.', 'https://www.amazon.com/s?k=Instant+Pot+Duo+6+quart&tag=joseph0f30b-20', 'kitchen', 'mint', false, 11, 'published'),
('demo-kindle-paperwhite', 'Kindle Paperwhite', 'One-handed reading during night feeds, no bright screen.', 'https://www.amazon.com/s?k=Kindle+Paperwhite&tag=joseph0f30b-20', 'mom', 'pink', false, 12, 'published'),
('demo-stroller-organizer', 'Skip Hop Stroller Organizer', 'Cup holders and a zip pocket that clip onto any stroller.', 'https://www.amazon.com/s?k=Skip+Hop+stroller+organizer&tag=joseph0f30b-20', 'outings', 'mint', false, 13, 'published')
on conflict (slug) do nothing;
