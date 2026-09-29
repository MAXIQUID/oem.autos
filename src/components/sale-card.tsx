import type { CopartLot } from "@/lib/copart/types";
import { isIndexableVin } from "@/lib/vin";
import { formatUsd } from "@/lib/utils";
import { VehicleLink } from "@/components/vehicle-link";

export function SaleCard({ lot }: { lot: CopartLot }) {
  const price = lot.bidCents ?? lot.binCents;
  return (
    <VehicleLink
      lot={lot.lot}
      vin={lot.vin}
      className="group overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {lot.thumb ? (
          <img
            src={lot.thumb}
            alt={`${lot.year} ${lot.make} ${lot.model}${isIndexableVin(lot.vin) ? ` VIN ${lot.vin}` : ""}`}
            loading="lazy"
            className="media h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-end p-3 font-mono text-xs text-subtle">No photo</div>
        )}
        {isIndexableVin(lot.vin) ? (
          <div className="absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-sm bg-ink/80 px-2 py-1 font-mono text-[11px] tracking-wide text-paper">
            {lot.vin}
          </div>
        ) : null}
        {price ? (
          <div className="absolute bottom-2 right-2 rounded-sm bg-ink/80 px-2 py-1 font-mono text-sm tabular-nums text-paper">
            {formatUsd(price)}
          </div>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 font-display text-xl font-semibold leading-tight tracking-tight">
          {lot.year} {lot.make} {lot.model}
        </h3>
        <p className="truncate text-sm text-muted">{lot.damage || "Damage unlisted"}</p>
        <p className="truncate text-sm text-subtle">
          {[
            lot.city && lot.state ? `${lot.city}, ${lot.state}` : lot.yard || lot.state,
            lot.saleDate !== "Unscheduled" ? lot.saleDate : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Location unlisted"}
        </p>
      </div>
    </VehicleLink>
  );
}
