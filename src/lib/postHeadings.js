import { stripTags } from "@/lib/wordpress";

// Gives each h2/h3 in a post's text chunks an id and lists them for the
// table of contents, with the FAQ and recipe cards as entries where they
// sit. Ids come from the heading text, so links to a section stay put.
export function withHeadingIds(segments, { endRecipe = null } = {}) {
  const used = new Set(["faq", ...segments.map((s) => s.anchorId).filter(Boolean), endRecipe?.id].filter(Boolean));
  const headings = [];
  const idFor = (text) => {
    const base =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  const out = segments.map((s) => {
    if (s.type === "faq") {
      headings.push({ id: "faq", text: s.title || "FAQ", level: 2, kind: "faq" });
      return s;
    }
    if (s.type === "recipe" && s.anchorId) {
      headings.push({ id: s.anchorId, text: s.recipe.title, level: 2, kind: "recipe" });
      return s;
    }
    if (s.type !== "html") return s;
    const html = s.html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
      const text = stripTags(inner);
      if (!text) return match;
      const existing = attrs.match(/\bid="([^"]+)"/i)?.[1];
      const id = existing || idFor(text);
      if (existing) used.add(existing);
      headings.push({ id, text, level: Number(tag[1]) });
      return existing ? match : `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
    });
    return { ...s, html };
  });
  if (endRecipe) headings.push({ id: endRecipe.id, text: endRecipe.recipe.title, level: 2, kind: "recipe" });
  // Each heading's main section, and a running number for the main ones
  // (the FAQ and recipe get icons instead).
  let number = 0;
  let section = null;
  for (const h of headings) {
    // Recipe cards are listed in their own group, so a subheading after one
    // still belongs to the section before it.
    if (h.kind === "recipe") {
      Object.assign(h, { number: 0, section: h.id });
      continue;
    }
    if (h.level === 2) {
      section = h.id;
      if (!h.kind) number += 1;
    }
    Object.assign(h, { number, section });
  }
  return { segments: out, headings };
}
