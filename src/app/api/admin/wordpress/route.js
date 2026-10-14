import { adminOnly } from "@/lib/adminAuth";
import { inboxConfigured, listInbox, postForImport } from "@/lib/wordpressInbox";

// /admin's "From Handoff Hero" list. GET lists the WordPress posts; POST
// { id } returns one converted to Markdown, which the admin page saves to
// Supabase under the admin's own login.
export async function GET(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;
  if (!inboxConfigured) return Response.json({ configured: false, posts: [] });
  try {
    return Response.json({ configured: true, posts: await listInbox() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 502 });
  }
}

export async function POST(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;
  if (!inboxConfigured) return Response.json({ error: "WordPress isn't connected yet." }, { status: 503 });
  let id;
  try {
    ({ id } = await request.json());
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad request" }, { status: 400 });
  try {
    return Response.json({ post: await postForImport(id) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: error.status || 502 });
  }
}
