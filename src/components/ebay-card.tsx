import { Link } from "@tanstack/react-router";
import type { EbayHit } from "@/lib/ebay/types";
import { formatUsd } from "@/lib/utils";

export function EbayCard({ item }: { item: EbayHit }) {
  return (
    <article className="group overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
      <Link to="/market/$itemId" params={{ itemId: item.itemId }} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="media h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-end p-3 font-mono text-xs text-subtle">No photo</div>
          )}
          <div className="absolute left-2 top-2 rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink">
            eBay
          </div>
          <div className="absolute bottom-2 right-2 rounded-sm bg-ink/80 px-2 py-1 font-mono text-sm tabular-nums text-paper">
            {formatUsd(item.priceCents)}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <Link to="/market/$itemId" params={{ itemId: item.itemId }} className="block">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-tight text-fg">
            {item.title}
          </h3>
        </Link>
        <p className="text-xs text-muted">
          {item.condition ?? "Condition unlisted"}
          {item.location ? ` · ${item.location}` : ""}
        </p>
        <p className="text-xs text-subtle">
          {item.seller ?? "Seller"}
          {item.feedback ? ` · ${item.feedback}%` : ""}
          {item.shippingCents === 0 ? " · free ship" : item.shippingCents ? ` · ship ${formatUsd(item.shippingCents)}` : ""}
        </p>
      </div>
    </article>
  );
}

export function EbayGrid({ items }: { items: EbayHit[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <EbayCard key={item.itemId} item={item} />
      ))}
    </div>
  );
}
