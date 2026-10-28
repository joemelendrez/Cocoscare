// Every Amazon link on the site carries our Associates tag, so a product
// pasted from a plain Amazon page still earns. Applied when a pick is saved
// and again when links render (shop, product cards, post bodies), so links
// saved before this existed are covered too. Short links (amzn.to) are left
// alone: Amazon resolves those to whoever made them, so make them from the
// joseph0f30b-20 account's SiteStripe.
export const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "joseph0f30b-20";

const AMAZON_HOST = /^(?:www\.|smile\.)?amazon\.(?:com|ca|co\.uk|com\.au|de|fr|it|es|co\.jp|in|com\.mx|com\.br|nl|se|pl|sg|ae|sa|com\.tr|com\.be)$/i;

export function isAmazonUrl(url) {
  try {
    return AMAZON_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function withAmazonTag(url) {
  if (!url || !AMAZON_TAG || !isAmazonUrl(url)) return url;
  const parsed = new URL(url);
  if (parsed.searchParams.get("tag") === AMAZON_TAG) return url;
  parsed.searchParams.set("tag", AMAZON_TAG);
  return parsed.toString();
}

const decode = (s) => s.replace(/&amp;/g, "&");
const encode = (s) => s.replace(/&/g, "&amp;");

// Rewrites href="…" Amazon links inside rendered post HTML.
export function tagAmazonLinksInHtml(html = "") {
  return html.replace(/href=(["'])(https?:\/\/[^"']+)\1/gi, (whole, quote, href) => {
    const raw = decode(href);
    const tagged = withAmazonTag(raw);
    return tagged === raw ? whole : `href=${quote}${encode(tagged)}${quote}`;
  });
}

export const withTaggedUrl = (item) => (item?.url ? { ...item, url: withAmazonTag(item.url) } : item);

// Amazon's short links: SiteStripe's link.amazon and amzn.to, the app's a.co.
const SHORT_HOST = /^(?:amzn\.to|a\.co|link\.amazon|amzn\.eu)$/i;

export function isAmazonShortLink(url) {
  try {
    return SHORT_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

// How a pick is shown on the site: the tagged link. There's no Amazon photo
// fallback: SiteStripe's image link (ws-na.amazon-adsystem.com) is retired and
// draws nothing, and the Associates agreement only allows Amazon's images
// through its own tools (PA-API), so a pick without her photo shows a heart.
export const forShop = withTaggedUrl;
