import { ImageResponse } from "next/og";
import { pinAssets } from "@/lib/pinImage";
import { IMAGE_FORMATS, cleanWords, imageColor } from "@/lib/sectionImages";
import { SECTION_ICONS } from "@/lib/sectionIcons";

// A section image for inside a post: a flat brand color, one line icon on a
// round white sticker (ink outline, hard shadow), and optional words under
// it. Built only from the site's own colors and icons, so it can't be made
// to show anything else.
//   /blog/section-image?c=butter&i=chef-hat
//   &t=Step 1        words under the sticker (40 characters at most)
//   &f=square | tall other sizes (default wide)
const INK = "#161016";

export async function GET(request) {
  const url = new URL(request.url);
  const q = url.searchParams;
  const color = imageColor(q.get("c"));
  const icon = SECTION_ICONS[q.get("i")] ? q.get("i") : "heart";
  const text = cleanWords(q.get("t"));
  const { width, height } = IMAGE_FORMATS[q.get("f")] ?? IMAGE_FORMATS.wide;
  const { font } = await pinAssets(url.origin);

  const side = Math.min(width, height);
  const badge = Math.round(side * (text ? 0.36 : 0.42));
  const iconSize = Math.round(badge * 0.56);
  const border = Math.round(side * 0.009);
  const shadow = Math.round(side * 0.014);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SECTION_ICONS[icon]}</svg>`;
  const textSize = Math.round(side * (text.length > 22 ? 0.07 : 0.09));

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: color.bg,
        fontFamily: "Lilita",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: badge,
          height: badge,
          borderRadius: badge,
          background: "#ffffff",
          border: `${border}px solid ${INK}`,
          boxShadow: `${shadow}px ${shadow}px 0 ${INK}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} width={iconSize} height={iconSize} alt="" />
      </div>
      {text && (
        <div
          style={{
            display: "flex",
            marginTop: Math.round(side * 0.06),
            maxWidth: width * 0.84,
            textAlign: "center",
            justifyContent: "center",
            color: color.ink,
            fontSize: textSize,
            lineHeight: 1.1,
          }}
        >
          {text}
        </div>
      )}
    </div>,
    {
      width,
      height,
      fonts: [{ name: "Lilita", data: font, weight: 400, style: "normal" }],
      headers: {
        "Netlify-Vary": "query",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
    },
  );
}
