import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { publicClient } from "@/lib/supabase";
import { CATEGORIES, SHOP_SECTIONS, SITE } from "@/lib/content";
import { getPosts, getRecipeList } from "@/lib/data";
import { TOOLS } from "@/lib/tools";

// What's on the site today, as JSON for Handoff Hero, where Coco writes her
// posts: the categories, her free tools, every published shop pick and
// recipe with the line that shows its card, and the posts already live.
// Only published rows (the public client, so RLS hides the rest).

export const revalidate = 600;

// Every published pick, faves and card-only ones (a roundup's car seats).
// Before migration 0005 there's no `fave` column, so read without it.
async function picks() {
  const db = publicClient();
  if (!db) return [];
  const read = (fave) =>
    db
      .from("products")
      .select(`slug, name, note, section, price_label${fave ? ", fave" : ""}`)
      .eq("status", "published")
      .order("sort", { ascending: true })
      .limit(300);
  let { data, error } = await read(true);
  if (error) ({ data, error } = await read(false));
  if (error) {
    console.error("knowledge feed: picks failed", error.message);
    return [];
  }
  return data.filter((p) => p.slug);
}

const sectionLabel = (key) => SHOP_SECTIONS.find((s) => s.key === key)?.label || key || "";

export async function GET() {
  const [products, recipes, { posts, sample }] = await Promise.all([picks(), getRecipeList(), getPosts({ limit: 60 })]);
  const text = [
    `About: ${SITE.name} (${SITE.url}), ${SITE.description} Tagline: "${SITE.tagline}". Coco was a nanny for 10+ years before becoming a stay-at-home mom; she writes as herself, first person, warm and practical.`,
    `Blog categories (pick one per post):\n${CATEGORIES.map((c) => `- ${c.label}: ${c.blurb}`).join("\n")}`,
    `Free tools on the site (no sign-up), worth a link where a post fits one:\n${TOOLS.map((t) => `- ${t.title} (${SITE.url}${t.href}): ${t.blurb}`).join("\n")}`,
    products.length
      ? `Shop picks. To show one as a product card, put its line on a line of its own, exactly as written, where it fits in the post. Use only these; never invent a pick, a price or a link:\n${products
          .map((p) => `- {{product:${p.slug}}} ${p.name}${p.price_label ? ` (${p.price_label})` : ""}${p.section ? `, ${sectionLabel(p.section)}` : ""}${p.note ? `: ${p.note}` : ""}${p.fave === false ? " [card only, not in the shop]" : ""}`)
          .join("\n")}`
      : "",
    recipes.length
      ? `Recipes. To show one as a recipe card, put its line on a line of its own. A recipe shows on the blog only inside a post:\n${recipes
          .map((r) => `- {{recipe:${r.slug}}} ${r.title}${r.minutes ? ` (${r.minutes} min)` : ""}${r.summary ? `: ${r.summary}` : ""}${r.href ? ` [already in ${SITE.url}${r.href.split("#")[0]}]` : ""}`)
          .join("\n")}`
      : "",
    !sample && posts.length
      ? `Posts already live (link to one where it helps; don't repeat one):\n${posts.map((p) => `- ${p.title} (${SITE.url}/blog/${p.slug})`).join("\n")}`
      : "",
    `Pages you may link to: ${SITE.url}/blog, ${SITE.url}/recipes, ${SITE.url}/shop, ${SITE.url}/tools, ${SITE.url}/about.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return NextResponse.json(
    {
      version: createHash("sha256").update(text).digest("hex").slice(0, 12),
      app: SITE.name,
      url: SITE.url,
      text,
      rules: [
        "Card lines ({{product:...}} and {{recipe:...}}) go on a line of their own with nothing else on it, and only the ones listed here.",
        "Never invent a product, price, recipe, study or statistic; when unsure, describe Coco's own experience instead.",
        "Links to the site are full URLs from these notes.",
      ],
    },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600" } },
  );
}
