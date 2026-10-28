import { publicClient } from "@/lib/supabase";
import { SAMPLE_PICKS, SAMPLE_POSTS } from "@/lib/content";
import { getWordpressPost, getWordpressPosts, stripTags, wordpressConfigured } from "@/lib/wordpress";
import { withTaggedUrl } from "@/lib/amazon";

// Reads published content: posts written in /admin and recipes and picks
// from Coco's Supabase project, plus live posts sent from Handoff Hero to
// WordPress. With
// neither (or if both reads fail) pages show the sample content instead,
// marked "Sample".

const SAMPLES = {
  posts: SAMPLE_POSTS.map((p) => ({ ...p, sample: true })),
  products: SAMPLE_PICKS.map((p) => ({ ...p, slug: p.slug || null, fave: true, photos: p.photos || [], sample: true })),
};

export function readingMinutes(text = "", { html = false } = {}) {
  const words = (html ? stripTags(text) : text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const POST_FIELDS = "slug, title, category, excerpt, cover_url, published_at, body, wordpress_id";

function toCard(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt || "",
    cover_url: row.cover_url,
    published_at: row.published_at,
    minutes: readingMinutes(row.body),
    wordpress_id: row.wordpress_id,
  };
}

async function supabasePosts(limit, category) {
  const db = publicClient();
  if (!db) return null;
  let query = db.from("posts").select(POST_FIELDS).eq("status", "published").order("published_at", { ascending: false }).limit(limit);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) {
    console.error("getPosts failed", error.message);
    return null;
  }
  return data.map(toCard);
}

// A WordPress post is hidden once its /admin copy is live: same slug, or
// pulled in from it (wordpress_id), even if the slug was changed since.
function notCopied(own) {
  const slugs = new Set(own.map((p) => p.slug));
  const ids = new Set(own.map((p) => p.wordpress_id).filter(Boolean));
  return (p) => !slugs.has(p.slug) && !ids.has(p.wordpress_id);
}

// Both sources, newest first.
export async function getPosts({ limit = 60, category } = {}) {
  const [own, wp] = await Promise.all([supabasePosts(limit, category), wordpressConfigured ? getWordpressPosts() : null]);
  const wpPosts = (wp || []).filter((p) => !category || p.category === category);
  if (own === null && !wpPosts.length) {
    const samples = SAMPLES.posts.filter((p) => !category || p.category === category);
    return { posts: samples.slice(0, limit), sample: true };
  }
  const posts = [...(own || []), ...wpPosts.filter(notCopied(own || []))]
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""))
    .slice(0, limit);
  return { posts, sample: false };
}

const PICK_FIELDS = "slug, name, note, image_url, url, price_label, section, color, featured";

// Until migration 0005 (faves) is run the new columns don't exist: reads
// retry the old way and treat every live pick as a fave, as before.
const missingColumn = (error) => error && (error.code === "42703" || error.code === "PGRST204" || /column .* does not exist/i.test(error.message || ""));

async function withFaveFallback(run) {
  const first = await run(true);
  if (!missingColumn(first.error)) return first;
  const old = await run(false);
  return { ...old, data: old.data && old.data.map((p) => ({ ...p, fave: true })) };
}

// The shop: only picks marked as a fave. Picks made just for a card in a
// post (a roundup of car seats) stay out.
export async function getProducts({ limit = 200, featured } = {}) {
  const db = publicClient();
  if (!db) return { products: SAMPLES.products.slice(0, limit), sample: true };
  const { data, error } = await withFaveFallback((faves) => {
    let query = db
      .from("products")
      .select(faves ? `${PICK_FIELDS}, fave` : PICK_FIELDS)
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);
    if (faves) query = query.eq("fave", true);
    if (featured) query = query.eq("featured", true);
    return query;
  });
  if (error) {
    console.error("getProducts failed", error.message);
    return { products: SAMPLES.products.slice(0, limit), sample: true };
  }
  return { products: data.map(withTaggedUrl), sample: false };
}

// One fave for its own page (/shop/<slug>), or null. A pick that isn't a
// fave has no page.
export async function getFave(slug) {
  const db = publicClient();
  if (!db) return SAMPLES.products.find((p) => p.slug === slug && p.details) || null;
  const { data, error } = await db.from("products").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) console.error("getFave failed", error.message);
  if (!data || data.fave === false) return null;
  return withTaggedUrl({ ...data, fave: true, photos: Array.isArray(data.photos) ? data.photos.filter(Boolean) : [] });
}

