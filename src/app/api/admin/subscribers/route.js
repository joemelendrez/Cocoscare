import { adminOnly } from "@/lib/adminAuth";
import { audienceId, mailchimp, mailchimpConfigured } from "@/lib/mailchimp";

// Admins only. The blog's Mailchimp audience for /admin/subscribers: every
// member (newest first, up to 5,000) with status and tags. Mailchimp stays
// the real list; this is a read-only view of it.
const PAGE = 1000;
const MAX = 5000;
const FIELDS = "members.email_address,members.status,members.tags,members.timestamp_opt,members.timestamp_signup,total_items";

export async function GET(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;
  if (!mailchimpConfigured) {
    return Response.json({ configured: false, members: [] });
  }
  try {
    const members = [];
    let total = 0;
    for (let offset = 0; offset < MAX; offset += PAGE) {
      const page = await mailchimp(
        `/lists/${audienceId}/members?count=${PAGE}&offset=${offset}&sort_field=timestamp_opt&sort_dir=DESC&fields=${FIELDS}`,
      );
      total = page.total_items || 0;
      for (const m of page.members || []) {
        members.push({
          email: m.email_address,
          status: m.status,
          tags: (m.tags || []).map((t) => t.name),
          joined: m.timestamp_opt || m.timestamp_signup || null,
        });
      }
      if (members.length >= total || !(page.members || []).length) break;
    }
    const monthAgo = Date.now() - 30 * 864e5;
    const newLast30 = members.filter((m) => m.status === "subscribed" && m.joined && new Date(m.joined) > monthAgo).length;
    return Response.json({ configured: true, total, members, newLast30 });
  } catch (err) {
    console.error("subscribers list failed", err);
    return Response.json({ error: `Couldn't load the list from Mailchimp: ${err.message}` }, { status: 502 });
  }
}
