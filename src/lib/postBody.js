import { marked } from "marked";
import { PRODUCT_TOKEN } from "@/lib/data";

// Splits a Markdown post body at {{product:slug}} lines so each product can
// render as a card between the HTML chunks. Bodies are written in /admin by
// signed-in admins only, so their HTML is trusted.
export function bodySegments(body = "", products = []) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const segments = [];
  let last = 0;
  for (const match of body.matchAll(PRODUCT_TOKEN)) {
    segments.push({ type: "html", html: marked.parse(body.slice(last, match.index)) });
    const product = bySlug.get(match[1]);
    if (product) segments.push({ type: "product", product });
    last = match.index + match[0].length;
  }
  segments.push({ type: "html", html: marked.parse(body.slice(last)) });
  return segments.filter((s) => s.type !== "html" || s.html.trim());
}
