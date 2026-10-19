import { stripTags } from "@/lib/wordpress";
import { withAmazonTag } from "@/lib/amazon";

// Comparison tables. Handoff Hero's "Add comparison table" tool writes a
// plain HTML table inside <figure class="hh-compare">, so the post still
// reads as a normal table anywhere (WordPress, RSS, a site without this
// code). This turns that block into the styled comparison card:
//
//   <figure class="hh-compare">
//     <figcaption>Best baby carriers compared</figcaption>   (optional title)
//     <table>
//       <thead><tr><th>Product</th><th class="hh-top">Carrier A</th><th>Carrier B</th></tr></thead>
//       <tbody>
//         <tr><th>Photo</th><td><img src="…" alt="…"></td>…</tr>          (optional)
//         <tr><th>Best for</th><td>…</td><td>…</td></tr>                    (any number of rows)
//         <tr><th>Link</th><td><a href="…">Check price</a></td>…</tr>      (optional)
//       </tbody>
//     </table>
//   </figure>
//
// The header cell with class "hh-top" is the top pick. Anything that
// doesn't read cleanly (fewer than 2 products, rows with the wrong number
// of cells) stays as the plain table.

const FIGURE = /<figure\b[^>]*class=(["'])[^"']*\bhh-compare\b[^"']*\1[^>]*>[\s\S]*?<\/figure>/gi;
const CELL = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const LINK_LABEL = /^(link|links|buy|where to buy|shop|get it|price check)$/i;

const decode = (s) => s.replace(/&amp;/g, "&");

function rowsOf(table) {
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1].matchAll(CELL)].map((c) => ({ attrs: c[2], html: c[3].trim() })),
  );
}

function linkIn(html) {
  const a = html.match(/<a\b[^>]*href=(["'])(https?:\/\/[^"']+)\1[^>]*>([\s\S]*?)<\/a>/i);
  return a ? { url: withAmazonTag(decode(a[2])), text: stripTags(a[3]) } : null;
}

function imageIn(html) {
  const img = html.match(/<img\b[^>]*>/i)?.[0];
  if (!img) return null;
  const src = img.match(/\bsrc=(["'])([^"']+)\1/i)?.[2];
  const alt = img.match(/\balt=(["'])([^"']*)\1/i)?.[2] || "";
  return src ? { src: decode(src), alt: stripTags(alt) } : null;
}

export function parseCompare(figure) {
  const table = figure.match(/<table\b[^>]*>[\s\S]*?<\/table>/i)?.[0];
  if (!table) return null;
  const [header, ...rows] = rowsOf(table);
  if (!header || header.length < 3) return null;
  const products = header.slice(1).map((cell) => ({
    name: stripTags(cell.html),
    top: /\bclass=(["'])[^"']*\bhh-top\b/i.test(cell.attrs),
    image: null,
    link: null,
    values: [],
  }));
  if (products.some((p) => !p.name)) return null;
  const labels = [];
  for (const row of rows) {
    if (row.length !== products.length + 1) return null;
    const label = stripTags(row[0].html);
    const cells = row.slice(1);
    const images = cells.map((c) => imageIn(c.html));
    if (images.every(Boolean) && cells.every((c) => !stripTags(c.html))) {
      images.forEach((img, i) => (products[i].image = img));
      continue;
    }
    const links = cells.map((c) => linkIn(c.html));
    if (LINK_LABEL.test(label) && links.some(Boolean)) {
      links.forEach((link, i) => (products[i].link = link));
      continue;
    }
    labels.push(label);
    cells.forEach((c, i) => products[i].values.push(c.html));
  }
  const title = stripTags(figure.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || "");
  return { title, labels, products };
}

// Splits rendered post HTML at each comparison block.
export function splitCompare(html) {
  const out = [];
  let last = 0;
  for (const match of html.matchAll(FIGURE)) {
    const table = parseCompare(match[0]);
    if (!table) continue;
    out.push({ type: "html", html: html.slice(last, match.index) });
    out.push({ type: "compare", table });
    last = match.index + match[0].length;
  }
  out.push({ type: "html", html: html.slice(last) });
  return out;
}

export const compareHasLinks = (segments) =>
  segments.some((s) => s.type === "compare" && s.table.products.some((p) => p.link));
