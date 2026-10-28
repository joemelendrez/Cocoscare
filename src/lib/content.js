// Sample posts and picks, shown (marked "Sample") only while the site has
// no database connected. Real content is written in /admin.

export const SITE = {
  name: "Coco's Care",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://cocoscare.com",
  tagline: "Real-life mom finds, easy recipes & kid-tested outings",
  description:
    "A career nanny turned stay-at-home mom sharing the recipes, baby and toddler products, and family outings that actually work.",
  // Where Quick posts from Handoff Hero wait as drafts for review.
  // Fill these in once the accounts exist; links without a URL are hidden.
  social: {
    pinterest: null,
    instagram: null,
  },
  // Shown on the privacy and terms pages; fill in once the inbox exists.
  email: null,
};

export const NAV = [
  { href: "/", label: "Home", color: "pink" },
  { href: "/blog", label: "Blog", color: "butter" },
  { href: "/shop", label: "Shop", color: "periwinkle" },
  { href: "/tools", label: "Tools", color: "pink" },
  { href: "/about", label: "About", color: "mint" },
];

// Tailwind needs full class names written out, so colors map here. `hero`
// is the title band: white on hot pink, ink on the other pastels.
export const COLOR = {
  pink: { bg: "bg-pink", hero: "bg-pink text-paper dots", soft: "bg-pink-soft", text: "text-pink" },
  butter: { bg: "bg-butter", hero: "bg-butter text-ink dots-ink", soft: "bg-butter/30", text: "text-butter" },
  periwinkle: { bg: "bg-periwinkle", hero: "bg-periwinkle text-ink dots-ink", soft: "bg-periwinkle/25", text: "text-periwinkle" },
  mint: { bg: "bg-mint", hero: "bg-mint text-ink dots-ink", soft: "bg-mint/30", text: "text-mint" },
};

export const CATEGORIES = [
  {
    key: "recipes",
    label: "Recipes",
    blurb: "Toddler-approved snacks, freezer meals and weekend bakes.",
    color: "butter",
    icon: "whisk",
  },
  {
    key: "mom-finds",
    label: "Mom Finds",
    blurb: "Baby gear, toddler stuff and the clothes I actually live in.",
    color: "periwinkle",
    icon: "bag",
  },
  {
    key: "outings",
    label: "Outings",
    blurb: "Parks, museums and rainy-day spots worth the car seat battle.",
    color: "mint",
    icon: "pin",
  },
  {
    key: "nanny-tips",
    label: "Nanny Tips",
    blurb: "Naps, picky eaters and meltdowns, from 10+ years of nannying.",
    color: "pink",
    icon: "heart",
  },
];

export function categoryFor(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}

export const SAMPLE_POSTS = [
  {
    slug: "banana-oat-muffins",
    title: "3-Ingredient Banana Oat Muffins My Toddler Asks For Daily",
    category: "recipes",
    minutes: 5,
    excerpt: "No sugar, one bowl, and they freeze like a dream.",
  },
  {
    slug: "best-diaper-bag",
    title: "The Diaper Bag I Bought After Testing 6 as a Nanny",
    category: "mom-finds",
    minutes: 7,
    excerpt: "What matters after year two: pockets, straps, and wipeability.",
  },
  {
    slug: "rainy-day-outings",
    title: "8 Rainy-Day Outings Under $10 for Toddlers",
    category: "outings",
    minutes: 6,
    excerpt: "Library story time is just the start.",
  },
  {
    slug: "toddler-nap-tips",
    title: "How I Got Every Toddler I Nannied to Nap",
    category: "nanny-tips",
    minutes: 8,
    excerpt: "The wind-down routine I used for a decade of naps.",
  },
  {
    slug: "freezer-meals",
    title: "10 Freezer Meals I Prep Before a Busy Week",
    category: "recipes",
    minutes: 9,
    excerpt: "Dump-and-go dinners that reheat without going soggy.",
  },
  {
    slug: "comfy-mom-outfits",
    title: "Comfy Mom Outfits That Still Feel Put Together",
    category: "mom-finds",
    minutes: 5,
    excerpt: "Ribbed tees, joggers and the one cardigan I wear weekly.",
  },
];

export const SHOP_SECTIONS = [
  { key: "all", label: "Everything" },
  { key: "baby", label: "Baby" },
  { key: "toddler", label: "Toddler" },
  { key: "kitchen", label: "Kitchen" },
  { key: "mom", label: "For Mom" },
  { key: "outings", label: "On the Go" },
];

