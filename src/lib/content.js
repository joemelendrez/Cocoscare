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
};

export const NAV = [
  { href: "/", label: "Home", color: "pink" },
  { href: "/blog", label: "Blog", color: "butter" },
  { href: "/shop", label: "Shop", color: "periwinkle" },
  { href: "/about", label: "About", color: "mint" },
];

// Tailwind needs full class names written out, so colors map here.
export const COLOR = {
  pink: { bg: "bg-pink", hero: "bg-pink-hero", soft: "bg-pink-soft", text: "text-pink" },
  butter: { bg: "bg-butter", hero: "bg-butter-hero", soft: "bg-butter/30", text: "text-butter" },
  periwinkle: { bg: "bg-periwinkle", hero: "bg-periwinkle-hero", soft: "bg-periwinkle/25", text: "text-periwinkle" },
  mint: { bg: "bg-mint", hero: "bg-mint-hero", soft: "bg-mint/30", text: "text-mint" },
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

// `url` stays null until Coco adds her affiliate link; the card then shows
// "Link coming soon" instead of a dead button.
export const SAMPLE_PICKS = [
  {
    name: "Floor seat with tray",
    section: "baby",
    note: "Bought it for a nanny family, then for us.",
    color: "periwinkle",
    url: null,
  },
  {
    name: "Silicone suction plates",
    section: "toddler",
    note: "The only plates that survived the throw phase.",
    color: "mint",
    url: null,
  },
  { name: "Mini muffin tin", section: "kitchen", note: "Toddler-sized everything. Used weekly.", color: "butter", url: null },
  { name: "Ribbed crop tee", section: "mom", note: "Soft, cute, hides spit-up. Have it in 4 colors.", color: "pink", url: null },
  {
    name: "Backpack diaper bag",
    section: "outings",
    note: "Hands free, wipeable, a pocket for everything.",
    color: "periwinkle",
    url: null,
  },
  { name: "Snack spinner cups", section: "toddler", note: "Fewer crushed crackers in the car seat.", color: "butter", url: null },
  { name: "Swaddle blankets", section: "baby", note: "Burp cloth, nursing cover, stroller shade.", color: "mint", url: null },
  { name: "Joggers with pockets", section: "mom", note: "Phone, keys, pacifier. Real pockets.", color: "pink", url: null },
];
