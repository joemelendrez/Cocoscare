import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase";

// Called by /admin after a save so the live pages update now instead of
// within the minute their cache allows. Only admins may call it, and only
// for the site's own content pages.
const ALLOWED = /^\/(blog(\/[a-z0-9-]+)?|shop)?$/;

export async function POST(request) {
  if (!supabaseConfigured) return Response.json({ error: "Not configured" }, { status: 503 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error } = await db.rpc("is_admin");
  if (error || isAdmin !== true) return Response.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p) => typeof p === "string" && ALLOWED.test(p)).slice(0, 20) : [];
  for (const path of new Set(paths)) revalidatePath(path);
  return Response.json({ revalidated: [...new Set(paths)] });
}
