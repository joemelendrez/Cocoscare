import { SITE } from "@/lib/content";

export default function sitemap() {
  return ["", "/blog", "/shop", "/about"].map((path) => ({ url: `${SITE.url}${path}`, lastModified: new Date() }));
}
