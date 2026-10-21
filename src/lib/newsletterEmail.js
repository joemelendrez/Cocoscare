import { marked } from "marked";

// The Coco's Care newsletter: a pink band with the logo, the issue written in
// Markdown, and Mailchimp's required unsubscribe link and mailing address.
// Tables and inline styles only, since Gmail and Outlook drop <style> and
// flexbox (same rule as recipeEmail.js). Pure, so /admin's preview and the
// Mailchimp draft come from the same function.

const PINK = "#ff0f9a";
const INK = "#161016";
const BLUSH = "#fff1f7";
const FONT = "font-family:Helvetica,Arial,sans-serif;";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://cocoscare.com").replace(/\/+$/, "");

export const NEWSLETTER_LIMITS = { subject: 150, preheader: 150, heading: 150, markdown: 50000 };

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Inline styles for what Markdown makes. Images fill the card's width.
const STYLE = {
  p: `margin:0 0 16px;font-size:17px;line-height:1.6;`,
  h1: `margin:24px 0 12px;font-size:28px;line-height:1.2;`,
  h2: `margin:24px 0 10px;font-size:24px;line-height:1.2;`,
  h3: `margin:20px 0 8px;font-size:20px;line-height:1.25;`,
  ul: `margin:0 0 16px;padding-left:22px;font-size:17px;line-height:1.6;`,
  ol: `margin:0 0 16px;padding-left:22px;font-size:17px;line-height:1.6;`,
  li: `margin:0 0 6px;`,
  blockquote: `margin:0 0 16px;padding:12px 16px;background:${BLUSH};border-left:4px solid ${PINK};border-radius:8px;`,
  a: `color:${PINK};font-weight:bold;`,
  img: `display:block;width:100%;max-width:100%;height:auto;border:3px solid ${INK};border-radius:16px;margin:0 0 16px;`,
  hr: `border:none;border-top:2px dashed #d9c9d4;margin:24px 0;`,
};

function styled(html) {
  return html.replace(
    /<(p|h1|h2|h3|ul|ol|li|blockquote|a|img|hr)(\s|>|\/)/g,
    (m, tag, next) => `<${tag} style="${STYLE[tag]}"${next}`,
  );
}

// A post as a block to drop into an issue: photo, title, one line, a link.
export function postBlock({ title, excerpt, cover_url: cover, slug }) {
  const url = `${SITE}/blog/${slug}`;
  return [cover && `[![${title}](${cover})](${url})`, `### [${title}](${url})`, excerpt, `[Read it on the blog →](${url})`]
    .filter(Boolean)
    .join("\n\n");
}

// `preview` swaps Mailchimp's merge tags for something readable.
export function newsletterHtml({ subject = "", preheader = "", heading = "", markdown = "" }, { preview = false } = {}) {
  const body = styled(marked.parse(String(markdown).slice(0, NEWSLETTER_LIMITS.markdown), { async: false }));
  const unsub = preview ? "#" : "*|UNSUB|*";
  const address = preview ? "Coco&rsquo;s Care" : "*|LIST:ADDRESSLINE|*";
  const title = heading || subject;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${BLUSH};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLUSH};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:3px solid ${INK};border-radius:24px;">
<tr><td align="center" style="background:${PINK};border-radius:20px 20px 0 0;padding:20px 24px;${FONT}color:#ffffff;">
<a href="${SITE}" style="text-decoration:none;color:#ffffff;"><img src="${SITE}/pin/logo.png" alt="Coco's Care" width="72" height="72" style="display:block;margin:0 auto;border:0;"></a>
${title ? `<h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;">${esc(title)}</h1>` : ""}
</td></tr>
<tr><td style="padding:24px;${FONT}color:${INK};">${body}</td></tr>
<tr><td style="padding:0 24px 24px;${FONT}">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${INK};border-radius:999px;">
<a href="${SITE}/blog" style="display:inline-block;padding:12px 24px;${FONT}font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">More on the blog</a>
</td></tr></table>
</td></tr>
</table>
<p style="max-width:600px;margin:16px auto 0;${FONT}font-size:13px;line-height:1.5;color:#6b5f6b;text-align:center;">You signed up for Coco&rsquo;s Care emails at cocoscare.com. <a href="${unsub}" style="color:#6b5f6b;">Unsubscribe</a><br>${address}</p>
</td></tr></table></body></html>`;
}
