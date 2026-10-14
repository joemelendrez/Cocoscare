import { publicClient } from "@/lib/supabase";
import { SAMPLE_PICKS, SAMPLE_POSTS } from "@/lib/content";

// Reads published content from Coco's Supabase project. Without one (or if
// a read fails) pages show the sample content instead, marked "Sample".

const SAMPLES = {
  posts: SAMPLE_POSTS.map((p) => ({ ...p, sample: true })),
  products: SAMPLE_PICKS.map((p) => ({ ...p, slug: null, sample: true })),
};

export function readingMinutes(markdown = "") {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
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

export async function getPosts({ limit = 60, category } = {}) {
  const db = publicClient();
  if (!db) return { posts: SAMPLES.posts.slice(0, limit), sample: true };
  let query = db.from("posts").select(POST_FIELDS).eq("status", "published").order("published_at", { ascending: false }).limit(limit);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) {
    console.error("getPosts failed", error.message);
    return { posts: SAMPLES.posts.slice(0, limit), sample: true };
  }
  return { posts: data.map(toCard), sample: false };
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

// Product embeds in a post body: a line of just {{product:slug}}.
export const PRODUCT_TOKEN = /^\s*\{\{\s*product:([a-z0-9-]+)\s*\}\}\s*$/gm;

export function productSlugsIn(body = "") {
  return [...body.matchAll(PRODUCT_TOKEN)].map((m) => m[1]);
}

export async function getPost(slug) {
  const db = publicClient();
  if (!db) return null;
  const { data: post, error } = await db
    .from("posts")
    .select("id, slug, title, category, excerpt, body, cover_url, published_at, updated_at, recipe:recipes(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("getPost failed", error.message);
    return null;
  }
  if (!post) return null;

  const slugs = [...new Set(productSlugsIn(post.body))];
  let products = [];
  if (slugs.length) {
    const { data } = await db
      .from("products")
      .select("slug, name, note, image_url, url, price_label, section, color")
      .eq("status", "published")
      .in("slug", slugs);
    products = data || [];
  }
  // A recipe still in draft doesn't come back (RLS), so it isn't shown.
  return { ...post, recipe: post.recipe || null, products };
}

export async function getPostSlugs() {
  const db = publicClient();
  if (!db) return [];
  const { data } = await db.from("posts").select("slug, updated_at").eq("status", "published");
  return data || [];
}
