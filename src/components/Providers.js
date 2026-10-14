"use client";

import { MotionConfig } from "framer-motion";

// Honors the visitor's "reduce motion" setting for every animation.
export default function Providers({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
