import { SITE } from "@/lib/content";
import { parseGroceryList } from "@/lib/groceryList";
import { instacartConfigured, instacartShoppingListLink } from "@/lib/instacart";
import { clientIp, ipLimiter } from "@/lib/ipLimit";

// The Grocery List tool's "Send to Instacart": turns a pasted list into an
// Instacart shopping list page. The list is re-read here from the raw text,
// so only what the tool itself would show ever reaches Instacart.

const limited = ipLimiter({ windowMs: 10 * 60 * 1000, max: 10 });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const text = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
  const items = parseGroceryList(text);
  if (!items.length) return Response.json({ error: "Add a few items to your list first." }, { status: 400 });
  if (!instacartConfigured) return Response.json({ error: "Instacart isn't hooked up yet. Check back soon!" }, { status: 503 });
  if (limited(clientIp(request))) return Response.json({ error: "Too many tries. Try again in a few minutes." }, { status: 429 });

  const link = await instacartShoppingListLink(items, {
    title: "My grocery list",
    backUrl: `${SITE.url}/tools/grocery-list`,
  }).catch((e) => ({ error: e.message }));
  if (link.error) {
    console.error("instacart list failed", link.error);
    return Response.json({ error: "Instacart didn't answer. Try again in a minute." }, { status: 502 });
  }
  return Response.json({ url: link.url });
}
