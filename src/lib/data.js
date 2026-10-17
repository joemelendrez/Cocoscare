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
  products: SAMPLE_PICKS.map((p) => ({ ...p, slug: null, sample: true })),
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

export async function getProducts({ limit = 200, featured } = {}) {
  const db = publicClient();
  if (!db) return { products: SAMPLES.products.slice(0, limit), sample: true };
  let query = db
    .from("products")
    .select("slug, name, note, image_url, url, price_label, section, color, featured")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (featured) query = query.eq("featured", true);
  const { data, error } = await query;
  if (error) {
    console.error("getProducts failed", error.message);
    return { products: SAMPLES.products.slice(0, limit), sample: true };
  }
  return { products: data.map(withTaggedUrl), sample: false };
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

async function productsFor(db, body) {
  const slugs = productSlugsIn(body);
  if (!db || !slugs.length) return [];
  const { data } = await db
    .from("products")
    .select("slug, name, note, image_url, url, price_label, section, color")
    .eq("status", "published")
    .in("slug", slugs);
  return (data || []).map(withTaggedUrl);
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
  const [products, recipes] = await Promise.all([productsFor(db, post.body), recipesFor(db, post.body)]);
  return { ...post, source: "admin", recipe: post.recipe || null, products, recipes };
}

async function wordpressPost(db, slug) {
  const post = await getWordpressPost(slug);
  if (!post) return null;
  const html = tokenLines(post.html);
  const [products, recipes] = await Promise.all([productsFor(db, html), recipesFor(db, html)]);
  return { ...post, html, recipe: null, products, recipes };
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
