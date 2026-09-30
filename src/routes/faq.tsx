import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

const QUESTIONS = [
  {
    q: "What can I search?",
    a: "Salvage automobiles on the current US sale sheet, and the used eBay listings whose titles name that year, make, and model.",
  },
  {
    q: "Are motorcycles included?",
    a: "No. The index is automobiles only.",
  },
  {
    q: "Is the VIN decoder free?",
    a: "Yes. A VIN on the sale sheet opens that donor. Any other VIN is sent to NHTSA. If NHTSA does not return a year, make, and model, the page says it did not resolve. The site does not guess.",
  },
  {
    q: "Do I need an account?",
    a: "No. Search, the decoder, Buy now, and Sell similar work without one. Creating an account does not yet save a yard, a watchlist, or a cart.",
  },
  {
    q: "Where does the purchase happen?",
    a: "On eBay. Buy now opens the listing. Sell similar opens eBay’s listing form. OEM.autos does not charge a card or mark a part sold.",
  },
  {
    q: "Why do some parts disappear from a long list?",
    a: "Listings with the same words are folded into one row, and the row says how many more were folded. Left and right stay separate.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | OEM.autos" },
      {
        name: "description",
        content: "What OEM.autos searches, what the VIN decoder does, and where the purchase happens.",
      },
    ],
    links: [{ rel: "canonical", href: "https://oem.autos/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight">FAQ</h1>
        <dl className="mt-8 space-y-8">
          {QUESTIONS.map((item) => (
            <div key={item.q}>
              <dt className="font-display text-2xl font-semibold tracking-tight">{item.q}</dt>
              <dd className="mt-2 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </main>
    </PageShell>
  );
}
