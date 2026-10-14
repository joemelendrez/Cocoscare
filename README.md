# Coco's Care

Next.js site for cocoscare.com: a nanny-turned-mom blog with recipes, mom finds, outings and a shop of her picks.

```bash
npm install
npm run dev
```

- Brand: hot pink, ink black and white, with periwinkle, butter and mint accents (`src/app/globals.css`). Fonts are Lilita One (display) and Fredoka (body), self-hosted in `src/app/fonts/`.
- Look: cartoon "stickers" (thick ink outline + hard offset shadow, the `sticker` / `lift` utilities) and hand-drawn doodles (`src/components/Doodles.js`).
- Motion: framer-motion, honoring reduced motion (`Providers.js`). Parallax helpers live in `src/components/Motion.js`.
- Without a database the site shows the placeholder content in `src/lib/content.js`, marked "Sample" on the page.
- Hosted on Netlify (`netlify.toml`).

## Content and the admin

Posts, recipes and shop picks live in Coco's own Supabase project. `/admin` is where they're written:

- **Recipes**: ingredients (paste a list or add rows), steps with optional timers (guessed from "bake 20 minutes"), servings, tips and a live preview. "Make it a blog post" starts a draft post with the recipe card attached.
- **Shop**: picks with an https affiliate link, price, section, card color and a home-page switch. Any post can show one as a card with a line of `{{product:link-name}}`.
- **Posts**: Markdown with toolbar buttons for headings, photos and product cards, a recipe picker, and Draft → Ready for review → Live. Putting a post live also puts its recipe and picks live.

On a post page the recipe card has step timers (with a chime), a servings scaler, an ingredient checklist, Cook mode (keeps the screen on), Print and Pin it, plus Recipe schema for Google.

Pages refresh within a minute of a change, and right away after a save in `/admin` (`/api/revalidate`, admins only).

### Setting up the database (once)

1. In Coco's Supabase project, open **SQL Editor**, paste all of `supabase/migrations/0001_init.sql` and run it. It creates the tables, the security rules and the `media` photo bucket.
2. **Authentication → Users → Add user** for each person who edits (Coco, Joseph). Then turn off **Authentication → Sign In / Providers → Email → Allow new users to sign up**, so nobody else can make an account.
3. Make them admins in the SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email in ('coco@example.com', 'joseph@example.com');
   ```
4. On Netlify (**Site configuration → Environment variables**) add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase's **Project Settings → API**, plus `NEXT_PUBLIC_SITE_URL=https://cocoscare.com`. Redeploy.
5. Sign in at `/admin`.

Locally, put the same values in `.env.local` (see `.env.example`).
