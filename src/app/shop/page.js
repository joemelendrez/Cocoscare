import PageHero from "@/components/PageHero";
import { ShopGrid } from "@/components/FilterGrid";
import { getProducts } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Shop my faves",
  description: "Baby gear, toddler essentials, kitchen helpers and mom style that Coco actually uses.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const { products } = await getProducts();
  return (
    <>
      <PageHero eyebrow="Coco approved" title="Shop my faves" color="periwinkle">
        Everything here is something I&rsquo;ve used with real kids. If I wouldn&rsquo;t buy it twice, it&rsquo;s
        not on this page.
      </PageHero>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <ShopGrid products={products} />
        <p className="mx-auto mt-14 max-w-2xl rounded-2xl border-2 border-dashed border-ink/40 p-5 text-center text-sm text-ink/70">
          Heads up: these are affiliate links. If you buy through them I may earn a small commission at no extra cost
          to you, which helps keep this little blog going.
        </p>
      </section>
    </>
  );
}
