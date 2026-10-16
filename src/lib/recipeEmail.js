import { formatMinutes, ingredientText } from "@/lib/recipe";

// The "Email me this recipe" email: the whole recipe (so it works in the
// store with no signal), then a button back to the post. Tables and inline
// styles only, since Gmail and Outlook drop <style> and flexbox.

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const PINK = "#ff0f9a";
const INK = "#161016";
const BLUSH = "#fff1f7";

export function recipeEmail(recipe, { postUrl, postTitle }) {
  const ingredients = (recipe.ingredients || []).map((i) => ingredientText(i)).filter(Boolean);
  const steps = (recipe.steps || []).map((s) => s.text).filter(Boolean);
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
  const meta = [
    recipe.prep_minutes && `Prep ${formatMinutes(recipe.prep_minutes)}`,
    recipe.cook_minutes && `Cook ${formatMinutes(recipe.cook_minutes)}`,
    total && `Total ${formatMinutes(total)}`,
    recipe.servings && `${recipe.servings} serving${recipe.servings === 1 ? "" : "s"}`,
  ].filter(Boolean);

  const subject = `Your recipe: ${recipe.title}`;
  const font = "font-family:Helvetica,Arial,sans-serif;";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${BLUSH};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLUSH};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:3px solid ${INK};border-radius:24px;">
<tr><td style="background:${PINK};border-radius:20px 20px 0 0;padding:24px;${font}color:#ffffff;">
<p style="margin:0;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Coco's Care recipe card</p>
<h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;">${esc(recipe.title)}</h1>
${recipe.summary ? `<p style="margin:8px 0 0;font-size:16px;line-height:1.5;">${esc(recipe.summary)}</p>` : ""}
${meta.length ? `<p style="margin:12px 0 0;font-size:14px;font-weight:bold;">${meta.map(esc).join(" &middot; ")}</p>` : ""}
</td></tr>
${
  recipe.image_url
    ? `<tr><td style="padding:0;"><img src="${esc(recipe.image_url)}" alt="${esc(recipe.title)}" width="554" style="display:block;width:100%;height:auto;border-bottom:3px solid ${INK};"></td></tr>`
    : ""
}
<tr><td style="padding:24px;${font}color:${INK};">
<h2 style="margin:0 0 8px;font-size:20px;">Ingredients</h2>
<ul style="margin:0 0 20px;padding-left:20px;font-size:16px;line-height:1.6;">${ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
<h2 style="margin:0 0 8px;font-size:20px;">Steps</h2>
<ol style="margin:0 0 20px;padding-left:20px;font-size:16px;line-height:1.6;">${steps.map((s) => `<li style="margin-bottom:8px;">${esc(s)}</li>`).join("")}</ol>
${
  recipe.tips
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#fff6d6;border:2px dashed ${INK};border-radius:16px;padding:14px;font-size:15px;line-height:1.5;"><strong>Coco's tips</strong><br>${esc(recipe.tips).replace(/\n/g, "<br>")}</td></tr></table>`
    : ""
}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td style="background:${INK};border-radius:999px;">
<a href="${esc(postUrl)}" style="display:inline-block;padding:12px 24px;${font}font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">Open it with timers and cook mode</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 24px 24px;${font}font-size:13px;line-height:1.5;color:#6b5f6b;">You asked for this recipe from &ldquo;${esc(postTitle)}&rdquo; on cocoscare.com. Happy cooking!</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    recipe.title,
    recipe.summary,
    meta.join(" · "),
    "",
    "INGREDIENTS",
    ...ingredients.map((i) => `- ${i}`),
    "",
    "STEPS",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    recipe.tips ? `\nCOCO'S TIPS\n${recipe.tips}` : "",
    "",
    `Open it with timers and cook mode: ${postUrl}`,
  ]
    .filter((l) => l != null)
    .join("\n");

  return { subject, html, text };
}
