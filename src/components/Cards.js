import Link from "next/link";
import { CategoryIcon, Heart, Squiggle } from "@/components/Doodles";
import { COLOR, categoryFor } from "@/lib/content";

export function SectionTitle({ eyebrow, title, accent, children, center = true }) {
  return (
    <div className={center ? "flex flex-col items-center text-center" : ""}>
      {eyebrow && (
        <span className="sticker-sm inline-block -rotate-2 rounded-full bg-butter px-4 py-1 font-display text-base tracking-wide">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">
        {title} {accent && <span className="text-pink">{accent}</span>}
      </h2>
      <Squiggle className={`mt-4 h-4 w-28 ${center ? "" : ""}`} color="var(--pink)" />
      {children && <p className="mt-4 max-w-xl text-lg text-ink/75">{children}</p>}
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded-full border-2 border-dashed border-ink/50 bg-paper/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
      Sample
    </span>
  );
}

// Sample posts aren't real pages yet, so the cards aren't links.
export function PostCard({ post }) {
  const cat = categoryFor(post.category);
  return (
    <article className="sticker lift group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-paper">
      <div className={`dots-ink relative grid aspect-[4/3] place-items-center border-b-[3px] border-ink ${COLOR[cat.color].bg}`}>
        <span className="grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink bg-paper transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
          <CategoryIcon name={cat.icon} className="h-12 w-12" />
        </span>
        <span className="absolute left-4 top-4 rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-sm font-semibold">
          {cat.label}
        </span>
        <span className="absolute right-4 top-4">
          <SampleBadge />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight tracking-wide">{post.title}</h3>
        <p className="mt-2 text-ink/70">{post.excerpt}</p>
        <p className="mt-auto pt-4 text-sm font-semibold text-ink/60">{post.minutes} min read</p>
      </div>
    </article>
  );
}

export function PickCard({ pick }) {
  return (
    <article className="sticker lift group flex h-full flex-col rounded-[1.75rem] bg-paper p-4">
      <div className={`dots-ink relative grid aspect-square place-items-center rounded-[1.25rem] border-[3px] border-ink ${COLOR[pick.color].bg}`}>
        <Heart className="h-16 w-16 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12" fill="var(--paper)" />
        <span className="absolute right-3 top-3">
          <SampleBadge />
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl leading-tight tracking-wide">{pick.name}</h3>
      <p className="mt-1.5 flex-1 text-sm text-ink/70">
        <span className="font-semibold text-pink">Coco says:</span> {pick.note}
      </p>
      {pick.url ? (
        <a
          href={pick.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="mt-4 rounded-full border-[2.5px] border-ink bg-ink py-2.5 text-center font-display tracking-wide text-paper transition-colors hover:bg-pink"
        >
          Get it →
        </a>
      ) : (
        <span className="mt-4 rounded-full border-[2.5px] border-dashed border-ink/40 py-2.5 text-center font-display tracking-wide text-ink/50">
          Link coming soon
        </span>
      )}
    </article>
  );
}

export function CategoryCard({ cat }) {
  return (
    <Link
      href="/blog"
      className={`sticker lift group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-6 ${COLOR[cat.color].bg}`}
    >
      <span className="grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-paper transition-transform duration-300 group-hover:rotate-[-15deg] group-hover:scale-110">
        <CategoryIcon name={cat.icon} className="h-10 w-10" />
      </span>
      <h3 className="mt-5 font-display text-3xl tracking-wide">{cat.label}</h3>
      <p className="mt-2 font-medium text-ink/80">{cat.blurb}</p>
      <span className="mt-auto pt-5 font-display text-lg tracking-wide">
        Let&rsquo;s go <span className="inline-block transition-transform group-hover:translate-x-1.5">→</span>
      </span>
    </Link>
  );
}
