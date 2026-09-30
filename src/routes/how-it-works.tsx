import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works | OEM.autos" },
      {
        name: "description",
        content:
          "Find a salvage automobile, open the used parts listed for it, then buy or sell similar on eBay.",
      },
    ],
    links: [{ rel: "canonical", href: "https://oem.autos/how-it-works" }],
  }),
  component: HowPage,
});

function HowPage() {
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight">How it works</h1>
        <ol className="mt-8 space-y-6 text-muted">
          <li>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">1. Find the car</h2>
            <p className="mt-1">
              Search the current US sale sheet by VIN, year, make, and model. The index is
              automobiles only.
            </p>
          </li>
          <li>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">2. Read the parts</h2>
            <p className="mt-1">
              The parts list is live used eBay listings whose titles name that vehicle. Repeat
              listings are folded together. The cheapest copy is the one shown.
            </p>
          </li>
          <li>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">3. Buy or list</h2>
            <p className="mt-1">
              Buy now opens that eBay listing. Sell similar opens eBay’s form with the item filled
              in. OEM.autos does not take payment and does not publish the listing.
            </p>
          </li>
        </ol>
        <p className="mt-10 text-sm text-subtle">
          An account is not required to search.{" "}
          <Link to="/login" className="text-fg underline">
            Create an account
          </Link>{" "}
          when you want one. It does not yet store a yard or a cart.
        </p>
      </main>
    </PageShell>
  );
}
