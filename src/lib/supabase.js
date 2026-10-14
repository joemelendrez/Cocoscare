import { createClient } from "@supabase/supabase-js";

// Coco's own Supabase project. Until both env vars are set the site falls
// back to the sample content in content.js and /admin says it isn't set up.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(URL && ANON_KEY);

// Server-side reads of published content. No session, so RLS only ever
// returns published rows.
export function publicClient() {
  if (!supabaseConfigured) return null;
  return createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

let browserClient = null;

// The signed-in admin's client (browser only); RLS checks the admins table.
export function browserSupabase() {
  if (!supabaseConfigured) return null;
  if (!browserClient) browserClient = createClient(URL, ANON_KEY);
  return browserClient;
}
