import TurndownService from "turndown";
import { categoryKey, decodeEntities } from "@/lib/wordpress";
import { slugify } from "@/lib/recipe";

// Reads posts Coco sent from Handoff Hero to the WordPress subsite,
// drafts included, so /admin can pull one in and finish it there. Drafts
// aren't public, so this needs an Application Password (wp-admin › Users ›
// Profile) in WORDPRESS_USERNAME / WORDPRESS_APP_PASSWORD. Server only.

const SITE = (process.env.WORDPRESS_SITE_URL || "https://cms.habitnova.com/cocoscare").replace(/\/+$/, "");
const USER = process.env.WORDPRESS_USERNAME;
const PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

export const inboxConfigured = Boolean(USER && PASSWORD);

const STATUS = { draft: "draft", pending: "draft", future: "scheduled", publish: "live", private: "draft" };

async function wp(path) {
  const auth = Buffer.from(`${USER}:${PASSWORD}`).toString("base64");
  const res = await fetch(`${SITE}/wp-json/wp/v2/${path}`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const error = new Error(res.status === 401 || res.status === 403 ? "WordPress didn't accept the login. Check WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD." : detail.message || `WordPress answered ${res.status}`);
    error.status = res.status === 404 ? 404 : 502;
    throw error;
  }
  return res.json();
}

const plain = (html = "") => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const titleOf = (p) => decodeEntities(p.title?.raw ?? p.title?.rendered ?? "").trim() || "Untitled";

// The newest 50 posts, any state but trashed.
export async function listInbox() {
  const posts = await wp("posts?status=draft,pending,future,publish,private&context=edit&per_page=50&orderby=modified&_fields=id,status,title,modified_gmt");
  return posts.map((p) => ({
    id: p.id,
    title: titleOf(p),
    state: STATUS[p.status] || "draft",
    modified: p.modified_gmt ? `${p.modified_gmt}Z` : null,
  }));
}

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "_" });
turndown.remove(["script", "style"]);
// "- item" rather than turndown's "-   item".
turndown.addRule("listItem", {
  filter: "li",
  replacement(content, node) {
    const parent = node.parentNode;
    const marker = parent.nodeName === "OL" ? `${(Number(parent.getAttribute("start")) || 1) + Array.prototype.indexOf.call(parent.children, node)}. ` : "- ";
    const text = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n  ");
    return marker + text + (node.nextSibling && !/\n$/.test(text) ? "\n" : "");
  },
});

// Handoff Hero puts the meta description first as an italic line; it
// becomes the excerpt instead of staying in the body.
function splitMeta(markdown) {
  const lines = markdown.split("\n");
  const first = lines.findIndex((l) => l.trim());
  const line = first >= 0 ? lines[first].trim() : "";
  if (/^_[^_].*_$/.test(line) || /^\*[^*].*\*$/.test(line)) {
    lines.splice(first, 1);
    return { meta: line.slice(1, -1).trim(), body: lines.join("\n").trim() };
  }
  return { meta: "", body: markdown.trim() };
}

// One post, ready to save as a Coco's Care post.
export async function postForImport(id) {
  const p = await wp(`posts/${Number(id)}?context=edit&_embed=wp:featuredmedia,wp:term`);
  const html = p.content?.rendered || "";
  const markdown = turndown
    .turndown(html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, ""))
    .replace(/^(#{1,6} \d+)\\\./gm, "$1.") // "## 1\. Tip" → "## 1. Tip"
    .replace(/\n{3,}/g, "\n\n");
  const { meta, body } = splitMeta(markdown);
  const terms = (p._embedded?.["wp:term"] || []).flat().filter((t) => t?.taxonomy === "category");
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const title = titleOf(p);
  const excerpt = (plain(p.excerpt?.raw || "") || meta || plain(p.excerpt?.rendered || "")).slice(0, 300);
  return {
    wordpress_id: p.id,
    title: title.slice(0, 200),
    slug: slugify(p.slug || p.generated_slug || title) || `post-${p.id}`,
    category: categoryKey(terms),
    excerpt: excerpt || null,
    body,
    cover_url: media?.source_url && /^https:\/\//.test(media.source_url) ? media.source_url : null,
  };
}
