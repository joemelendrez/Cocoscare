import { SITE } from "@/lib/content";
import { getPost } from "@/lib/data";
import { EMAIL, clientIp, ipLimiter } from "@/lib/ipLimit";
import { mailchimpConfigured, subscribe } from "@/lib/mailchimp";
import { recipeEmail } from "@/lib/recipeEmail";
import { resendConfigured, sendEmail } from "@/lib/resend";

// "Email me this recipe": sends one recipe card to the reader, and adds
// them to the Mailchimp list (tagged "recipe-email") when they left the
// "send me new recipes" box ticked. The recipe is looked up here from the
// post, so the email can only ever carry a real published recipe.

const limited = ipLimiter({ windowMs: 10 * 60 * 1000, max: 5 });
const SLUG = /^[a-z0-9-]{1,120}$/;
const ID = /^[A-Za-z0-9-]{1,64}$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  // The hidden "website" field is only ever filled in by bots.
  if (body?.website) return Response.json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  const slug = String(body?.slug || "");
  const recipeId = String(body?.recipeId || "");
  if (!SLUG.test(slug) || !ID.test(recipeId)) return Response.json({ error: "Bad request" }, { status: 400 });
  // The card's own anchor (#recipe, #recipe-2, ...), so the email's link opens that card.
  const anchor = /^recipe(-\d{1,2})?$/.test(body?.anchor || "") ? body.anchor : "recipe";

  if (limited(clientIp(request))) return Response.json({ error: "Too many tries. Try again in a few minutes." }, { status: 429 });
  if (!resendConfigured) return Response.json({ error: "Recipe emails aren't open yet. Check back soon!" }, { status: 503 });

  const post = await getPost(slug);
  const recipe = post && [post.recipe, ...(post.recipes || [])].find((r) => r && String(r.id) === recipeId);
  if (!recipe) return Response.json({ error: "Couldn't find that recipe." }, { status: 404 });

  const { subject, html, text } = recipeEmail(recipe, {
    postUrl: `${SITE.url}/blog/${post.slug}#${anchor}`,
    postTitle: post.title,
  });
  const sent = await sendEmail({ to: email, subject, html, text }).catch((e) => ({ error: e.message }));
  if (sent.error) {
    console.error("recipe email failed", sent.error);
    if (sent.status === 422) return Response.json({ error: "That email address didn't work. Try another one." }, { status: 400 });
    return Response.json({ error: "Couldn't send it just now. Try again soon." }, { status: 502 });
  }

  // The recipe is already on its way, so a list hiccup doesn't fail the request.
  let subscribed = false;
  if (body?.subscribe === true && mailchimpConfigured) {
    const r = await subscribe(email, ["blog", "recipe-email", post.category].filter(Boolean)).catch((e) => ({
      error: e.message,
    }));
    if (r.error) console.error("recipe email subscribe failed", r.error);
    else subscribed = true;
  }
  return Response.json({ ok: true, subscribed });
}
