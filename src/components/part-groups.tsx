import { EbayCard } from "@/components/ebay-card";
import type { PartsReport } from "@/lib/copart/types";
import { formatUsd } from "@/lib/utils";

export function PartsBoard({ report }: { report: PartsReport }) {
  if (report.error) return <p className="mt-6 text-sm text-danger">{report.error}</p>;
  if (report.groups.length === 0) {
    return <p className="mt-6 text-sm text-subtle">No used listing named this vehicle.</p>;
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-4">
        <Stat n={String(report.shown)} l="listings" />
        <Stat n={formatUsd(report.high)} l="highest" />
        <Stat n={formatUsd(report.median)} l="median" />
        <Stat n={formatUsd(report.low)} l="lowest" />
      </div>
      {report.groups.map((group) => (
        <section key={group.id} className="mt-8 min-w-0">
          <h3 className="font-display text-2xl font-semibold tracking-tight">
            {group.label}
            <span className="ml-2 text-muted">({group.items.length})</span>
          </h3>
          <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3">
            {group.items.map((item) => (
              <div key={item.itemId} className="w-52 shrink-0 snap-start">
                <EbayCard item={item} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-bg px-4 py-5">
      <p className="font-display text-3xl font-semibold tabular-nums">{n}</p>
      <p className="mt-1 text-sm text-muted">{l}</p>
    </div>
  );
}
