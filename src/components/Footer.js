import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkle, Star } from "@/components/Doodles";
import { NAV, SITE } from "@/lib/content";
import { supabaseConfigured } from "@/lib/supabase";

const TOOLS = [
  { href: "/tools/grocery-list", label: "Grocery list" },
  { href: "/tools/meal-planner", label: "Meal planner" },
  { href: "/tools/kitchen-converter", label: "Kitchen converter" },
  { href: "/tools/boredom-buster", label: "Boredom buster" },
];

const LINK = "rounded-full font-semibold decoration-wavy underline-offset-4 hover:underline";

function Column({ title, links }) {
  return (
    <nav aria-label={title}>
      <p className="inline-block -rotate-2 rounded-full border-[2.5px] border-ink bg-butter px-3.5 py-0.5 font-display text-lg tracking-wide text-ink shadow-[3px_3px_0_var(--shadow)]">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-lg">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={LINK}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// The site footer: brand, then Explore / Free tools / Your stuff columns on
// hot pink, then a dark strip with the legal links and the affiliate note.
export default function Footer() {
  const socials = Object.entries(SITE.social).filter(([, url]) => url);
  const yours = [
    ...(supabaseConfigured ? [{ href: "/account", label: "My account & saves" }] : []),
    { href: "/shop", label: "Shop my faves" },
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t-[3px] border-ink bg-pink text-paper">
      <div className="dots absolute inset-0" aria-hidden="true" />
      <Star className="absolute right-[6%] top-10 h-10 w-10 rotate-12 opacity-90" />
      <Sparkle className="absolute bottom-28 left-[46%] hidden h-8 w-8 md:block" />

      <div className="relative mx-auto grid max-w-6xl gap-x-8 gap-y-10 px-5 pb-14 pt-16 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="relative block h-16 w-16 shrink-0">
              <Image src="/coco-logo.webp" alt="" fill sizes="64px" className="object-contain" />
            </span>
            <span className="font-display text-4xl tracking-wide text-paper text-outline">Coco&rsquo;s Care</span>
          </Link>
          <p className="mt-4 max-w-sm text-lg font-medium">{SITE.tagline}.</p>
          <p className="mt-5 inline-flex rotate-1 items-center gap-2 rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0_var(--shadow)]">
            <Heart className="h-5 w-5" /> Made by a career nanny turned mom
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.length ? (
              socials.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-[2.5px] border-ink bg-ink px-4 py-1.5 font-display tracking-wide capitalize text-paper shadow-[3px_3px_0_var(--butter)] hover:-translate-y-0.5"
                >
                  {name}
                </a>
              ))
            ) : (
              <span className="rounded-full border-2 border-dashed border-paper/70 px-4 py-1.5 text-sm font-semibold">
                Pinterest &amp; Instagram coming soon
              </span>
            )}
          </div>
        </div>
        <Column title="Explore" links={NAV} />
        <Column title="Free tools" links={TOOLS} />
        <Column title="Your stuff" links={yours} />
      </div>

      <div className="relative border-t-[3px] border-ink bg-ink px-5 py-6 text-sm text-paper/80">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <p className="max-w-3xl">
            Some links on this site are affiliate links. If you buy through them I may earn a small commission at no extra cost to
            you. As an Amazon Associate I earn from qualifying purchases.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-semibold md:justify-end">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              © {new Date().getFullYear()} {SITE.name} <Heart className="h-4 w-4" />
            </span>
            <Link href="/privacy" className="hover:text-paper hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-paper hover:underline">
              Terms
            </Link>
            <a href="#" className="rounded-full border-2 border-paper/40 px-3 py-1 hover:border-paper hover:text-paper">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
