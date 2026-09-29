import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { getMarketItem } from "@/lib/oem/queries";
import { formatUsd } from "@/lib/utils";
import { sellSimilarUrl } from "@/lib/ebay/sell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/market/$itemId")({
  loader: ({ params }) => getMarketItem({ data: { itemId: params.itemId } }),
  component: MarketPage,
});

function MarketPage() {
  const { item, error } = Route.useLoaderData();

  if (!item) {
    return (
      <PageShell>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold">Listing unavailable</h1>
          <p className="mt-2 text-muted">{error ?? "That eBay item id is not a Browse listing."}</p>
          <Link to="/" className="mt-6 inline-block text-sm text-muted hover:text-fg">
            Back to vehicles
          </Link>
        </main>
      </PageShell>
    );
  }

  const photo = item.images[0] ?? item.image;

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-subtle">eBay Motors · marketplace instance</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {photo ? (
              <img src={photo} alt="" className="media aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-end p-6 text-sm text-subtle">No photo</div>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">{item.title}</h1>
            <p className="mt-3 font-display text-4xl tabular-nums tracking-tight">
              {formatUsd(item.priceCents)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {item.condition ?? "Condition unlisted"}
              {item.buying ? ` · ${item.buying}` : ""}
              {item.shippingCents === 0
                ? " · free shipping"
                : item.shippingCents
                  ? ` · shipping ${formatUsd(item.shippingCents)}`
                  : ""}
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
              <Fact label="Seller" value={item.seller ?? "—"} />
              <Fact label="Feedback" value={item.feedback ? `${item.feedback}%` : "—"} />
              <Fact label="Ships from" value={item.location ?? "—"} />
              <Fact label="Item" value={item.itemId} />
            </dl>
            {item.description ? <p className="mt-6 text-muted">{item.description}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {item.sellItemId ? (
                <Button asChild>
                  <a href={sellSimilarUrl(item.sellItemId)} target="_blank" rel="noreferrer">
                    Sell similar
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="secondary">
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open on eBay
                </a>
              </Button>
            </div>
          </div>
        </div>
        {item.aspects.length ? (
          <section className="mt-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Item specifics</h2>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-2">
              {item.aspects.map((a) => (
                <div key={a.name} className="bg-surface px-4 py-3">
                  <dt className="text-xs uppercase tracking-widest text-subtle">{a.name}</dt>
                  <dd className="mt-1 text-sm">{a.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-subtle">{label}</dt>
      <dd className="mt-1 break-all text-fg">{value}</dd>
    </div>
  );
}
