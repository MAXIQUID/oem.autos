import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About OEM.autos" },
      {
        name: "description",
        content:
          "OEM.autos connects US salvage yards with people buying used OEM parts. Find the donor, then buy or list the part on eBay.",
      },
    ],
    links: [{ rel: "canonical", href: "https://oem.autos/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight">OEM.autos</h1>
        <p className="mt-6 text-lg text-muted">
          OEM.autos connects salvage yards in the United States with people who need a used OEM
          part. The point is a simpler search, and a purchase that starts from the right donor
          vehicle.
        </p>
        <div className="mt-10 space-y-4 text-muted">
          <p>
            Find the donor by VIN, or by year, make, and model. The parts list is live eBay
            listings whose titles name that vehicle. Repeat listings are folded together so the
            same part is not shown ten times.
          </p>
          <p>
            Buy now opens that eBay listing. Sell similar opens eBay’s form with the item filled
            in, so a yard can list the part it pulled. The listing and the payment happen on eBay.
            OEM.autos does not take the order.
          </p>
          <p>
            Fitment is only what the listing and the vehicle record actually say. A part is not
            marked sold, shipped, or identified by a person here.
          </p>
        </div>
      </main>
    </PageShell>
  );
}
