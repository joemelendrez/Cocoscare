import { marked } from "marked";
import { CARD_TOKEN, cardLines } from "@/lib/data";
import { localizeCmsLinks, stripTags } from "@/lib/wordpress";
import { tagAmazonLinksInHtml } from "@/lib/amazon";
import { splitCompare } from "@/lib/compareTable";

// Splits a post body at its {{product:…}} / {{recipe:…}} lines so each card
// renders between the HTML chunks. Bodies are Markdown written in /admin,
// or HTML from WordPress (`html: true`); both come only from admins, so
// their HTML is trusted. A code with no matching live card shows nothing.
export function bodySegments(body = "", { products = [], recipes = [], html = false } = {}) {
  const text = html ? body : cardLines(body);
  const render = (chunk) => tagAmazonLinksInHtml(localizeCmsLinks(html ? chunk : marked.parse(chunk)));
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
  return segments
    .flatMap((s) => (s.type === "html" ? splitCompare(s.html) : [s]))
    .flatMap((s) => (s.type === "html" ? splitFaq(s.html) : [s]))
    .filter((s) => s.type !== "html" || s.html.trim());
}

const FAQ_HEADING = /^(frequently asked questions|faqs?|common questions)\b/i;

// Finds a "Frequently Asked Questions" (or "FAQ") section and splits it
// out as a { type: "faq", items } segment, so it shows as the FAQ card
// instead of plain text. Questions can be h3 headings (Handoff Hero's FAQ
// tool and the editor's FAQ button) or paragraphs that open with a bold
// question ("<p><strong>Question?</strong><br>Answer</p>", how Coco's quick
// posts write them), mixed in one section. Everything after a question up
// to the next one is its answer. The section ends at the next h2. Anything
// it can't read cleanly (no questions, or WordPress block wrappers inside)
// stays as ordinary text.
export function splitFaq(html) {
  const heading = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].find((m) => FAQ_HEADING.test(stripTags(m[1])));
  if (!heading) return [{ type: "html", html }];
  const start = heading.index + heading[0].length;
  const next = html.slice(start).search(/<h2\b/i);
  const end = next === -1 ? html.length : start + next;
  const section = html.slice(start, end);
  const items = /<\/?div\b/i.test(section) ? null : faqItems(section);
  if (!items) return [{ type: "html", html }];

  return [
    { type: "html", html: html.slice(0, heading.index) },
    { type: "faq", title: stripTags(heading[1]), ...items },
    ...splitFaq(html.slice(end)),
  ];
}

const BOLD_QUESTION = /^<p\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>\s*(?:<br\s*\/?>\s*)*([\s\S]*)<\/p>$/i;

// Reads the questions out of an FAQ section's HTML. Returns null when it
// finds none. Text before the first question is kept as `intro`.
function faqItems(section) {
  const blocks = [...section.matchAll(/<(h3|p|ul|ol|blockquote|figure)\b[^>]*>[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  if (stripTags(section.replace(/<(h3|p|ul|ol|blockquote|figure)\b[^>]*>[\s\S]*?<\/\1>/gi, ""))) return null;
  const items = [];
  const intro = [];
  for (const block of blocks) {
    const h3 = block.match(/^<h3\b[^>]*>([\s\S]*?)<\/h3>$/i);
    const bold = block.match(BOLD_QUESTION);
    if (h3) items.push({ question: stripTags(h3[1]), answer: [] });
    else if (bold && stripTags(bold[2]).endsWith("?")) {
      items.push({ question: stripTags(bold[2]), answer: [] });
      if (stripTags(bold[3])) items.at(-1).answer.push(`<p>${bold[3].trim()}</p>`);
    } else (items.length ? items.at(-1).answer : intro).push(block);
  }
  const done = items
    .map((item) => ({ question: item.question, answer: item.answer.join("\n") }))
    .filter((item) => item.question && stripTags(item.answer));
  if (!done.length) return null;
  return { intro: intro.join("\n"), items: done };
}

// FAQPage structured data for Google, from the FAQ segments.
export function faqSchema(segments) {
  const items = segments.filter((s) => s.type === "faq").flatMap((s) => s.items);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: stripTags(item.answer.replace(/<(?!\/?(p|li|ul|ol|br|h\d)\b)[^>]*>/gi, "")) },
    })),
  };
}
