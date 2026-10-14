import { adminClient } from "@/lib/adminAuth";
import { WORDPRESS_SITE, checkLogin, listInbox, postForImport, wordpressLogin } from "@/lib/wordpressInbox";

const fail = (error) => Response.json({ error: error.message }, { status: error.status || 502 });

// /admin's "From Handoff Hero" list. GET lists the WordPress posts. POST
// { id } returns one converted to Markdown, which the admin page saves to
// Supabase under the admin's own login. POST { connect } saves the
// Application Password WordPress hands back from "Connect WordPress".
export async function GET(request) {
  const { denied, db } = await adminClient(request);
  if (denied) return denied;
  const login = await wordpressLogin(db);
  if (!login) return Response.json({ configured: false, site: WORDPRESS_SITE, posts: [] });
  try {
    return Response.json({ configured: true, site: WORDPRESS_SITE, user: login.user, saved: login.saved, posts: await listInbox(login) });
  } catch (error) {
    return Response.json({ configured: true, site: WORDPRESS_SITE, user: login.user, saved: login.saved, posts: [], error: error.message });
  }
}

export async function POST(request) {
  const { denied, db } = await adminClient(request);
  if (denied) return denied;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  if (body?.connect) {
    const { user_login: user, password } = body.connect;
    if (typeof user !== "string" || typeof password !== "string" || !user || !password || user.length > 200 || password.length > 200) {
      return Response.json({ error: "WordPress didn't send a login back. Try Connect WordPress again." }, { status: 400 });
    }
    // Always the Coco's Care site, whatever site_url came back in the link.
    const login = { site: WORDPRESS_SITE, user, password };
    try {
      const name = await checkLogin(login);
      const { error } = await db
        .from("wordpress_connection")
        .upsert({ id: true, site_url: WORDPRESS_SITE, username: user, app_password: password, updated_at: new Date().toISOString() });
      if (error) {
        const missing = error.code === "42P01" || error.code === "PGRST205";
        const text = missing
          ? "WordPress approved it, but the site can't store the login yet. Run supabase/migrations/0003_wordpress_connection.sql in Supabase's SQL Editor, then connect again."
          : "Couldn't save the WordPress login. Try again.";
        throw Object.assign(new Error(text), { status: 500 });
      }
      return Response.json({ connected: true, user: name });
    } catch (error) {
      return fail(error);
    }
  }

  const { id } = body || {};
  if (!Number.isInteger(id) || id <= 0) return Response.json({ error: "Bad request" }, { status: 400 });
  const login = await wordpressLogin(db);
  if (!login) return Response.json({ error: "WordPress isn't connected yet." }, { status: 503 });
  try {
    return Response.json({ post: await postForImport(login, id) });
  } catch (error) {
    return fail(error);
  }
}
