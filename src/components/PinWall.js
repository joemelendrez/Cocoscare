"use client";

import Link from "next/link";
import { Parallax } from "@/components/Motion";
import { CategoryIcon, Sparkle } from "@/components/Doodles";
import { COLOR, categoryFor } from "@/lib/content";

// Pinterest-style tall cards in columns that scroll at different speeds.
// Shows a post's cover when it has one, else its category color.
const HEIGHTS = ["h-72", "h-96", "h-80", "h-[22rem]", "h-64", "h-[26rem]"];
const SPEEDS = [60, -50, 90];

function Pin({ post, i }) {
  const cat = categoryFor(post.category);
  return (
    <Link
      href={post.sample ? "/blog" : `/blog/${post.slug}`}
      className={`group relative flex rounded-[1.75rem] border-[3px] border-ink shadow-[6px_6px_0_var(--pink)] transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-[-1.5deg] flex-col justify-between overflow-hidden p-5 ${COLOR[cat.color].bg} ${HEIGHTS[i % HEIGHTS.length]}`}
    >
      <div className="dots-ink absolute inset-0 opacity-60" aria-hidden="true" />
      {post.cover_url && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs */}
          <img src={post.cover_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent" aria-hidden="true" />
        </>
      )}
      <span className="follow-theme relative grid h-14 w-14 place-items-center rounded-full border-[2.5px] border-ink bg-paper transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
        <CategoryIcon name={cat.icon} className="h-9 w-9" />
      </span>
      <div className="relative">
        <span className="follow-theme rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-sm font-semibold">
          {cat.label}
        </span>
        <p
          className={`mt-3 font-display text-2xl leading-tight tracking-wide ${post.cover_url ? "text-paper text-outline" : ""}`}
        >
          {post.title}
        </p>
      </div>
      <span className="absolute right-4 top-4 rounded-full border-2 border-ink bg-pink px-3 py-1 font-display text-sm tracking-wide text-paper opacity-0 transition-opacity group-hover:opacity-100">
        Save
      </span>
    </Link>
  );
}

export default function PinWall({ posts }) {
  const columns = [[], [], []];
  posts.slice(0, 9).forEach((p, i) => columns[i % 3].push({ post: p, i }));
  return (
    <section className="relative ink-band overflow-hidden bg-ink py-24 text-paper sm:py-32">
      <div className="dots absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center text-center">
          <Sparkle className="h-10 w-10 animate-wiggle" fill="var(--butter)" />
          <h2 className="mt-3 font-display text-5xl tracking-wide sm:text-6xl">
            Pin-worthy <span className="text-pink">ideas</span>
          </h2>
          <p className="mt-3 max-w-md text-lg text-paper/75">Save them now, thank yourself at 5pm.</p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 text-ink sm:gap-6 lg:grid-cols-3">
          {columns.map((col, c) => (
            <Parallax key={c} speed={SPEEDS[c]} className={`flex flex-col gap-4 sm:gap-6 ${c === 2 ? "hidden lg:flex" : ""}`}>
              {col.map(({ post, i }) => (
                <Pin key={post.slug} post={post} i={i} />
              ))}
              {/* On two columns, the third column's pins join the first two. */}
              {c < 2 &&
                columns[2]
                  .filter((_, k) => k % 2 === c)
                  .map(({ post, i }) => (
                    <div key={post.slug} className="lg:hidden">
                      <Pin post={post} i={i} />
                    </div>
                  ))}
            </Parallax>
          ))}
        </div>
      </div>
    </section>
  );
}
