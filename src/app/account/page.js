import { Heart } from "@/components/Doodles";
import PageHero from "@/components/PageHero";
import AccountClient from "@/components/AccountClient";

export const metadata = {
  title: "My account",
  description: "Sign in with your email to keep your grocery list, meal plan and saved recipes on every device.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return (
    <>
      <PageHero eyebrow="Free account" title="My account" color="butter" icon={<Heart className="h-20 w-20 sm:h-24 sm:w-24" />}>
        Your saved recipes, grocery list and meal plan, on every device. No password, just a link in your email.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <AccountClient />
        </div>
      </section>
    </>
  );
}
