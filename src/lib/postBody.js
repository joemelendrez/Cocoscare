import { marked } from "marked";
import { CARD_TOKEN, cardLines } from "@/lib/data";
import { stripTags } from "@/lib/wordpress";

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
  return segments.flatMap((s) => (s.type === "html" ? splitFaq(s.html) : [s])).filter((s) => s.type !== "html" || s.html.trim());
}

const FAQ_HEADING = /^(frequently asked questions|faqs?|common questions)\b/i;

// Finds a "Frequently Asked Questions" section (an h2, then each question
// as an h3 with its answer under it, the shape Handoff Hero's FAQ tool
// writes) and splits it out as a { type: "faq", items } segment, so it
// shows as the FAQ card instead of plain headings. The section ends at the
// next h2. Anything it can't read cleanly (no h3 questions, or WordPress
// block wrappers inside) stays as ordinary text.
export function splitFaq(html) {
  const heading = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].find((m) => FAQ_HEADING.test(stripTags(m[1])));
  if (!heading) return [{ type: "html", html }];
  const start = heading.index + heading[0].length;
  const next = html.slice(start).search(/<h2\b/i);
  const end = next === -1 ? html.length : start + next;
  const section = html.slice(start, end);
  if (/<\/?div\b/i.test(section)) return [{ type: "html", html }];

  const questions = [...section.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)];
  const items = questions
    .map((q, i) => ({
      question: stripTags(q[1]),
      answer: section.slice(q.index + q[0].length, questions[i + 1]?.index ?? section.length).trim(),
    }))
    .filter((item) => item.question && stripTags(item.answer));
  if (!items.length || stripTags(section.slice(0, questions[0].index))) return [{ type: "html", html }];

  return [
    { type: "html", html: html.slice(0, heading.index) },
    { type: "faq", title: stripTags(heading[1]), items },
    ...splitFaq(html.slice(end)),
  ];
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
