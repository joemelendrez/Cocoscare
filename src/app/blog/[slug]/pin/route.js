import { ImageResponse } from "next/og";
import { categoryFor } from "@/lib/content";
import { getPost } from "@/lib/data";
import { formatMinutes } from "@/lib/recipe";

// A tall 2:3 pin for each post (1000x1500, Pinterest's preferred size):
// the cover photo on top, the title in a big pink band under it. The post
// page's Save buttons and its cover photo's data-pin-media point here, so
// whatever gets pinned is this image instead of the 4:3 cover.

const W = 1000;
const H = 1500;
const PINK = "#ff0f9a";
const INK = "#161016";
const BAND = { pink: PINK, butter: "#ffcb47", periwinkle: "#7d93e8", mint: "#73dfbf" };

// The title font and the round Coco sticker (a 260px PNG of
// public/logo.webp, since Satori can't draw WebP) live in public/pin and
// are fetched from the site itself. Reading them off disk next to this file
// worked locally, but Netlify's function bundle leaves those files out, so
// every pin answered 500.
let assets = null;
function pinAssets(origin) {
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
async function coverData(src) {
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

function titleSize(title) {
  const n = title.length;
  return n > 70 ? 74 : n > 50 ? 86 : n > 32 ? 100 : 116;
}

// ?recipe=<id> draws one recipe card's pin instead: its photo, its name and
// how long it takes, for the recipe card's own Save button.
export async function GET(req, { params }) {
  const { font, logo } = await pinAssets(new URL(req.url).origin);
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const recipeId = new URL(req.url).searchParams.get("recipe");
  const recipe = recipeId ? [post.recipe, ...(post.recipes || [])].find((r) => r && String(r.id) === recipeId) : null;
  if (recipeId && !recipe) return new Response("Not found", { status: 404 });

  const cat = categoryFor(post.category);
  const band = BAND[cat.color] || PINK;
  const onBand = cat.color === "pink" ? "#ffffff" : INK;
  const photo = await coverData(
    recipe ? recipe.image_url || post.cover_url : post.recipe?.image_url || post.recipes?.[0]?.image_url || post.cover_url,
  );
  const title = recipe ? recipe.title : post.title;
  const minutes = recipe ? (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0) : 0;
  const chip = recipe ? ["Recipe", minutes && formatMinutes(minutes)].filter(Boolean).join(" · ") : cat.label;

  return new ImageResponse(
    <div
      style={{
        width: W,
        height: H,
        display: "flex",
        flexDirection: "column",
        background: band,
        fontFamily: "Lilita",
        position: "relative",
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM
        <img src={photo} alt="" width={W} height={860} style={{ width: W, height: 860, objectFit: "cover" }} />
      ) : null}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 70px",
          borderTop: photo ? `10px solid ${INK}` : "none",
          color: onBand,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            color: INK,
            border: `5px solid ${INK}`,
            borderRadius: 999,
            padding: "6px 30px",
            fontSize: 38,
            letterSpacing: 1,
            transform: "rotate(-2deg)",
          }}
        >
          {chip}
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: titleSize(title), lineHeight: 1.04, letterSpacing: 1 }}>
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 40, opacity: 0.9 }}>cocoscare.com</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
      <img src={logo} alt="" width={210} height={210} style={{ position: "absolute", top: 36, right: 36 }} />
    </div>,
    {
      width: W,
      height: H,
      fonts: [{ name: "Lilita", data: font, weight: 400, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
