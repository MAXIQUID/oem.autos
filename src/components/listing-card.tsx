import { Link } from "@tanstack/react-router";
import { GradeBadge, StatusBadge } from "@/components/status-badge";
import { listingImage, ymm } from "@/lib/oem/media";
import type { InventoryItem } from "@/lib/oem/types";
import { formatUsd } from "@/lib/utils";

export function ListingCard({ item }: { item: InventoryItem }) {
  const src = listingImage(item);
  return (
    <article className="group overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]">
      <Link to="/listing/$sku" params={{ sku: item.sku }} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          <img
            src={src}
            alt=""
            className="media h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute left-2 top-2 flex gap-1">
            <StatusBadge status={item.status} />
          </div>
          <div className="absolute bottom-2 right-2 rounded-sm bg-ink/80 px-2 py-1 font-mono text-sm tabular-nums text-paper">
            {formatUsd(item.price_cents)}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <Link to="/listing/$sku" params={{ sku: item.sku }} className="block">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-fg">
            {item.part_name}
          </h3>
        </Link>
        <p className="font-mono text-xs text-muted">
          <Link to="/part/$oem" params={{ oem: item.oem_number }} className="hover:text-fg">
            {item.oem_number}
          </Link>
        </p>
        <div className="flex items-center justify-between gap-2 text-xs text-subtle">
          <span>
            {ymm(item)}
            {item.position ? ` · ${item.position}` : ""}
          </span>
          <GradeBadge grade={item.grade} />
        </div>
      </div>
    </article>
  );
}
