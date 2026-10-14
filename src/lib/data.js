import { publicClient } from "@/lib/supabase";
import { SAMPLE_PICKS, SAMPLE_POSTS } from "@/lib/content";
import { getWordpressPost, getWordpressPosts, stripTags, wordpressConfigured } from "@/lib/wordpress";

// Reads published content: posts written in /admin and recipes and picks
// from Coco's Supabase project, plus Quick posts from WordPress. With
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

const POST_FIELDS = "slug, title, category, excerpt, cover_url, published_at, body";

function toCard(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt || "",
    cover_url: row.cover_url,
    published_at: row.published_at,
    minutes: readingMinutes(row.body),
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

// Both sources, newest first. A slug used in both shows the /admin post.
export async function getPosts({ limit = 60, category } = {}) {
  const [own, wp] = await Promise.all([supabasePosts(limit, category), wordpressConfigured ? getWordpressPosts() : null]);
  const wpPosts = (wp || []).filter((p) => !category || p.category === category);
  if (own === null && !wpPosts.length) {
    const samples = SAMPLES.posts.filter((p) => !category || p.category === category);
    return { posts: samples.slice(0, limit), sample: true };
  }
  const seen = new Set((own || []).map((p) => p.slug));
  const posts = [...(own || []), ...wpPosts.filter((p) => !seen.has(p.slug))]
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
  return { products: data, sample: false };
}

// Embeds in a post body: a line of just {{product:slug}}, and in a Quick
// post (WordPress) also {{recipe:slug}} to attach a recipe card.
export const PRODUCT_TOKEN = /^\s*\{\{\s*product:([a-z0-9-]+)\s*\}\}\s*$/gm;
const RECIPE_TOKEN = /^\s*\{\{\s*recipe:([a-z0-9-]+)\s*\}\}\s*$/gm;

export function productSlugsIn(body = "") {
  return [...body.matchAll(PRODUCT_TOKEN)].map((m) => m[1]);
}

// WordPress wraps a token line in <p>…</p>; put it on its own line instead.
function tokenLines(html) {
  return html.replace(/<p[^>]*>\s*(\{\{\s*(?:product|recipe):[a-z0-9-]+\s*\}\})\s*<\/p>/g, "\n$1\n");
}

async function productsFor(db, body) {
  const slugs = [...new Set(productSlugsIn(body))];
  if (!db || !slugs.length) return [];
  const { data } = await db
    .from("products")
    .select("slug, name, note, image_url, url, price_label, section, color")
    .eq("status", "published")
    .in("slug", slugs);
  return data || [];
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
  return { ...post, source: "admin", recipe: post.recipe || null, products: await productsFor(db, post.body) };
}

async function wordpressPost(db, slug) {
  const post = await getWordpressPost(slug);
  if (!post) return null;
  const html = tokenLines(post.html);
  const recipeSlug = [...html.matchAll(RECIPE_TOKEN)][0]?.[1];
  let recipe = null;
  if (db && recipeSlug) {
    const { data } = await db.from("recipes").select("*").eq("slug", recipeSlug).eq("status", "published").maybeSingle();
    recipe = data || null;
  }
  return { ...post, html: html.replace(RECIPE_TOKEN, ""), recipe, products: await productsFor(db, html) };
}

export async function getPost(slug) {
  const db = publicClient();
  return (db && (await ownPost(db, slug))) || (wordpressConfigured ? await wordpressPost(db, slug) : null);
}

export async function getPostSlugs() {
  const db = publicClient();
  const [own, wp] = await Promise.all([
    db ? db.from("posts").select("slug, updated_at").eq("status", "published").then(({ data }) => data || []) : [],
    wordpressConfigured ? getWordpressPosts() : [],
  ]);
  const seen = new Set(own.map((p) => p.slug));
  return [...own, ...wp.filter((p) => !seen.has(p.slug)).map((p) => ({ slug: p.slug, updated_at: p.updated_at }))];
}
