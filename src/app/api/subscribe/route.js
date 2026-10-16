import { EMAIL, clientIp, ipLimiter } from "@/lib/ipLimit";
import { mailchimpConfigured, subscribe } from "@/lib/mailchimp";

// The blog's email signup: adds the address to the Mailchimp audience,
// tagged "blog" plus where it came from (a post's category, or "home").
// The answer is the same for a new or existing address.

const limited = ipLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  // The hidden "website" field is only ever filled in by bots.
  if (body?.website) return Response.json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ error: "That email doesn't look right." }, { status: 400 });
  }
  const source = typeof body?.source === "string" && /^[a-z0-9-]{1,40}$/.test(body.source) ? body.source : null;

  if (limited(clientIp(request))) return Response.json({ error: "Too many tries. Try again in a few minutes." }, { status: 429 });

  if (!mailchimpConfigured) return Response.json({ error: "Signups aren't open yet. Check back soon!" }, { status: 503 });
  const result = await subscribe(email, ["blog", source].filter(Boolean)).catch((e) => ({ error: e.message }));
  if (result.error) {
    console.error("subscribe failed", result.error, result.detail || "");
    // Mailchimp refuses fake-looking or previously bounced addresses as "Invalid Resource".
    if (result.status === 400)
      return Response.json({ error: "Mailchimp didn't accept that email. Try another one." }, { status: 400 });
    return Response.json({ error: "Couldn't sign you up just now. Try again soon." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
