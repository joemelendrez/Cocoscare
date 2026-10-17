// Posts Coco writes in Handoff Hero are sent to this WordPress subsite. Live
// ones show on the blog straight from WPGraphQL, merged with the posts
// edited in /admin (see data.js); /admin can also pull any of them in to
// finish with photos and cards (wordpressInbox.js). WORDPRESS_GRAPHQL_URL=off
// stops reading WordPress on the blog.

const URL_SETTING = process.env.WORDPRESS_GRAPHQL_URL || "https://cms.habitnova.com/cocoscare/graphql";
export const wordpressConfigured = URL_SETTING !== "off";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };

// WordPress stores curly quotes and dashes as entities (&#8217;).
export function decodeEntities(text = "") {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export const stripTags = (html = "") => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

// WordPress category slugs and the blog categories they show under.
const CATEGORY_MAP = {
  recipes: "recipes",
  recipe: "recipes",
  "product-picks": "mom-finds",
  "mom-finds": "mom-finds",
  outings: "outings",
  tips: "nanny-tips",
  "nanny-tips": "nanny-tips",
};

export function categoryKey(nodes = []) {
  for (const n of nodes) if (CATEGORY_MAP[n.slug]) return CATEGORY_MAP[n.slug];
  return "nanny-tips";
}

async function query(gql, variables = {}) {
  if (!wordpressConfigured) return null;
  try {
    const res = await fetch(URL_SETTING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables }),
      next: { revalidate: 60, tags: ["wordpress"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error");
    return json.data;
  } catch (error) {
    console.error("WordPress read failed:", error.message);
    return null;
  }
}

const FIELDS = `
  databaseId
  slug
  title
  excerpt
  dateGmt
  modifiedGmt
  categories { nodes { slug } }
  featuredImage { node { sourceUrl } }
`;

// WPGraphQL's *Gmt dates have no zone marker.
const gmt = (d) => (d ? new Date(/Z$/.test(d) ? d : `${d}Z`).toISOString() : null);

function toPost(node, withContent = false) {
  const html = decodeEntities(node.content || "");
  const words = stripTags(html).split(" ").filter(Boolean).length;
  return {
    source: "wordpress",
    wordpress_id: node.databaseId,
    slug: node.slug,
    title: decodeEntities(node.title || ""),
    category: categoryKey(node.categories?.nodes),
    excerpt: stripTags(node.excerpt || ""),
    cover_url: node.featuredImage?.node?.sourceUrl || null,
    published_at: gmt(node.dateGmt),
    updated_at: gmt(node.modifiedGmt),
    minutes: Math.max(1, Math.round(words / 220)),
    ...(withContent ? { html } : {}),
  };
}

// Newest published posts (WPGraphQL caps a page at 100).
export async function getWordpressPosts(first = 100, { withContent = false } = {}) {
  const data = await query(`query Posts($first: Int) { posts(first: $first, where: { status: PUBLISH }) { nodes { content ${FIELDS} } } }`, { first });
  return (data?.posts?.nodes || []).map((n) => toPost(n, withContent));
}

export async function getWordpressPost(slug) {
  const data = await query(`query Post($slug: String!) { postBy(slug: $slug) { status content ${FIELDS} } }`, { slug });
  const node = data?.postBy;
  if (!node || node.status !== "publish") return null;
  return toPost(node, true);
}
