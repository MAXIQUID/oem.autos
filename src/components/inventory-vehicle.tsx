import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PartsBoard } from "@/components/part-groups";
import { getSaleParts } from "@/lib/copart/queries";
import type { CopartLot, PartsReport } from "@/lib/copart/types";
import { isIndexableVin } from "@/lib/vin";
import { formatMiles, formatUsd, formatVin } from "@/lib/utils";

export const SITE = "https://oem.autos";

export function vehicleUrl(vin: string): string {
  return `${SITE}/vin/${vin}`;
}

export function vehicleJsonLd(lot: CopartLot): Record<string, unknown> {
  const name = `${lot.year} ${lot.make} ${lot.model}`;
  const url = isIndexableVin(lot.vin) ? vehicleUrl(lot.vin) : `${SITE}/lot/${lot.lot}`;
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name,
    vehicleIdentificationNumber: lot.vin || undefined,
    brand: { "@type": "Brand", name: lot.make },
    model: lot.model,
    vehicleModelDate: String(lot.year),
    bodyType: lot.body || undefined,
    color: lot.color || undefined,
    vehicleTransmission: lot.trans || undefined,
    driveWheelConfiguration: lot.drive || undefined,
    vehicleEngine: lot.engine ? { "@type": "EngineSpecification", name: lot.engine } : undefined,
    mileageFromOdometer: lot.miles
      ? { "@type": "QuantitativeValue", value: lot.miles, unitCode: "SMI" }
      : undefined,
    image: lot.photo || lot.thumb || undefined,
    url,
  };
}

export function vehicleTitle(lot: CopartLot): string {
  const name = `${lot.year} ${lot.make} ${lot.model}`;
  return isIndexableVin(lot.vin) ? `${name} VIN ${lot.vin} | OEM.autos` : `${name} | OEM.autos`;
}

export function vehicleDescription(lot: CopartLot): string {
  const name = `${lot.year} ${lot.make} ${lot.model}`;
  const place = lot.city && lot.state ? `${lot.city}, ${lot.state}` : lot.yard;
  const bits = [
    isIndexableVin(lot.vin) ? `Used OEM parts for ${name}, VIN ${lot.vin}.` : `Used OEM parts for ${name}.`,
    lot.damage ? `Damage: ${lot.damage}.` : null,
    place ? `Located in ${place}.` : null,
    lot.engine ? lot.engine : null,
    lot.drive ? lot.drive : null,
  ].filter(Boolean);
  return bits.join(" ");
}

export function InventoryVehicle({ lot }: { lot: CopartLot }) {
  const runs = lot.runs.toLowerCase().includes("run");
  const name = `${lot.year} ${lot.make} ${lot.model}`;
  const indexed = isIndexableVin(lot.vin);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(lot)) }} />
      <p className="text-xs uppercase tracking-widest text-subtle">
        <Link to="/vehicles" className="hover:text-fg">
          Vehicles
        </Link>
        {indexed ? (
          <>
            {" · "}
            <span className="font-mono normal-case tracking-wide">VIN {formatVin(lot.vin)}</span>
          </>
        ) : null}
      </p>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {lot.photo || lot.thumb ? (
            <img
              src={lot.photo || lot.thumb}
              alt={`${name}${indexed ? ` VIN ${lot.vin}` : ""}`}
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
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{name}</h1>
          <p className="mt-2 text-muted">{[lot.trim, lot.body, lot.color].filter(Boolean).join(" · ")}</p>
          <p className="mt-4 font-mono text-sm tracking-wide text-fg">{indexed ? formatVin(lot.vin) : "VIN unlisted"}</p>
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
      <PartsPanel lotId={String(lot.lot)} label={name} />
    </main>
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

function PartsPanel({ lotId, label }: { lotId: string; label: string }) {
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
        Live used listings whose titles name this {label}. Asking prices, highest first.
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
