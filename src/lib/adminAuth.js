import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "@/lib/supabase";

// Checks the caller's Supabase login (Bearer token) is on the admins list.
// Returns null when allowed, or the Response to send back when not.
export async function adminOnly(request) {
  if (!supabaseConfigured) return Response.json({ error: "Not configured" }, { status: 503 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: isAdmin, error } = await db.rpc("is_admin");
  if (error || isAdmin !== true) return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
