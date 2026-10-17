import { ImageResponse } from "next/og";
import { categoryFor } from "@/lib/content";
import { getPost } from "@/lib/data";
import { BAND, INK, PINK, coverData, pinAssets } from "@/lib/pinImage";

// The wide 1200x630 preview for a post shared in texts, Facebook or
// iMessage: the cover photo on the left, the title on the post's color on
// the right, the same look as its Pinterest pin (../pin).

const W = 1200;
const H = 630;
const PHOTO = 540;

function titleSize(title) {
  const n = title.length;
  return n > 70 ? 46 : n > 50 ? 54 : n > 32 ? 62 : 72;
}

export async function GET(req, { params }) {
  const { font, logo } = await pinAssets(new URL(req.url).origin);
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });

  const cat = categoryFor(post.category);
  const band = BAND[cat.color] || PINK;
  const onBand = cat.color === "pink" ? "#ffffff" : INK;
  const photo = await coverData(post.cover_url || post.recipe?.image_url || post.recipes?.[0]?.image_url);

  return new ImageResponse(
    <div style={{ width: W, height: H, display: "flex", background: band, fontFamily: "Lilita", position: "relative" }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM
        <img
          src={photo}
          alt=""
          width={PHOTO}
          height={H}
          style={{ width: PHOTO, height: H, objectFit: "cover", borderRight: `8px solid ${INK}` }}
        />
      ) : null}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "50px 60px",
          color: onBand,
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              color: INK,
              border: `4px solid ${INK}`,
              borderRadius: 999,
              padding: "4px 22px",
              fontSize: 28,
              transform: "rotate(-2deg)",
            }}
          >
            {cat.label}
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: titleSize(post.title), lineHeight: 1.05, letterSpacing: 1 }}>
          {post.title}
        </div>
        <div style={{ display: "flex", marginTop: 26, fontSize: 30, opacity: 0.9 }}>cocoscare.com</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
      <img src={logo} alt="" width={130} height={130} style={{ position: "absolute", bottom: 24, right: 24 }} />
    </div>,
    {
      width: W,
      height: H,
      fonts: [{ name: "Lilita", data: font, weight: 400, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    },
  );
}