export async function getFaveSlugs() {
  const db = publicClient();
  if (!db) return SAMPLES.products.filter((p) => p.slug && p.details).map((p) => ({ slug: p.slug }));
  const { data } = await withFaveFallback((faves) => {
    const query = db.from("products").select("slug, updated_at").eq("status", "published");
    return faves ? query.eq("fave", true) : query;
  });
  return data || [];
}

// How many live posts and recipes each pick is in, for the shop's cards.
export async function getFeaturedCounts() {
  const db = publicClient();
  if (!db) return {};
  const [{ data: own }, wp, { data: gear }] = await Promise.all([
    db.from("posts").select("slug, body, wordpress_id").eq("status", "published"),
    wordpressConfigured ? getWordpressPosts(100, { withContent: true }) : null,
    db.from("recipes").select("gear").eq("status", "published"),
  ]);
  const counts = {};
  const add = (slugs) => slugs.forEach((s) => (counts[s] = (counts[s] || 0) + 1));
  (own || []).forEach((p) => add(productSlugsIn(p.body)));
  (wp || []).filter(notCopied(own || [])).forEach((p) => add(productSlugsIn(p.html)));
  (gear || []).forEach((r) => add([...new Set(r.gear || [])]));
  return counts;
}

// Where a fave shows up: live posts with its card ({{product:slug}}), and
// recipes that list it under "What I used" or sit in one of those posts.
export async function getFeaturedIn(slug) {
  const db = publicClient();
  if (!db) return { posts: [], recipes: [] };
  const has = (body) => productSlugsIn(body || "").includes(slug);
  const [{ data: own }, wp, { data: gear, error: gearError }, recipeList] = await Promise.all([
    db.from("posts").select(`${POST_FIELDS}, recipe_id`).eq("status", "published").order("published_at", { ascending: false }),
    wordpressConfigured ? getWordpressPosts(100, { withContent: true }) : null,
    db.from("recipes").select("id, slug").eq("status", "published").contains("gear", [slug]),
    getRecipeList(),
  ]);
  if (gearError && !missingColumn(gearError)) console.error("getFeaturedIn gear failed", gearError.message);
  const ownPosts = own || [];
  const ownHits = ownPosts.filter((p) => has(p.body));
  const wpHits = (wp || []).filter(notCopied(ownPosts)).filter((p) => has(p.html));
  const posts = [...ownHits.map(toCard), ...wpHits.map(({ html, ...card }) => card)].sort((a, b) =>
    (b.published_at || "").localeCompare(a.published_at || ""),
  );
  const recipeSlugs = new Set([...(gear || []).map((r) => r.slug), ...ownHits.flatMap((p) => recipeSlugsIn(p.body)), ...wpHits.flatMap((p) => recipeSlugsIn(p.html))]);
  const attached = new Set(ownHits.map((p) => p.recipe_id).filter(Boolean));
  const recipes = recipeList.filter((r) => r.href && (recipeSlugs.has(r.slug) || attached.has(r.id)));
  return { posts, recipes };
}

// Cards in a post body: {{product:link-name}} and {{recipe:link-name}},
// each on its own line, anywhere in the post (admin or WordPress).
export const CARD_TOKEN = /^[ \t]*\{\{\s*(product|recipe):([a-z0-9-]+)\s*\}\}[ \t]*$/gm;
const ANY_TOKEN = /\{\{\s*(product|recipe):([a-z0-9-]+)\s*\}\}/g;

export const cardToken = (kind, slug) => `{{${kind}:${slug}}}`;

function slugsIn(body = "", kind) {
  return [...new Set([...body.matchAll(ANY_TOKEN)].filter((m) => m[1] === kind).map((m) => m[2]))];
}
export const productSlugsIn = (body) => slugsIn(body, "product");
export const recipeSlugsIn = (body) => slugsIn(body, "recipe");

// A code pasted in the middle of a line moves onto a line of its own.
export function cardLines(markdown = "") {
  return markdown.replace(/[ \t]*(\{\{\s*(?:product|recipe):[a-z0-9-]+\s*\}\})[ \t]*/g, "\n\n$1\n\n").replace(/\n{3,}/g, "\n\n");
}

// WordPress wraps a code line in <p>…</p>; put it on its own line instead.
function tokenLines(html) {
  return html.replace(/<p[^>]*>\s*(\{\{\s*(?:product|recipe):[a-z0-9-]+\s*\}\})\s*<\/p>/g, "\n$1\n");
}

async function productsBySlug(db, slugs) {
  if (!db || !slugs.length) return [];
  const { data } = await withFaveFallback((faves) =>
    db
      .from("products")
      .select(faves ? `${PICK_FIELDS}, fave` : PICK_FIELDS)
      .eq("status", "published")
      .in("slug", slugs),
  );
  return (data || []).map(withTaggedUrl);
}

