import { SITE } from "@/lib/content";
import { getPost } from "@/lib/data";
import { instacartConfigured, instacartRecipeLink } from "@/lib/instacart";
import { clientIp, ipLimiter } from "@/lib/ipLimit";

// "Shop with Instacart": makes (or reuses) the recipe's Instacart page and
// sends the reader there. The recipe is read from the published post, so
// only real recipes ever reach Instacart.

const limited = ipLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
const SLUG = /^[a-z0-9-]{1,120}$/;
const ID = /^[A-Za-z0-9-]{1,64}$/;

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("slug") || "";
  const recipeId = params.get("recipe") || "";
  const anchor = /^recipe(-\d{1,2})?$/.test(params.get("anchor") || "") ? params.get("anchor") : "recipe";
  if (!SLUG.test(slug) || !ID.test(recipeId)) return new Response("Bad request", { status: 400 });
  const back = `${SITE.url}/blog/${slug}#${anchor}`;
  if (!instacartConfigured) return Response.redirect(back, 302);
  if (limited(clientIp(request))) return new Response("Too many tries. Try again in a few minutes.", { status: 429 });

  const post = await getPost(slug);
  const recipe = post && [post.recipe, ...(post.recipes || [])].find((r) => r && String(r.id) === recipeId);
  if (!recipe) return new Response("Couldn't find that recipe.", { status: 404 });

  const link = await instacartRecipeLink(recipe, { postUrl: back, author: SITE.name }).catch((e) => ({ error: e.message }));
  if (link.error) {
    console.error("instacart link failed", link.error);
    return Response.redirect(back, 302);
  }
  return Response.redirect(link.url, 302);
}
