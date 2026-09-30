import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { lookupInventory } from "@/lib/copart/queries";
import { resolveVinToVehicle } from "@/lib/vehicles/queries";
import type { IdentityVehicle } from "@/lib/vehicles/types";
import { normalizeVin } from "@/lib/vin";

export const Route = createFileRoute("/decoder")({
  head: () => ({
    meta: [
      { title: "Free VIN decoder | OEM.autos" },
      {
        name: "description",
        content:
          "Decode a 17-character VIN. If the car is on the current sale sheet, open that donor. Otherwise the result comes from NHTSA.",
      },
    ],
    links: [{ rel: "canonical", href: "https://oem.autos/decoder" }],
  }),
  component: DecoderPage,
});

function DecoderPage() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vin, setVin] = useState<string | null>(null);
  const [onSheet, setOnSheet] = useState(false);
  const [vehicle, setVehicle] = useState<IdentityVehicle | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = normalizeVin(value);
    setError(null);
    setVin(null);
    setVehicle(null);
    setOnSheet(false);
    if (next.length !== 17) {
      setError("A VIN is 17 characters. This one was not decoded.");
      return;
    }
    setBusy(true);
    try {
      const found = await lookupInventory({ data: { q: next } });
      setVin(next);
      setOnSheet(Boolean(found.vin));
      try {
        const resolved = await resolveVinToVehicle({ data: { vin: next } });
        setVehicle(resolved.vehicle);
      } catch (err) {
        if (!found.vin) {
          setError(err instanceof Error ? err.message : "That VIN did not resolve to a vehicle.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The sale sheet could not be searched.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Free VIN decoder</h1>
        <p className="mt-4 text-muted">
          Enter a VIN. If that automobile is on the current sale sheet, you can open the donor. If
          it is not, the identity is whatever NHTSA returns. Nothing is guessed.
        </p>
        <form onSubmit={(event) => void submit(event)} className="mt-8 flex gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck={false}
            aria-label="VIN"
            placeholder="17-character VIN"
            className="h-12 min-w-0 flex-1 rounded-md bg-surface-2 px-4 font-mono tracking-wider text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Decoding" : "Decode"}
          </Button>
        </form>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {vin ? (
          <section className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-sm">{vin}</p>
            {vehicle ? (
              <>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {[vehicle.configuration, vehicle.body, vehicle.drive, vehicle.transmission]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-2 text-xs uppercase tracking-widest text-subtle">
                  Source: {vehicle.source === "nhtsa" ? "NHTSA" : vehicle.source}
                </p>
                <Link
                  to="/vehicle/$id"
                  params={{ id: vehicle.id }}
                  className="mt-4 inline-block text-sm text-fg underline"
                >
                  Parts for this vehicle
                </Link>
              </>
            ) : onSheet ? (
              <p className="mt-3 text-sm text-muted">NHTSA did not resolve a build for this VIN.</p>
            ) : null}
            {onSheet ? (
              <p className="mt-4">
                <Link to="/vin/$vin" params={{ vin }} className="text-sm font-medium text-fg underline">
                  This VIN is on the current sale sheet
                </Link>
              </p>
            ) : (
              <p className="mt-4 text-sm text-subtle">Not on the current sale sheet.</p>
            )}
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
