"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

// Pops children up into place the first time they scroll into view.
export function Reveal({ children, className, delay = 0, as = "div" }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay }}
    >
      {children}
    </Tag>
  );
}

// Moves its children vertically as the section scrolls past. `speed` is
// how far, in px, across the whole pass: positive drifts up faster than
// the page, negative lags behind. Off for people who prefer less motion.
export function Parallax({ children, className, speed = 80, rotate = 0 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const y = useTransform(smooth, [0, 1], [speed, -speed]);
  const r = useTransform(smooth, [0, 1], [-rotate, rotate]);
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y, rotate: r }}>
      {children}
    </motion.div>
  );
}

// Staggered pop-in for a grid of cards.
export function Stagger({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, tilt = 0 }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 40, rotate: tilt * 3 },
        show: { opacity: 1, y: 0, rotate: tilt, transition: { type: "spring", stiffness: 260, damping: 20 } },
      }}
    >
      {children}
    </motion.div>
  );
}
