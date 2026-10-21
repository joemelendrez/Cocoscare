import { adminClient } from "@/lib/adminAuth";
import { audienceId, mailchimp, mailchimpAdminUrl, mailchimpConfigured } from "@/lib/mailchimp";
import { NEWSLETTER_LIMITS, newsletterHtml } from "@/lib/newsletterEmail";

// Admins only. Newsletters for /admin/newsletter, as Mailchimp campaigns:
// - GET: recent campaigns to this audience, and how many people are on it
// - POST { action: "draft" }: saves the issue as a draft campaign (or
//   updates the draft `id` it made before)
// - POST { action: "test" }: the same, then sends a test to the signed-in
//   admin's own email
// Nothing here sends to the list. That happens in Mailchimp, where the
// draft opens with Send or Schedule.

const validId = (id) => typeof id === "string" && /^[a-z0-9]{6,20}$/i.test(id);
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function guard(request) {
  const auth = await adminClient(request);
  if (auth.denied) return auth;
  if (!mailchimpConfigured) {
    return {
      denied: Response.json({ error: "Set MAILCHIMP_API_KEY and MAILCHIMP_AUDIENCE_ID on Netlify first." }, { status: 503 }),
    };
  }
  return auth;
}

export async function GET(request) {
  const { denied } = await guard(request);
  if (denied) return denied;
  try {
    const fields =
      "campaigns.id,campaigns.web_id,campaigns.status,campaigns.settings.subject_line,campaigns.create_time,campaigns.send_time,campaigns.emails_sent,campaigns.report_summary.open_rate,campaigns.report_summary.click_rate";
    const [list, campaigns] = await Promise.all([
      mailchimp(`/lists/${audienceId}?fields=stats.member_count`),
      mailchimp(`/campaigns?list_id=${audienceId}&count=15&sort_field=create_time&sort_dir=DESC&fields=${fields}`),
    ]);
    return Response.json({
      subscribers: list.stats?.member_count ?? null,
      campaigns: (campaigns.campaigns || []).map((c) => ({
        id: c.id,
        subject: c.settings?.subject_line || "(no subject)",
        status: c.status,
        created: c.create_time,
        sent: c.send_time || null,
        emailsSent: c.emails_sent || 0,
        openRate: c.report_summary?.open_rate ?? null,
        clickRate: c.report_summary?.click_rate ?? null,
        url: mailchimpAdminUrl(c.status === "save" ? `/campaigns/edit?id=${c.web_id}` : `/reports/summary?id=${c.web_id}`),
      })),
    });
  } catch (err) {
    console.error("newsletter list failed", err);
    return Response.json({ error: `Couldn't reach Mailchimp: ${err.message}` }, { status: 502 });
  }
}

export async function POST(request) {
  const { denied, db, token } = await guard(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== "draft" && action !== "test") return Response.json({ error: "Bad request" }, { status: 400 });

  const issue = {
    subject: text(body.subject, NEWSLETTER_LIMITS.subject),
    preheader: text(body.preheader, NEWSLETTER_LIMITS.preheader),
    heading: text(body.heading, NEWSLETTER_LIMITS.heading),
    markdown: typeof body.markdown === "string" ? body.markdown : "",
  };
  if (!issue.subject || !issue.markdown.trim()) {
    return Response.json({ error: "Add a subject and something to say." }, { status: 400 });
  }
  if (issue.markdown.length > NEWSLETTER_LIMITS.markdown) {
    return Response.json({ error: "That issue is too long for one email. Split it into two." }, { status: 400 });
  }

  try {
    const defaults = (await mailchimp(`/lists/${audienceId}?fields=campaign_defaults`)).campaign_defaults || {};
    if (!defaults.from_email) {
      return Response.json(
        { error: "Set the audience's default From email in Mailchimp (Audience › Settings › Audience name and defaults)." },
        { status: 400 },
      );
    }
    const settings = {
      subject_line: issue.subject,
      preview_text: issue.preheader,
      title: `Newsletter: ${issue.subject}`.slice(0, 100),
      from_name: defaults.from_name || "Coco's Care",
      reply_to: defaults.from_email,
    };

    // Update the draft this issue made before, if it's still a draft.
    let id = validId(body.id) ? body.id : null;
    if (id) {
      const existing = await mailchimp(`/campaigns/${id}?fields=status,recipients.list_id`).catch(() => null);
      if (existing?.status !== "save" || existing?.recipients?.list_id !== audienceId) id = null;
    }
    if (id) {
      await mailchimp(`/campaigns/${id}`, { method: "PATCH", body: { settings } });
    } else {
      const created = await mailchimp("/campaigns", {
        method: "POST",
        body: { type: "regular", recipients: { list_id: audienceId }, settings },
      });
      id = created.id;
    }
    await mailchimp(`/campaigns/${id}/content`, { method: "PUT", body: { html: newsletterHtml(issue) } });
    const { web_id: webId } = await mailchimp(`/campaigns/${id}?fields=web_id`);
    const url = mailchimpAdminUrl(`/campaigns/edit?id=${webId}`);

    if (action === "test") {
      const { data } = await db.auth.getUser(token);
      const email = data?.user?.email;
      if (!email) return Response.json({ error: "Couldn't tell which email to send the test to." }, { status: 400 });
      await mailchimp(`/campaigns/${id}/actions/test`, { method: "POST", body: { test_emails: [email], send_type: "html" } });
      return Response.json({ ok: true, id, url, message: `Test sent to ${email}. The draft is saved in Mailchimp too.` });
    }
    return Response.json({ ok: true, id, url, message: "Saved as a draft in Mailchimp. Open it there to send or schedule." });
  } catch (err) {
    console.error("newsletter save failed", err);
    return Response.json({ error: `Mailchimp said: ${err.message}` }, { status: 502 });
  }
}
