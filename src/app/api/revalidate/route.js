import { revalidatePath } from "next/cache";
import { adminOnly } from "@/lib/adminAuth";

// Called by /admin after a save so the live pages update now instead of
// within the minute their cache allows. Only admins may call it, and only
// for the site's own content pages.
const ALLOWED = /^\/(blog(\/[a-z0-9-]+)?|shop)?$/;

export async function POST(request) {
  const denied = await adminOnly(request);
  if (denied) return denied;

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