const productsFor = (db, body) => productsBySlug(db, productSlugsIn(body));

// Each recipe gets the live picks it lists under "What I used".
async function withGear(db, recipes) {
  const slugs = [...new Set(recipes.flatMap((r) => r?.gear || []))];
  if (!slugs.length) return recipes;
  const picks = await productsBySlug(db, slugs);
  const bySlug = new Map(picks.map((p) => [p.slug, p]));
  return recipes.map((r) => (r ? { ...r, gearProducts: (r.gear || []).map((s) => bySlug.get(s)).filter(Boolean) } : r));
}

// Recipes still in draft don't come back (RLS), so they aren't shown.
async function recipesFor(db, body) {
  const slugs = recipeSlugsIn(body);
  if (!db || !slugs.length) return [];
  const { data } = await db.from("recipes").select("*").eq("status", "published").in("slug", slugs);
  return slugs.map((s) => (data || []).find((r) => r.slug === s)).filter(Boolean);
}

async function ownPost(db, slug) {
  const { data: post, error } = await db
    .from("posts")
    .select("id, slug, title, category, excerpt, body, cover_url, published_at, updated_at, recipe:recipes(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) console.error("getPost failed", error.message);
  if (!post) return null;
  // A recipe still in draft doesn't come back (RLS), so it isn't shown.
  const [products, found] = await Promise.all([productsFor(db, post.body), recipesFor(db, post.body)]);
  const [recipe, ...recipes] = await withGear(db, [post.recipe || null, ...found]);
  return { ...post, source: "admin", recipe, products, recipes };
}

async function wordpressPost(db, slug) {
  const post = await getWordpressPost(slug);
  if (!post) return null;
  const html = tokenLines(post.html);
  const [products, found] = await Promise.all([productsFor(db, html), recipesFor(db, html)]);
  return { ...post, html, recipe: null, products, recipes: await withGear(db, found) };
}

export async function getPost(slug) {
  const db = publicClient();
  return (db && (await ownPost(db, slug))) || (wordpressConfigured ? await wordpressPost(db, slug) : null);
}

export async function getPostSlugs() {
  const db = publicClient();
  const [own, wp] = await Promise.all([
    db ? db.from("posts").select("slug, updated_at, wordpress_id").eq("status", "published").then(({ data }) => data || []) : [],
    wordpressConfigured ? getWordpressPosts() : [],
  ]);
  return [...own.map((p) => ({ slug: p.slug, updated_at: p.updated_at })), ...wp.filter(notCopied(own)).map((p) => ({ slug: p.slug, updated_at: p.updated_at }))];
}

// Every published recipe for the Grocery List tool's recipe search, with
// a link to its card in the newest post that has it. A recipe that isn't
// in any post yet has no link.
export async function getRecipeList() {
  const db = publicClient();
  if (!db) return [];
  const [{ data: recipes, error }, { data: posts }, wp] = await Promise.all([
    db
      .from("recipes")
      .select("id, slug, title, summary, image_url, servings, prep_minutes, cook_minutes, ingredients")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(300),
    db
      .from("posts")
      .select("slug, body, recipe_id, wordpress_id, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    wordpressConfigured ? getWordpressPosts(100, { withContent: true }) : null,
  ]);
  if (error) {
    console.error("getRecipeList failed", error.message);
    return [];
  }
  // Cards get #recipe, #recipe-2, ... in page order, with the attached
  // recipe last when it isn't in the post too (as the post page does).
  const published = new Set(recipes.map((r) => r.slug));
  const own = posts || [];
  const home = new Map();
  const place = (postSlug, slugs) =>
    slugs
      .filter((s) => published.has(s))
      .forEach((s, i) => home.has(s) || home.set(s, `/blog/${postSlug}#${i ? `recipe-${i + 1}` : "recipe"}`));
  for (const p of own) {
    const attached = recipes.find((r) => r.id === p.recipe_id)?.slug;
    const inBody = recipeSlugsIn(p.body || "");
    place(p.slug, attached && !inBody.includes(attached) ? [...inBody, attached] : inBody);
  }
  for (const p of (wp || []).filter(notCopied(own))) place(p.slug, recipeSlugsIn(p.html || ""));
  return recipes.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary || "",
    image_url: r.image_url,
    servings: r.servings,
    minutes: (r.prep_minutes || 0) + (r.cook_minutes || 0),
    ingredients: (r.ingredients || [])
      .filter((i) => i?.item)
      .map((i) => ({ amount: i.amount ?? null, unit: i.unit || "", item: i.item })),
    href: home.get(r.slug) || null,
  }));
}
