import { SITE } from "@/lib/content";

export default function robots() {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }, sitemap: `${SITE.url}/sitemap.xml` };
}
