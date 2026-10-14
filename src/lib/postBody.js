import { marked } from "marked";
import { CARD_TOKEN, cardLines } from "@/lib/data";

// Splits a post body at its {{product:…}} / {{recipe:…}} lines so each card
// renders between the HTML chunks. Bodies are Markdown written in /admin,
// or HTML from WordPress (`html: true`); both come only from admins, so
// their HTML is trusted. A code with no matching live card shows nothing.
export function bodySegments(body = "", { products = [], recipes = [], html = false } = {}) {
  const text = html ? body : cardLines(body);
  const render = (chunk) => (html ? chunk : marked.parse(chunk));
  const find = { product: new Map(products.map((p) => [p.slug, p])), recipe: new Map(recipes.map((r) => [r.slug, r])) };
  const segments = [];
  let last = 0;
  for (const match of text.matchAll(CARD_TOKEN)) {
    segments.push({ type: "html", html: render(text.slice(last, match.index)) });
    const item = find[match[1]].get(match[2]);
    if (item) segments.push({ type: match[1], [match[1]]: item });
    last = match.index + match[0].length;
  }
  segments.push({ type: "html", html: render(text.slice(last)) });
  return segments.filter((s) => s.type !== "html" || s.html.trim());
}
