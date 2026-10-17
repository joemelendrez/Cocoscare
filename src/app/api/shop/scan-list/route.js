import { adminOnly } from "@/lib/adminAuth";
import { clientIp, ipLimiter } from "@/lib/ipLimit";

// The Grocery List tool's "Scan a photo" (site admins only, since every
// scan is a paid AI call): reads a photo of a list (handwritten, a
// whiteboard, a screenshot) and answers the items one per line, which the
// tool then drops into the list box.

const limited = ipLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BASE64 = 6 * 1024 * 1024;
const MODEL = process.env.SCAN_MODEL || "claude-haiku-5-5";

const PROMPT = `This is a photo of a grocery or shopping list. Write out every item on it, one per line, in the order shown.
- Keep any amount or count written next to an item, in front of it (e.g. "2 lbs ground beef", "3 bananas").
- Fix obvious spelling, but don't add, merge or guess items that aren't there. Skip crossed-out items.
- No bullets, numbers, headings or comments. If you can't find a list, answer exactly: NO_LIST`;

export async function POST(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: "Photo scan isn't set up yet." }, { status: 503 });
  if (limited(clientIp(request))) return Response.json({ error: "Too many scans. Try again in a few minutes." }, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const type = String(body?.type || "");
  const data = typeof body?.data === "string" ? body.data : "";
  if (!TYPES.has(type) || !data || data.length > MAX_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(data)) {
    return Response.json({ error: "That photo didn't come through. Try another one." }, { status: 400 });
  }

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: type, data } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    console.error("scan-list failed", e.message);
    return Response.json({ error: "The scan took too long. Try again." }, { status: 504 });
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("scan-list failed", res.status, out?.error?.message);
    return Response.json({ error: "Couldn't read that photo just now. Try again." }, { status: 502 });
  }
  const text = (out.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text || text === "NO_LIST") return Response.json({ error: "Couldn't find a list in that photo." }, { status: 422 });
  return Response.json({ text: text.slice(0, 8000) });
}
