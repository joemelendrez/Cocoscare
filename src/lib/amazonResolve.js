import { amazonAsin, forShop, isAmazonShortLink, withAmazonImage } from "@/lib/amazon";

// Server only. A short Amazon link (link.amazon, amzn.to, a.co) carries no
// product id, so follow its redirects to the product page and read the ASIN
// there. Remembered per server instance: a day when found, ten minutes when
// not (Amazon sometimes answers a bot with a captcha page).
const cache = new Map();
const FOUND_MS = 24 * 60 * 60 * 1000;
const MISSED_MS = 10 * 60 * 1000;
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};
const DP_IN_PAGE = /amazon\.com\/(?:[^"'\s<>]*\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})/i;

async function follow(url) {
  let current = url;
  for (let hop = 0; hop < 6; hop++) {
    const res = await fetch(current, { redirect: "manual", headers: HEADERS, signal: AbortSignal.timeout(4000), cache: "no-store" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).toString();
      const asin = amazonAsin(current);
      if (asin) return asin;
      continue;
    }
    const asin = amazonAsin(current);
    if (asin) return asin;
    // Some short links land on a page that redirects with a meta tag or script.
    if (res.ok && (res.headers.get("content-type") || "").includes("html")) {
      const html = (await res.text()).slice(0, 300_000);
      const match = html.match(DP_IN_PAGE);
      if (match) return match[1].toUpperCase();
    }
    return null;
  }
  return null;
}

export async function resolveAmazonAsin(url) {
  if (!isAmazonShortLink(url)) return amazonAsin(url);
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < (hit.asin ? FOUND_MS : MISSED_MS)) return hit.asin;
  let asin = null;
  try {
    asin = await follow(url);
  } catch (error) {
    console.error("Amazon short link didn't resolve", url, error?.message);
  }
  cache.set(url, { asin, at: Date.now() });
  return asin;
}

// forShop, plus Amazon's photo for a short link with no photo of its own.
export async function forShopResolved(item) {
  const shown = forShop(item);
  if (!shown || shown.image_url || !isAmazonShortLink(shown.url)) return shown;
  const asin = await resolveAmazonAsin(shown.url);
  return asin ? withAmazonImage(shown, asin) : shown;
}
