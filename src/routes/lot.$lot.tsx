import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PartsBoard } from "@/components/part-groups";
import { getSaleLot, getSaleParts } from "@/lib/copart/queries";
import type { PartsReport } from "@/lib/copart/types";
import { formatMiles, formatUsd, formatVin } from "@/lib/utils";

export const Route = createFileRoute("/lot/$lot")({
  loader: ({ params }) => getSaleLot({ data: { lot: params.lot } }),
  component: SaleLotPage,
});

function SaleLotPage() {
  const { lot } = Route.useLoaderData();

  if (!lot) {
    return (
      <PageShell>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold">Lot not on this sheet</h1>
          <Link to="/" className="mt-6 inline-block text-sm text-muted hover:text-fg">
            Back to the sale
          </Link>
        </main>
      </PageShell>
    );
  }

  const runs = lot.runs.toLowerCase().includes("run");

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs uppercase tracking-widest text-subtle">
          <Link to="/vehicles" className="hover:text-fg">
            Vehicles
          </Link>
          {" · "}Lot {lot.lot}
        </p>
        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {lot.photo || lot.thumb ? (
              <img
                src={lot.photo || lot.thumb}
                alt=""
                className="media aspect-[4/3] w-full object-cover"
                onError={(e) => {
                  if (lot.thumb && e.currentTarget.src !== lot.thumb) e.currentTarget.src = lot.thumb;
                }}
              />
            ) : (
              <div className="flex aspect-[4/3] items-end p-6 text-sm text-subtle">No photo</div>
            )}
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {lot.year} {lot.make} {lot.model}
            </h1>
            <p className="mt-2 text-muted">
              {[lot.trim, lot.body, lot.color].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-4 font-mono text-sm tracking-wide text-fg">
              {lot.vin ? formatVin(lot.vin) : "VIN unlisted"}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Fact label="Damage" value={lot.damage || "—"} />
              <Fact label="Secondary" value={lot.secondary || "—"} />
              <Fact label="Odometer" value={lot.miles ? formatMiles(lot.miles) : "—"} />
              <Fact label="Runs" value={runs ? lot.runs : "Not verified"} />
              <Fact label="Keys" value={lot.keys || "—"} />
              <Fact label="Title" value={lot.title || "—"} />
              <Fact label="Engine" value={lot.engine || "—"} />
              <Fact label="Drive" value={lot.drive || "—"} />
              <Fact label="Transmission" value={lot.trans || "—"} />
              <Fact label="Fuel" value={lot.fuel || "—"} />
              <Fact label="Yard" value={lot.yard || `${lot.city}, ${lot.state}`} />
              <Fact label="Sale" value={lot.saleDate} />
              <Fact label="High bid" value={formatUsd(lot.bidCents)} />
              <Fact label="Buy it now" value={formatUsd(lot.binCents)} />
              <Fact label="Retail" value={formatUsd(lot.retailCents)} />
              <Fact label="Repair est." value={formatUsd(lot.repairCents)} />
            </dl>
          </div>
        </div>
        <PartsPanel lotId={String(lot.lot)} />
      </main>
    </PageShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-subtle">{label}</dt>
      <dd className="mt-1 text-fg">{value}</dd>
    </div>
  );
}

function PartsPanel({ lotId }: { lotId: string }) {
  const [report, setReport] = useState<PartsReport | null>(null);

  useEffect(() => {
    let cancel = false;
    setReport(null);
    getSaleParts({ data: { lot: lotId } })
      .then((next) => {
        if (!cancel) setReport(next);
      })
      .catch(() => {
        if (!cancel) {
          setReport({
            label: "",
            error: "eBay search failed",
            shown: 0,
            low: null,
            median: null,
            high: null,
            items: [],
            groups: [],
          });
        }
      });
    return () => {
      cancel = true;
    };
  }, [lotId]);

  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl font-semibold tracking-tight">Used OEM parts</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Live used listings whose titles name this vehicle. Asking prices, highest first.
      </p>
      {!report ? (
        <p className="mt-6 text-sm text-subtle">Searching eBay for used OEM parts…</p>
      ) : report.error ? (
        <p className="mt-6 text-sm text-danger">{report.error}</p>
      ) : report.items.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">No used listing named this vehicle.</p>
      ) : (
        <PartsBoard report={report} />
      )}
    </section>
  );
}

