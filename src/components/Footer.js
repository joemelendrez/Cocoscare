import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "@/components/Doodles";
import { NAV, SITE } from "@/lib/content";

export default function Footer() {
  const socials = Object.entries(SITE.social).filter(([, url]) => url);
  return (
    <footer className="relative mt-auto overflow-hidden border-t-[3px] border-ink bg-pink text-paper">
      <div className="dots absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="relative block h-16 w-16">
              <Image src="/logo.webp" alt="" fill sizes="64px" className="object-contain" />
            </span>
            <span className="font-display text-4xl tracking-wide text-paper text-outline">Coco&rsquo;s Care</span>
          </Link>
          <p className="mt-4 max-w-sm text-lg font-medium">{SITE.tagline}.</p>
        </div>
        <nav aria-label="Footer">
          <p className="font-display text-xl tracking-wide text-ink">Explore</p>
          <ul className="mt-3 space-y-2 text-lg font-medium">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:underline hover:decoration-wavy hover:underline-offset-4">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-display text-xl tracking-wide text-ink">Say hi</p>
          {socials.length ? (
            <ul className="mt-3 space-y-2 text-lg font-medium capitalize">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-lg font-medium">Pinterest and Instagram are coming soon.</p>
          )}
        </div>
      </div>
      <div className="relative border-t-[3px] border-ink bg-ink px-5 py-5 text-sm text-paper/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">
            Some links on this site are affiliate links. If you buy through them I may earn a small commission at no
            extra cost to you. As an Amazon Associate I earn from qualifying purchases.
          </p>
          <p className="flex items-center gap-1.5 whitespace-nowrap">
            © {new Date().getFullYear()} {SITE.name} <Heart className="h-4 w-4" /> <Star className="h-4 w-4" />
          </p>
        </div>
      </div>
    </footer>
  );
}
