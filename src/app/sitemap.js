import { SITE } from "@/lib/content";
import { getFaveSlugs, getPostSlugs } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap() {
  const pages = ["", "/blog", "/shop", "/tools", "/tools/grocery-list", "/tools/meal-planner", "/tools/kitchen-converter", "/tools/boredom-buster", "/about", "/privacy", "/terms"].map((path) => ({
    url: `${SITE.url}${path}`,
    lastModified: new Date(),
  }));
  const [slugs, faves] = await Promise.all([getPostSlugs(), getFaveSlugs()]);
  return [
    ...pages,
    ...slugs.map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: p.updated_at })),
    ...faves.map((p) => ({ url: `${SITE.url}/shop/${p.slug}`, lastModified: p.updated_at || new Date() })),
  ];
}
