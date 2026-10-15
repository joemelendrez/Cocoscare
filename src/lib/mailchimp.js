import { createHash } from "node:crypto";

// The blog's email list lives in a Mailchimp audience. Set MAILCHIMP_API_KEY
// (it ends in the data center, like "-us21") and MAILCHIMP_AUDIENCE_ID on
// Netlify; until then the signup form says signups aren't open yet.
const KEY = process.env.MAILCHIMP_API_KEY;
const AUDIENCE = process.env.MAILCHIMP_AUDIENCE_ID;

export const mailchimpConfigured = Boolean(KEY && AUDIENCE && KEY.includes("-"));

function memberUrl(email) {
  const dc = KEY.split("-").pop();
  const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
  return `https://${dc}.api.mailchimp.com/3.0/lists/${AUDIENCE}/members/${hash}`;
}

function call(url, method, body) {
  return fetch(url, {
    method,
    headers: { Authorization: `Basic ${Buffer.from(`any:${KEY}`).toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
}

// Adds the address (or leaves an existing member as they are: someone who
// unsubscribed stays unsubscribed) and tags where they signed up.
export async function subscribe(email, tags = []) {
  const url = memberUrl(email);
  const res = await call(url, "PUT", { email_address: email, status_if_new: "subscribed" });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    return { error: detail.title || `Mailchimp ${res.status}`, status: res.status, detail: detail.detail };
  }
  if (tags.length) {
    const t = await call(`${url}/tags`, "POST", { tags: tags.map((name) => ({ name, status: "active" })) });
    if (!t.ok) console.error("mailchimp tags failed", t.status);
  }
  return { ok: true };
}
