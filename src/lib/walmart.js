// Walmart has no public link that fills a cart from a list, so each item
// opens its own Walmart search. `affiliate` is the Impact link prefix
// (goto.walmart.com), when there is one.
export function walmartUrl(item, affiliate) {
  const search = `https://www.walmart.com/search?q=${encodeURIComponent(item)}`;
  if (!affiliate) return search;
  return `${affiliate}${affiliate.includes("?") ? "&" : "?"}u=${encodeURIComponent(search)}`;
}

// Server only: the affiliate link from env, used only if it really is a
// goto.walmart.com link.
export function walmartAffiliateLink() {
  const link = process.env.WALMART_AFFILIATE_LINK || "";
  return /^https:\/\/goto\.walmart\.com\/c\/[\w/]+$/.test(link) ? link : null;
}
