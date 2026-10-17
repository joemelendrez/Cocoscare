import TurndownService from "turndown";
import { categoryKey, decodeEntities } from "@/lib/wordpress";
import { slugify } from "@/lib/recipe";

// Reads posts Coco sent from Handoff Hero to the WordPress subsite,
// drafts included, so /admin can pull one in and finish it there. Drafts
// aren't public, so this needs a WordPress Application Password: the one
// saved by /admin's "Connect WordPress" (the wordpress_connection table), or
// WORDPRESS_USERNAME / WORDPRESS_APP_PASSWORD on Netlify. Server only.

export const WORDPRESS_SITE = (process.env.WORDPRESS_SITE_URL || "https://cms.habitnova.com/cocoscare").replace(/\/+$/, "");

// The login to use: the connected one, else the Netlify env vars, else null.
// `db` is the admin's own Supabase client, so RLS guards the saved password.
export async function wordpressLogin(db) {
  const { data } = await db.from("wordpress_connection").select("site_url, username, app_password").maybeSingle();
  if (data) return { site: data.site_url.replace(/\/+$/, ""), user: data.username, password: data.app_password, saved: true };
  const user = process.env.WORDPRESS_USERNAME;
  const password = process.env.WORDPRESS_APP_PASSWORD;
  return user && password ? { site: WORDPRESS_SITE, user, password, saved: false } : null;
}

const STATUS = { draft: "draft", pending: "draft", future: "scheduled", publish: "live", private: "draft" };

// fetch drops the Authorization header when it follows a redirect to another
// origin, and http → https counts as one, so WordPress would see a signed-out
// request. Redirects within the same host are followed here with the login
// kept; anything else is refused.
async function request(login, path) {
  const auth = Buffer.from(`${login.user}:${login.password}`).toString("base64");
  let url = new URL(`${login.site}/wp-json/wp/v2/${path}`);
  for (let hops = 0; hops < 4; hops++) {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });
    const location = res.status >= 300 && res.status < 400 && res.headers.get("location");
    if (!location) return res;
    const next = new URL(location, url);
    if (next.hostname !== url.hostname || next.protocol !== "https:") {
      const error = new Error(
        `WordPress redirected to ${next.origin}${next.pathname}. Connect WordPress again from its real https address.`,
      );
      error.status = 502;
      throw error;
    }
    url = next;
  }
  const error = new Error("WordPress kept redirecting. Try connecting WordPress again.");
  error.status = 502;
  throw error;
}

// WordPress answers "Invalid parameter(s): status" when whoever it thinks is
// asking can't edit posts. That's either a signed-in user without a role on
// this subsite, or a request it treated as signed out (the login header never
// reached it). Asking who we are tells the two apart.
async function cantSeeDraftsMessage(login) {
  const me = await request(login, "users/me?context=edit");
  const who = me?.ok ? await me.json().catch(() => null) : null;
  if (!who) {
    return "WordPress treated the request as signed out, so it can't show drafts. The login never reached it. Most often the web server in front of WordPress drops the Authorization header (on Apache, add CGIPassAuth On to the WordPress .htaccess), or Application Passwords are turned off for this site.";
  }
  const roles = Array.isArray(who.roles) && who.roles.length ? who.roles.join(", ") : "no role";
  return `WordPress signed in as ${who.slug || who.name || login.user} (${roles} on this site), but that user can't see drafts here. Make them an Editor or Administrator on the Coco's Care site.`;
}

// Checks a login WordPress just handed back before it's saved: it must sign
// in and be allowed to see drafts. Returns the WordPress username.
export async function checkLogin(login) {
  const res = await request(login, "users/me?context=edit");
  const who = res.ok ? await res.json().catch(() => null) : null;
  if (!who) {
    throw Object.assign(new Error("WordPress didn't accept that login. Try Connect WordPress again."), { status: 502 });
  }
  const caps = who.capabilities || {};
  if (!caps.edit_posts && !caps.edit_others_posts) {
    throw Object.assign(
      new Error(`${who.slug || login.user} can't see drafts on this site. Connect with an Editor or Administrator account.`),
      { status: 502 },
    );
  }
  return who.slug || login.user;
}

async function wp(login, path) {
  const res = await request(login, path);
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const cantSeeDrafts = detail.code === "rest_invalid_param" && detail.data?.params?.status;
    const error = new Error(
      res.status === 401 || res.status === 403
        ? "WordPress didn't accept the login. Connect WordPress again."
        : cantSeeDrafts
          ? await cantSeeDraftsMessage(login)
          : detail.message || `WordPress answered ${res.status}`,
    );
    error.status = res.status === 404 ? 404 : 502;
    throw error;
  }
  return res.json();
}

const plain = (html = "") =>
  decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
const titleOf = (p) => decodeEntities(p.title?.raw ?? p.title?.rendered ?? "").trim() || "Untitled";

// The newest 50 posts, any state but trashed.
export async function listInbox(login) {
  const posts = await wp(
    login,
    "posts?status=draft,pending,future,publish,private&context=edit&per_page=50&orderby=modified&_fields=id,status,title,modified_gmt",
  );
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
    const marker =
      parent.nodeName === "OL"
        ? `${(Number(parent.getAttribute("start")) || 1) + Array.prototype.indexOf.call(parent.children, node)}. `
        : "- ";
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
export async function postForImport(login, id) {
  const p = await wp(login, `posts/${Number(id)}?context=edit&_embed=wp:featuredmedia,wp:term`);
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
