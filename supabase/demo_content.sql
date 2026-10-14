-- Demo recipes and shop picks so the site has something in it while Coco
-- adds her own. Run once in Supabase's SQL Editor. Every row's link name
-- starts with "demo-", so they're easy to find and remove later:
--
--   delete from public.recipes where slug like 'demo-%';
--   delete from public.products where slug like 'demo-%';
--
-- Shop picks have no link yet (add Coco's affiliate link in /admin › Shop).

insert into public.recipes (slug, title, summary, servings, prep_minutes, cook_minutes, ingredients, steps, tips, status) values
(
  'demo-banana-oat-mini-muffins',
  'Banana Oat Mini Muffins',
  'Soft, lightly sweet mini muffins that toddlers can hold. No refined sugar, and they freeze well.',
  24, 10, 15,
  '[{"amount":3,"unit":"","item":"ripe bananas"},{"amount":2,"unit":"cups","item":"rolled oats"},{"amount":2,"unit":"","item":"eggs"},{"amount":0.25,"unit":"cup","item":"plain yogurt"},{"amount":2,"unit":"tbsp","item":"maple syrup"},{"amount":1,"unit":"tsp","item":"baking powder"},{"amount":0.5,"unit":"tsp","item":"cinnamon"}]',
  '[{"text":"Heat the oven to 350°F and grease a mini muffin tin.","timer_seconds":null},{"text":"Blend everything until smooth, about 1 minute.","timer_seconds":60},{"text":"Fill each cup about three quarters full.","timer_seconds":null},{"text":"Bake 15 minutes, until the tops spring back.","timer_seconds":900},{"text":"Cool 10 minutes in the tin before popping them out.","timer_seconds":600}]',
  'Freeze in a bag and warm one for 15 seconds in the microwave on busy mornings.',
  'published'
),
(
  'demo-sheet-pan-chicken-veggies',
  'Sheet Pan Chicken and Veggies',
  'One pan, one timer, dinner for the whole family. Cut the veggies small for little ones.',
  4, 15, 25,
  '[{"amount":1.5,"unit":"lb","item":"chicken thighs, cut in bite-size pieces"},{"amount":2,"unit":"cups","item":"broccoli florets"},{"amount":1,"unit":"","item":"sweet potato, diced"},{"amount":1,"unit":"","item":"red bell pepper, diced"},{"amount":2,"unit":"tbsp","item":"olive oil"},{"amount":1,"unit":"tsp","item":"garlic powder"},{"amount":1,"unit":"tsp","item":"paprika"},{"amount":0.5,"unit":"tsp","item":"salt"}]',
  '[{"text":"Heat the oven to 425°F and line a sheet pan.","timer_seconds":null},{"text":"Toss the chicken and veggies with the oil and spices right on the pan.","timer_seconds":null},{"text":"Spread everything in one layer so it roasts instead of steams.","timer_seconds":null},{"text":"Roast 25 minutes, stirring once halfway.","timer_seconds":1500}]',
  'Serve the toddler portion with a little plain yogurt for dipping.',
  'published'
),
(
  'demo-strawberry-yogurt-bark',
  'Strawberry Yogurt Bark',
  'A cold, crunchy snack for hot afternoons. Five minutes of work and the freezer does the rest.',
  6, 5, 0,
  '[{"amount":2,"unit":"cups","item":"plain Greek yogurt"},{"amount":2,"unit":"tbsp","item":"honey (skip for babies under 1)"},{"amount":1,"unit":"cup","item":"strawberries, sliced"},{"amount":0.25,"unit":"cup","item":"blueberries"}]',
  '[{"text":"Stir the honey into the yogurt.","timer_seconds":null},{"text":"Spread it on a parchment-lined tray about half an inch thick.","timer_seconds":null},{"text":"Press the fruit on top.","timer_seconds":null},{"text":"Freeze 2 hours, then break into pieces.","timer_seconds":7200}]',
  'Keep the pieces in a freezer bag with parchment between layers so they don''t stick.',
  'published'
),
(
  'demo-cheesy-veggie-quesadillas',
  'Cheesy Veggie Quesadillas',
  'A 15 minute lunch that hides spinach in plain sight. Cut into triangles for little hands.',
  4, 5, 10,
  '[{"amount":4,"unit":"","item":"flour tortillas"},{"amount":1.5,"unit":"cups","item":"shredded cheddar"},{"amount":1,"unit":"cup","item":"baby spinach, chopped"},{"amount":0.5,"unit":"cup","item":"black beans, rinsed"},{"amount":0.5,"unit":"cup","item":"corn"}]',
  '[{"text":"Scatter cheese, spinach, beans and corn over half of each tortilla, then fold.","timer_seconds":null},{"text":"Cook in a dry pan over medium heat, 3 minutes a side, until golden.","timer_seconds":360},{"text":"Rest 2 minutes so the cheese sets, then cut into triangles.","timer_seconds":120}]',
  'Serve with salsa or guacamole for dipping.',
  'published'
)
on conflict (slug) do nothing;

insert into public.products (slug, name, note, section, color, featured, sort, status) values
('demo-floor-seat-with-tray', 'Floor seat with tray', 'Bought it for a nanny family, then for us.', 'baby', 'periwinkle', true, 1, 'published'),
('demo-swaddle-blankets', 'Muslin swaddle blankets', 'Burp cloth, nursing cover, stroller shade.', 'baby', 'mint', false, 2, 'published'),
('demo-silicone-suction-plates', 'Silicone suction plates', 'The only plates that survived the throw phase.', 'toddler', 'mint', true, 3, 'published'),
('demo-snack-spinner-cups', 'Snack spinner cups', 'Fewer crushed crackers in the car seat.', 'toddler', 'butter', false, 4, 'published'),
('demo-mini-muffin-tin', 'Mini muffin tin', 'Toddler-sized everything. Used weekly.', 'kitchen', 'butter', true, 5, 'published'),
('demo-glass-meal-prep-containers', 'Glass meal prep containers', 'Lunches for the week, straight to the microwave.', 'kitchen', 'pink', false, 6, 'published'),
('demo-ribbed-crop-tee', 'Ribbed crop tee', 'Soft, cute, hides spit-up. Have it in 4 colors.', 'mom', 'pink', false, 7, 'published'),
('demo-backpack-diaper-bag', 'Backpack diaper bag', 'Hands free, wipeable, a pocket for everything.', 'outings', 'periwinkle', true, 8, 'published')
on conflict (slug) do nothing;
