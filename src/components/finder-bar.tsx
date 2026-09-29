import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { lookupInventory } from "@/lib/copart/queries";
import { resolveVinToVehicle } from "@/lib/vehicles/queries";
import { normalizeVin } from "@/lib/vin";

const field =
  "h-12 min-w-0 flex-1 rounded-md bg-surface-2 px-4 text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle";

export function FinderBar() {
  const navigate = useNavigate();
  const q = useRouterState({
    select: (state) => {
      const search = state.location.search as { q?: unknown };
      return typeof search?.q === "string" ? search.q : "";
    },
  });
  const [text, setText] = useState(q);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setText(q), [q]);

  async function submit(raw: string) {
    const query = raw.trim();
    setError(null);
    if (!query) {
      await navigate({ to: "/vehicles", search: {} });
      return;
    }
    const vin = normalizeVin(query);
    const lotQuery = /^\d{6,12}$/.test(query);
    if (vin.length === 17 || lotQuery) {
      setBusy(true);
      try {
        const found = await lookupInventory({ data: { q: vin.length === 17 ? vin : query } });
        if (found.lot) {
          await navigate({ to: "/lot/$lot", params: { lot: String(found.lot) } });
          return;
        }
        if (vin.length === 17) {
          const resolved = await resolveVinToVehicle({ data: { vin } });
          await navigate({ to: "/vehicle/$id", params: { id: resolved.vehicle.id } });
          return;
        }
        setError("That lot is not on the current sale.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "No match for that VIN.");
      } finally {
        setBusy(false);
      }
      return;
    }
    await navigate({ to: "/vehicles", search: { q: query } });
  }

  return (
    <div className="border-b border-border bg-bg/95">
      <form
        className="mx-auto flex max-w-6xl gap-2 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="VIN, lot number, or vehicle"
          aria-label="VIN, lot number, or vehicle"
          spellCheck={false}
          className={field}
        />
        <button
          type="submit"
          disabled={busy}
          className="h-12 shrink-0 rounded-md bg-paper px-4 font-medium text-ink hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Searching" : "Search"}
        </button>
      </form>
      {error ? <p className="mx-auto max-w-6xl px-4 pb-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
