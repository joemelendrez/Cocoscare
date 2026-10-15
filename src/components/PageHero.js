"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Bubble, Heart, Sparkle, Star } from "@/components/Doodles";

// White text on hot pink (WCAG AA, see globals.css); ink on the pastels.
const BG = {
  pink: "bg-pink-hero text-paper",
  butter: "bg-butter",
  periwinkle: "bg-periwinkle",
  mint: "bg-mint",
};

// Title band for inner pages: the title sinks slowly while the doodles
// float up faster as the page scrolls.
export default function PageHero({ eyebrow, title, children, color = "pink" }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const titleY = useTransform(scrollY, [0, 400], [0, 80]);
  const fastY = useTransform(scrollY, [0, 400], [0, -140]);
  const slowY = useTransform(scrollY, [0, 400], [0, -60]);
  const spin = useTransform(scrollY, [0, 400], [0, 90]);
  const style = (v) => (reduce ? undefined : v);

  return (
    <section className={`relative overflow-hidden border-b-[3px] border-ink pb-20 pt-36 sm:pt-40 ${BG[color]}`}>
      <div className={color === "pink" ? "dots absolute inset-0" : "dots-ink absolute inset-0"} aria-hidden="true" />
      <motion.div style={style({ y: fastY, rotate: spin })} className="absolute left-[7%] top-32">
        <Star className="h-12 w-12 sm:h-16 sm:w-16" />
      </motion.div>
      <motion.div style={style({ y: slowY })} className="absolute right-[9%] top-40">
        <Heart className="h-12 w-12 animate-wiggle sm:h-16 sm:w-16" fill={color === "pink" ? "var(--paper)" : "var(--pink)"} />
      </motion.div>
      <motion.div style={style({ y: fastY })} className="absolute bottom-6 left-[20%]">
        <Bubble className="h-8 w-8" />
      </motion.div>
      <motion.div style={style({ y: slowY, rotate: spin })} className="absolute bottom-10 right-[24%]">
        <Sparkle className="h-9 w-9" fill="var(--butter)" />
      </motion.div>

      <motion.div style={style({ y: titleY })} className="relative mx-auto max-w-3xl px-5 text-center">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 20, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className="sticker-sm inline-block rounded-full bg-paper px-4 py-1 font-display text-base tracking-wide text-ink"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.08 }}
          className={`mt-4 font-display text-6xl leading-none tracking-wide sm:text-7xl ${color === "pink" ? "text-outline" : ""}`}
        >
          {title}
        </motion.h1>
        {children && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-lg font-medium sm:text-xl"
          >
            {children}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
