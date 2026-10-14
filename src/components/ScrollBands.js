"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Heart, Star } from "@/components/Doodles";

const WORDS = ["Easy recipes", "Mom finds", "Kid-tested outings", "Nanny tips", "Pin it for later"];

function Band({ progress, from, to, className, tilt, star }) {
  const reduce = useReducedMotion();
  const x = useTransform(progress, [0, 1], [from, to]);
  const items = [...WORDS, ...WORDS, ...WORDS];
  return (
    <div className={`-ml-[6%] w-[112%] border-y-[3px] border-ink py-3 ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <motion.div className="flex w-max items-center gap-6 whitespace-nowrap" style={reduce ? undefined : { x }}>
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-6 font-display text-3xl tracking-wide sm:text-5xl">
            {w}
            {star ? <Star className="h-8 w-8 sm:h-10 sm:w-10" /> : <Heart className="h-8 w-8 sm:h-10 sm:w-10" fill="var(--paper)" />}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// Two crossed ticker tapes that slide in opposite directions as you scroll.
export default function ScrollBands() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section ref={ref} aria-label="What you'll find here" className="relative overflow-hidden py-16 sm:py-24">
      <Band progress={scrollYProgress} from="-5%" to="-40%" tilt={-3} className="relative z-10 bg-pink text-paper" />
      <Band progress={scrollYProgress} from="-45%" to="-10%" tilt={2.5} star className="-mt-3 bg-ink text-butter" />
    </section>
  );
}
