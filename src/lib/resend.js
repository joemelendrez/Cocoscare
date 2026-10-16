// One-off emails (a recipe someone sent to themselves) go through Resend,
// since Mailchimp only sends campaigns to the whole list. Set RESEND_API_KEY
// on Netlify after verifying cocoscare.com in Resend; RESEND_FROM overrides
// the sender. Until then the "Email me this recipe" button stays hidden.
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "Coco's Care <recipes@cocoscare.com>";

export const resendConfigured = Boolean(KEY);

export async function sendEmail({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    return { error: detail.message || `Resend ${res.status}`, status: res.status };
  }
  return { ok: true };
}
