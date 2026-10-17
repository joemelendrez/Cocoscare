import { marked } from "marked";
import TurndownService from "turndown";
import { cardLines } from "@/lib/data";

// The post editor works on HTML, but posts are saved as Markdown (what the
// blog renders, with {{product:…}} / {{recipe:…}} card lines). These turn
// one into the other. A card line becomes <div data-card="product"
// data-slug="…">, which the editor shows as a card block. (The div holds
// its code as text, since turndown drops empty elements.)

const TOKEN_LINE = /^[ \t]*\{\{\s*(product|recipe):([a-z0-9-]+)\s*\}\}[ \t]*$/gm;

export function markdownToEditorHtml(markdown = "") {
  const withCards = cardLines(markdown).replace(
    TOKEN_LINE,
    (_, kind, slug) => `<div data-card="${kind}" data-slug="${slug}"></div>`,
  );
  return marked.parse(withCards);
}

let service;
function turndown() {
  if (service) return service;
  service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });
  service.addRule("card", {
    filter: (node) => node.nodeName === "DIV" && node.hasAttribute("data-card"),
    replacement: (_, node) => `\n\n{{${node.getAttribute("data-card")}:${node.getAttribute("data-slug")}}}\n\n`,
  });
  // "- item" rather than turndown's "-   item"; Tiptap wraps each item in <p>.
  service.addRule("listItem", {
    filter: "li",
    replacement(content, node) {
      const parent = node.parentNode;
      const marker =
        parent.nodeName === "OL"
          ? `${(Number(parent.getAttribute("start")) || 1) + Array.prototype.indexOf.call(parent.children, node)}. `
          : "- ";
      const text = content
        .replace(/^\n+/, "")
        .replace(/\s+$/, "")
        .replace(/\n(?=[^\n])/g, "\n  ");
      return marker + text + (node.nextSibling ? "\n" : "");
    },
  });
  return service;
}

export function editorHtmlToMarkdown(html = "") {
  return turndown()
    .turndown(html)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
