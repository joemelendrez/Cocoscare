"use client";

import { usePathname } from "next/navigation";

// The admin has its own header, so the site's header and footer step aside.
export default function HideOnAdmin({ children }) {
  const pathname = usePathname();
  return pathname?.startsWith("/admin") ? null : children;
}
