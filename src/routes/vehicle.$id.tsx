import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { PartsBoard } from "@/components/part-groups";
import type { PartsReport } from "@/lib/copart/types";
import { getIdentity, getVehicleParts } from "@/lib/vehicles/queries";
import type { IdentityVehicle } from "@/lib/vehicles/types";

export const Route = createFileRoute("/vehicle/$id")({
  loader: ({ params }) => getIdentity({ data: { id: params.id } }),
  component: VehiclePage,
});

function VehiclePage() {
  const vehicle = Route.useLoaderData();

  if (!vehicle) {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold">Vehicle not in the catalog</h1>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Identity vehicle={vehicle} />
        <Parts id={vehicle.id} />
      </main>
    </PageShell>
  );
}

function Identity({ vehicle }: { vehicle: IdentityVehicle }) {
  const engine = [
    vehicle.engine.cylinders != null ? `${vehicle.engine.cylinders} cyl` : null,
    vehicle.engine.displacement_l != null ? `${vehicle.engine.displacement_l}L` : null,
    vehicle.engine.induction,
  ]
    .filter(Boolean)
    .join(" ");
  const facts = [
    { label: "Engine", value: engine || null },
    { label: "Fuel", value: vehicle.engine.fuel },
    { label: "Transmission", value: vehicle.transmission },
    { label: "Drive", value: vehicle.drive },
    { label: "Body", value: vehicle.body },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <section>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>
      {facts.length ? (
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs uppercase tracking-widest text-subtle">{fact.label}</dt>
              <dd className="mt-1">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function Parts({ id }: { id: string }) {
  const [report, setReport] = useState<PartsReport | null>(null);

  useEffect(() => {
    let cancel = false;
    setReport(null);
    getVehicleParts({ data: { id } })
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
  }, [id]);

  return (
    <section className="mt-10 min-w-0">
      <h2 className="font-display text-3xl font-semibold tracking-tight">Used OEM parts</h2>
      {!report ? (
        <p className="mt-4 text-sm text-subtle">Searching used OEM listings…</p>
      ) : (
        <PartsBoard report={report} />
      )}
    </section>
  );
}
