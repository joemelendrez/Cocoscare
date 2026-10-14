# Coco's Care

Next.js site for cocoscare.com: a nanny-turned-mom blog with recipes, mom finds, outings and a shop of her picks.

```bash
npm install
npm run dev
```

- Brand: hot pink, ink black and white, with periwinkle, butter and mint accents (`src/app/globals.css`). Fonts are Lilita One (display) and Fredoka (body), self-hosted in `src/app/fonts/`.
- Look: cartoon "stickers" (thick ink outline + hard offset shadow, the `sticker` / `lift` utilities) and hand-drawn doodles (`src/components/Doodles.js`).
- Motion: framer-motion, honoring reduced motion (`Providers.js`). Parallax helpers live in `src/components/Motion.js`.
- Content in `src/lib/content.js` is placeholder (marked "Sample" on the page) until the blog is connected to WordPress and the shop gets real affiliate links.
- Hosted on Netlify (`netlify.toml`).
