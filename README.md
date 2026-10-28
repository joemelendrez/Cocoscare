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

The blog merges two sources:

- **Posts in Coco's own Supabase project**, plus all recipes and shop picks, edited in `/admin`.
- **Live posts on the WordPress subsite** (`cms.habitnova.com/cocoscare`), read over WPGraphQL (`src/lib/wordpress.js`; `WORDPRESS_GRAPHQL_URL` overrides the address, `off` turns it off). A line of `{{product:link-name}}` or `{{recipe:link-name}}` in one shows that shop card or recipe card. A WordPress post stops showing once its `/admin` copy is live (same link name, or pulled in from it).

How a post is made: Coco writes it in her Handoff Hero account (topics, SEO tools, the Generator) and sends it to the WordPress subsite as a **draft**. `/admin` › Posts lists those under "From Handoff Hero"; **Finish here** copies one into a draft post here (Markdown, cover, excerpt from the meta description, category), where she adds photos, product cards and a recipe, then marks it ready for review. A post can also be started in `/admin` (**New post**), and a recipe's page has **Write a post with this recipe**, which opens a new post with that recipe attached and its name, summary and photo filled in (recipes only show on the blog inside a post). Drafts aren't public, so the list needs a WordPress login: **Connect WordPress** on that card sends you to the site's own approve screen (`wp-admin/authorize-application.php`), and WordPress comes back to `/admin` with a new Application Password, which is checked and saved in the `wordpress_connection` table (migration `0003`, admins only through RLS). `WORDPRESS_USERNAME` / `WORDPRESS_APP_PASSWORD` on Netlify still work as a fallback when nothing is connected (`src/lib/wordpressInbox.js`, `/api/admin/wordpress`, admins only).

`/admin` has:

- **Recipes**: ingredients (paste a list or add rows), steps with optional timers (guessed from "bake 20 minutes"), servings, tips and a live preview. Attach one to a post with the recipe picker in the post editor.
- **Shop**: picks with an https affiliate link, price, section, card color and a home-page switch. Any post can show one as a card with a line of `{{product:link-name}}`. Only picks marked **It's one of my faves** show in the shop (`/shop`) and on the home page; the rest only show as cards inside posts, so a "top 10 car seats" roundup doesn't fill the shop. Each fave gets its own page, `/shop/<link name>`, with more photos, a longer review (the post editor, so headings, lists and photos work) and **Featured in**: the live posts that show its card (admin or WordPress) and the recipes that use it. Shop cards say how many. Recipes have a **What I used** list of picks, shown at the end of the recipe card. Needs migration `0005_faves.sql` (until it's run, every live pick stays in the shop and the new fields are hidden). `supabase/demo_fave_pages.sql` fills two demo picks with an example review and photos. A pick needs her own photo: Amazon's photos can't be pulled in (SiteStripe's image link is retired, and the Associates agreement only allows them through PA-API), so a pick without one shows a heart.
- **Posts**: a what-you-see editor (Tiptap, `src/components/admin/RichEditor.js`) with headings, bold, italic, links, lists, quotes, photos (with a description), product and recipe cards you can drag, and an FAQ button. It still saves Markdown (`src/lib/editorMarkdown.js`), so the blog renders posts the same way. Also a recipe picker, and Draft → Ready for review → Live. Putting a post live also puts its recipe and picks live. A `## Frequently Asked Questions` heading with `### question` / answer pairs under it (what Handoff Hero's FAQ tool writes, in Markdown or WordPress posts) shows as the FAQ card (`FaqBlock.js`, tap to open) with FAQPage data for Google (`splitFaq()` in `src/lib/postBody.js`).

- **Subscribers** (`/admin/subscribers`): the Mailchimp list, read live (`/api/admin/subscribers`): counts, where people joined (their tags), search and Copy emails.
- **Newsletter** (`/admin/newsletter`): write an issue in Markdown, add a live post as a photo + link block, preview it on desktop and phone in the Coco's Care email design (`src/lib/newsletterEmail.js`), send a test to your own email, and save it as a draft campaign in Mailchimp (`/api/admin/newsletter`). Sending and scheduling happen in Mailchimp; nothing here sends to the list. Uses the audience's default From name and email.
- **Section images** (`/admin/images`): a brand color, one Lucide icon on a white sticker and a few words, drawn by `/blog/section-image` (next/og). Download one and add it with the editor's photo button. Covers and pins stay real photos. Icons: `src/lib/sectionIcons.js`, generated by `scripts/build-section-icons.mjs`.

On a post page the recipe card has step timers (with a chime), a servings scaler, an ingredient checklist, Cook mode (keeps the screen on), Print and Pin it, plus Recipe schema for Google. Recipes stay inside their posts; `/recipes` is the index of every published recipe that sits in a live post (search by name or ingredient, filter by time), each card opening the recipe card in its post.

Pages refresh within a minute of a change, and right away after a save in `/admin` (`/api/revalidate`, admins only).

### Setting up the database (once)

1. In Coco's Supabase project, open **SQL Editor**, paste all of `supabase/migrations/0001_init.sql` and run it. It creates the tables, the security rules and the `media` photo bucket. For demo recipes and shop picks while the site is empty, also run `supabase/demo_content.sql` (its top comment has the two lines that remove them).
2. **Authentication → Users → Add user** for each person who edits (Coco, Joseph). Then turn off **Authentication → Sign In / Providers → Email → Allow new users to sign up**, so nobody else can make an account.
3. Make them admins in the SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email in ('coco@example.com', 'joseph@example.com');
   ```
4. On Netlify (**Site configuration → Environment variables**) add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase's **Project Settings → API**, plus `NEXT_PUBLIC_SITE_URL=https://cocoscare.com`. Redeploy.
5. Sign in at `/admin`.

Locally, put the same values in `.env.local` (see `.env.example`).
