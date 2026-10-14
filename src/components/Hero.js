"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Bubble, Cookie, Flower, Heart, Sparkle, Star } from "@/components/Doodles";

const pop = (delay) => ({
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 240, damping: 18, delay },
});

// Doodles around the logo. `depth` sets both how fast each scrolls away
// (parallax) and how far it follows the pointer, so near ones move more.
const DOODLES = [
  { C: Heart, cls: "left-[2%] top-[8%] h-14 w-14", depth: 1.4, spin: -12 },
  { C: Star, cls: "right-[4%] top-[2%] h-12 w-12", depth: 0.9, spin: 20 },
  { C: Cookie, cls: "right-[-2%] bottom-[18%] h-16 w-16", depth: 1.7, spin: 30 },
  { C: Sparkle, cls: "left-[12%] bottom-[6%] h-10 w-10", depth: 0.7, spin: -20 },
  { C: Flower, cls: "left-[-4%] top-[46%] h-12 w-12", depth: 1.2, spin: 40 },
  { C: Bubble, cls: "right-[18%] bottom-[-2%] h-9 w-9", depth: 0.5, spin: 0 },
];

function Doodle({ C, cls, depth, spin, scrollY, mx, my, reduce, i }) {
  const y = useTransform(scrollY, [0, 700], [0, -260 * depth]);
  const r = useTransform(scrollY, [0, 700], [0, spin * 3]);
  const px = useTransform(mx, (v) => v * 26 * depth);
  const py = useTransform(my, (v) => v * 26 * depth);
  return (
    <motion.div className={`absolute ${cls}`} style={reduce ? undefined : { y, rotate: r }}>
      <motion.div className="h-full w-full" style={reduce ? undefined : { x: px, y: py }}>
        <motion.div className="h-full w-full" {...pop(0.5 + i * 0.08)}>
          <div className="h-full w-full animate-bob" style={{ animationDelay: `${i * 0.4}s` }}>
            <C className="h-full w-full drop-shadow-[3px_3px_0_var(--ink)]" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const smoothY = useSpring(scrollY, { stiffness: 140, damping: 28, mass: 0.3 });
  const textY = useTransform(smoothY, [0, 700], [0, 120]);
  const logoY = useTransform(smoothY, [0, 700], [0, -90]);
  const logoR = useTransform(smoothY, [0, 700], [0, -8]);
  const wordX = useTransform(smoothY, [0, 700], [0, -220]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 80, damping: 20 });
  const smy = useSpring(my, { stiffness: 80, damping: 20 });

  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      onPointerMove={onPointerMove}
      className="dots-ink relative overflow-hidden bg-blush pb-28 pt-32 sm:pt-36 lg:pb-36"
    >
      {/* Giant outlined word drifting sideways behind everything. */}
      <motion.p
        aria-hidden="true"
        style={reduce ? undefined : { x: wordX }}
        className="pointer-events-none absolute left-0 top-[52%] whitespace-nowrap font-display text-[9rem] leading-none text-transparent opacity-[0.12] [-webkit-text-stroke:3px_var(--ink)] sm:text-[14rem] lg:text-[18rem]"
      >
        mom life mom life
      </motion.p>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.1fr_1fr]">
        <motion.div style={reduce ? undefined : { y: textY }} className="relative z-10 text-center lg:text-left">
          <motion.span
            {...pop(0.05)}
            className="sticker-sm inline-flex -rotate-2 items-center gap-2 rounded-full bg-butter px-4 py-1.5 font-display text-base tracking-wide"
          >
            <Heart className="h-4 w-4" /> Nanny-turned-mama
          </motion.span>
          <motion.h1
            {...pop(0.15)}
            className="mt-5 font-display text-[3.2rem] leading-[0.95] tracking-wide sm:text-7xl lg:text-[5.4rem]"
          >
            Mom life,
            <br />
            made a little{" "}
            <span className="relative inline-block">
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-[-0.15em] bottom-[0.06em] top-[0.32em] -z-10 -rotate-2 rounded-2xl border-[3px] border-ink bg-pink"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.55 }}
                style={{ originX: 0 }}
              />
              <span className="text-paper text-outline">sweeter.</span>
            </span>
          </motion.h1>
          <motion.p {...pop(0.25)} className="mx-auto mt-6 max-w-lg text-lg font-medium text-ink/80 sm:text-xl lg:mx-0">
            The recipes, baby and toddler finds, and family outings I trust after 10+ years of
            caring for other people&rsquo;s kids, and now my own.
          </motion.p>
          <motion.div {...pop(0.35)} className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link href="/blog" className="sticker lift rounded-full bg-paper px-7 py-3.5 font-display text-xl tracking-wide">
              Read the blog
            </Link>
            <Link
              href="/shop"
              className="lift rounded-full border-[3px] border-ink bg-ink px-7 py-3.5 font-display text-xl tracking-wide text-paper shadow-[5px_5px_0_var(--pink)] hover:shadow-[8px_8px_0_var(--pink)]"
            >
              Shop my faves
            </Link>
          </motion.div>
        </motion.div>

        <div className="relative mx-auto aspect-square w-full max-w-[26rem] lg:max-w-[30rem]">
          <motion.div style={reduce ? undefined : { y: logoY, rotate: logoR }} className="absolute inset-[6%]">
            <motion.div
              initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 13, delay: 0.2 }}
              className="relative h-full w-full"
            >
              <div className="absolute inset-[-4%] animate-spin-slow rounded-full border-[3px] border-dashed border-ink/70" />
              <div className="absolute inset-[3%] rounded-full bg-butter sticker" />
              <Image
                src="/logo.webp"
                alt="Coco, cartoon style, holding a bowl of cookie dough"
                fill
                priority
                sizes="(min-width: 1024px) 420px, 80vw"
                className="object-contain drop-shadow-[6px_6px_0_rgba(22,16,22,0.9)]"
              />
            </motion.div>
          </motion.div>
          {DOODLES.map((d, i) => (
            <Doodle key={i} i={i} {...d} scrollY={smoothY} mx={smx} my={smy} reduce={reduce} />
          ))}
        </div>
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-[-1px] h-14 w-full sm:h-20"
      >
        <path d="M0 50 C120 10 240 10 360 50 S600 90 720 50 960 10 1080 50 1320 90 1440 50 V90 H0Z" fill="var(--paper)" />
        <path
          d="M0 50 C120 10 240 10 360 50 S600 90 720 50 960 10 1080 50 1320 90 1440 50"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </section>
  );
}
