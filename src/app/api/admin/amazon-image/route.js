import { adminOnly } from "@/lib/adminAuth";
import { amazonImageForAsin, isAmazonShortLink } from "@/lib/amazon";
import { resolveAmazonAsin } from "@/lib/amazonResolve";

// The editor's preview for a short Amazon link: the browser can't follow
// Amazon's redirects itself, so the server does. Admins only, short links only.
export async function GET(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;
  const url = new URL(request.url).searchParams.get("url") || "";
  if (!isAmazonShortLink(url)) return Response.json({ error: "Not an Amazon short link" }, { status: 400 });
  const asin = await resolveAmazonAsin(url);
  return Response.json({ asin, image: amazonImageForAsin(asin) });
}
