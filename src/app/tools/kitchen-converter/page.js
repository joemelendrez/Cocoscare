import { MeasuringCup } from "@/components/Doodles";
import PageHero from "@/components/PageHero";
import KitchenConverter from "@/components/tools/KitchenConverter";

export const metadata = {
  title: "Kitchen Converter: Cups, Grams, Oven Temps and Recipe Scaling",
  description:
    "Convert cups, tablespoons, ounces and grams, switch oven temperatures, and double or halve any recipe's ingredients. Free, no sign-up.",
  alternates: { canonical: "/tools/kitchen-converter" },
};

export default function KitchenConverterPage() {
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Kitchen converter"
        color="periwinkle"
        icon={<MeasuringCup className="h-20 w-20 sm:h-24 sm:w-24" />}
      >
        Cups to grams, °F to °C, and any recipe doubled or halved.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <KitchenConverter />
        </div>
      </section>
    </>
  );
}
