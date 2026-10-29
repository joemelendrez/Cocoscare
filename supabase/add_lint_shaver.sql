-- Adds the BEAUTURAL fabric shaver as one of Coco's faves, saved as a
-- draft so she can read the review first. Run once in her Supabase SQL
-- editor (needs migrations/0005_faves.sql). Safe to run again: it updates
-- the same pick by its link name. Then in /admin › Shop: add her own photo
-- (Amazon's can't be shown) and switch it to Published.

insert into public.products (slug, name, note, url, section, color, fave, status, details)
values (
  'fabric-shaver-lint-remover',
  'BEAUTURAL Fabric Shaver',
  'Makes a pilled couch and fuzzy sweaters look new again in minutes.',
  'https://link.amazon/B0d1CcSVw',
  'mom',
  'periwinkle',
  true,
  'draft',
  '## Why it earned a spot

Between kids, a dog and a couch that gets jumped on all day, our cushions were covered in little fuzz balls. I almost bought new covers. Ten minutes with this shaver and the couch looked like the day we brought it home.

It works just as well on clothes. Leggings, sweaters, the kids'' fleece pajamas, even the blanket that lives on the couch. Anything with pills gets a quick pass.

## What I use it on

- **The couch:** cushions and arms, the spots everyone sits on most
- **Sweaters and hoodies:** under the arms and along the sides where they rub
- **Kids'' clothes:** fleece pajamas and leggings that pill after a few washes
- **Throw blankets:** the fuzzy ones that get dragged around the house

## Why I like this one

- It''s rechargeable, so there''s no cord to fight with while I work around the couch.
- The little screen shows how much battery is left, so it never dies halfway through a cushion.
- Three speeds: low for thin knits, high for the couch.
- The lint catcher is big enough to do a whole cushion before I empty it.

## Tips

- Lay the fabric flat and keep it pulled a little tight. It works faster and won''t snag.
- Use small circles and light pressure. Let the blades do the work.
- Start on the low speed for anything thin or delicate, and test a hidden spot first.
- Empty the lint catcher often. It cuts better when it isn''t full.

## Anything I''d change?

It''s a little loud on the highest speed, so I do the couch after nap time. Otherwise it''s one of those things I wish I''d bought years ago.'
)
on conflict (slug) do update set
  name = excluded.name,
  note = excluded.note,
  url = excluded.url,
  section = excluded.section,
  color = excluded.color,
  fave = excluded.fave,
  details = excluded.details;
