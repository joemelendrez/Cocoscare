import Link from "next/link";
import { Cookie } from "@/components/Doodles";

export default function NotFound() {
  return (
    <section className="dots-ink flex min-h-[70vh] flex-col items-center justify-center bg-blush px-5 pb-16 pt-36 text-center">
      <Cookie className="h-24 w-24 animate-wiggle" />
      <h1 className="mt-6 font-display text-6xl tracking-wide">Oops, crumbs!</h1>
      <p className="mt-3 text-lg text-ink/75">This page wandered off like a toddler at Target.</p>
      <Link href="/" className="sticker lift mt-8 rounded-full bg-pink px-7 py-3 font-display text-xl tracking-wide text-paper">
        Back home
      </Link>
    </section>
  );
}
