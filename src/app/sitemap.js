import { SITE } from "@/lib/content";
import { getPostSlugs } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap() {
  const pages = ["", "/blog", "/shop", "/about"].map((path) => ({ url: `${SITE.url}${path}`, lastModified: new Date() }));
  const slugs = await getPostSlugs();
  return [...pages, ...slugs.map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: p.updated_at }))];
}
