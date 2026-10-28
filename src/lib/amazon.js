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

// The product's ASIN from a full amazon.com link (/dp/…, /gp/product/…).
// Short amzn.to links don't carry one.
export function amazonAsin(url) {
  if (!isAmazonUrl(url)) return null;
  const { hostname, pathname } = new URL(url);
  if (!/amazon\.com$/i.test(hostname)) return null;
  const match = pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return match ? match[1].toUpperCase() : null;
}

// Amazon's own product photo, through the Associates image link (the same
// URL SiteStripe's image link uses). Hotlinked, never copied: Associates may
// show Amazon's images only this way.
export function amazonImageUrl(url) {
  const asin = amazonAsin(url);
  if (!asin) return null;
  const params = new URLSearchParams({
    _encoding: "UTF8",
    ASIN: asin,
    Format: "_SL500_",
    ID: "AsinImage",
    MarketPlace: "US",
    ServiceVersion: "20070822",
    WS: "1",
    tag: AMAZON_TAG,
  });
  return `https://ws-na.amazon-adsystem.com/widgets/q?${params}`;
}

// A pick with no photo of its own shows Amazon's (her photos always win).
// amazon_image marks it, so it isn't used as a share/Pinterest image.
export function withAmazonImage(item) {
  if (!item || item.image_url) return item;
  const image = amazonImageUrl(item.url);
  return image ? { ...item, image_url: image, amazon_image: true } : item;
}

// How a pick is shown on the site: tagged link, and a photo when it has none.
export const forShop = (item) => withAmazonImage(withTaggedUrl(item));