// Placeholder picks with real Amazon search links (tagged at render time by
// withTaggedUrl too). Swap in Coco's own favorites from /admin.
// Two of these have their own page with a longer review (details, in
// Markdown, and photos), as examples of a fave's page.
export const SAMPLE_PICKS = [
  {
    name: "Bumbo Floor Seat with Play Tray",
    section: "baby",
    note: "Holds them upright for tummy-time breaks, tray snaps on for snacks.",
    color: "periwinkle",
    url: "https://www.amazon.com/s?k=Bumbo+Floor+Seat+with+Play+Tray&tag=joseph0f30b-20",
  },
  {
    name: "ezpz Happy Mat",
    section: "toddler",
    note: "Plate and placemat in one that suctions to the table.",
    color: "mint",
    url: "https://www.amazon.com/s?k=ezpz+Happy+Mat&tag=joseph0f30b-20",
  },
  {
    slug: "demo-mini-muffin-tin",
    name: "Wilton Mini Muffin Pan, 24 Cup",
    section: "kitchen",
    photos: ["https://images.unsplash.com/photo-1776669234305-ee38904fb49c?w=1200&q=80&auto=format&fit=crop", "https://images.unsplash.com/photo-1732290136256-702cc4c030c0?w=1200&q=80&auto=format&fit=crop"],
    details: `## Why it earned a spot

Toddler hands want food they can hold, and a regular muffin is two bites too big. Twenty four little cups means one batch covers snacks for most of the week, and the extras freeze flat in a bag.

## What I make in it

- Banana oat muffins with no added sugar
- Egg bites with spinach and cheese for grab-and-go breakfasts
- Frozen yogurt bites for teething days
- Mini meatloaves, which somehow get eaten when the big one doesn't

## Tips

- Grease every cup, even with liners. The edges stick otherwise.
- Bake on the middle rack and start checking 5 minutes early. Minis go from done to dry fast.
- Fill cups about two thirds full so the tops stay round and easy to pop out.

## Anything I'd change?

It's not nonstick enough to skip greasing, and it takes a minute to scrub the corners. For the price, I still buy this one again.`,
    note: "Toddler-sized muffins, egg bites and frozen yogurt bites.",
    color: "butter",
    url: "https://www.amazon.com/s?k=Wilton+mini+muffin+pan+24+cup&tag=joseph0f30b-20",
  },
  {
    name: "Owala FreeSip Water Bottle",
    section: "mom",
    note: "Sip or swig, one hand, and it does not leak in the diaper bag.",
    color: "pink",
    url: "https://www.amazon.com/s?k=Owala+FreeSip+water+bottle&tag=joseph0f30b-20",
  },
  {
    slug: "demo-backpack-diaper-bag",
    name: "Itzy Ritzy Dream Backpack Diaper Bag",
    section: "outings",
    photos: ["https://images.unsplash.com/photo-1773573924969-33c2ba2d7707?w=1200&q=80&auto=format&fit=crop", "https://images.unsplash.com/photo-1580639724233-04ed592f3ab0?w=1200&q=80&auto=format&fit=crop"],
    details: `## Why it earned a spot

A backpack diaper bag leaves both hands free for a stroller, a toddler and a coffee. This one wipes clean, stands up on its own, and the zip pockets mean I'm not digging for a pacifier at the bottom.

## What I keep in it

- A changing pad and a slim wipes case in the front pocket
- Two outfits rolled up in a zip bag
- Bottles or a sippy cup in the insulated side pockets
- Snacks in a clip-on snack catcher
- My phone and keys in the top pocket so I can grab them with one hand

## Tips

- Clip it to the stroller handle with stroller hooks and it won't tip the stroller.
- Restock it the night before an outing, not on the way out the door.

## Anything I'd change?

The straps could be a bit more padded for long days at the zoo. Everything else, I'd buy again.`,
    note: "Hands free, wipeable, with insulated bottle pockets.",
    color: "periwinkle",
    url: "https://www.amazon.com/s?k=Itzy+Ritzy+Dream+Backpack+diaper+bag&tag=joseph0f30b-20",
  },
  {
    name: "Munchkin Snack Catcher",
    section: "toddler",
    note: "Soft flaps let little hands in and keep the crackers from spilling.",
    color: "butter",
    url: "https://www.amazon.com/s?k=Munchkin+Snack+Catcher&tag=joseph0f30b-20",
  },
  {
    name: "aden + anais Muslin Swaddles",
    section: "baby",
    note: "Breathable muslin: swaddle, burp cloth, nursing cover, stroller shade.",
    color: "mint",
    url: "https://www.amazon.com/s?k=aden+anais+muslin+swaddle+blankets+4+pack&tag=joseph0f30b-20",
  },
  {
    name: "Kindle Paperwhite",
    section: "mom",
    note: "One-handed reading during night feeds, no bright screen.",
    color: "pink",
    url: "https://www.amazon.com/s?k=Kindle+Paperwhite&tag=joseph0f30b-20",
  },
];
