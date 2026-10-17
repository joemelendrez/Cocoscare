// Shared by the post pin (./pin) and share preview (./og) images.

export const PINK = "#ff0f9a";
export const INK = "#161016";
export const BAND = { pink: PINK, butter: "#ffcb47", periwinkle: "#7d93e8", mint: "#73dfbf" };

// The title font and the round Coco sticker (a 260px PNG of
// public/logo.webp, since Satori can't draw WebP) live in public/pin and
// are fetched from the site itself. Reading them off disk next to this file
// worked locally, but Netlify's function bundle leaves those files out, so
// every pin answered 500.
let assets = null;
export function pinAssets(origin) {
  assets ??= Promise.all(
    ["LilitaOne.ttf", "logo.png"].map(async (name) => {
      const res = await fetch(`${origin}/pin/${name}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`pin asset ${name}: ${res.status}`);
      return res.arrayBuffer();
    }),
  ).then(([font, logo]) => ({ font, logo: `data:image/png;base64,${Buffer.from(logo).toString("base64")}` }));
  // A failed fetch isn't kept, so the next pin tries again.
  assets.catch(() => (assets = null));
  return assets;
}

// Satori draws JPEG and PNG only, so a WebP cover (some WordPress uploads)
// leaves the photo out rather than failing the whole image.
export async function coverData(src) {
  if (!src) return null;
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(8000) });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
