import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { VehicleLink } from "@/components/vehicle-link";
import type { SaleFacet, VehicleFeed, VehicleSort } from "@/lib/copart/types";
import { formatUsd, formatVin } from "@/lib/utils";

export type VehicleSearch = {
  q?: string;
  year?: number;
  make?: string;
  model?: string;
  body?: string;
  engine?: string;
  drivetrain?: string;
  transmission?: string;
  sort?: VehicleSort;
  page?: number;
};

const SORTS: { id: VehicleSort; label: string }[] = [
  { id: "recent", label: "Recently added" },
  { id: "year", label: "Newest year" },
  { id: "year-asc", label: "Oldest year" },
  { id: "name", label: "Make / model" },
  { id: "vin", label: "VIN" },
];

const FACETS: { key: keyof VehicleSearch; title: string; facet: keyof VehicleFeed["facets"] }[] = [
  { key: "year", title: "Year", facet: "year" },
  { key: "make", title: "Make", facet: "make" },
  { key: "model", title: "Model", facet: "model" },
  { key: "body", title: "Body", facet: "body" },
  { key: "engine", title: "Engine", facet: "engine" },
  { key: "drivetrain", title: "Drivetrain", facet: "drivetrain" },
  { key: "transmission", title: "Transmission", facet: "transmission" },
];

function currentSearch(feed: VehicleFeed): VehicleSearch {
  const q = feed.query;
  return {
    q: q.q || undefined,
    year: q.year ? Number(q.year) : undefined,
    make: q.make || undefined,
    model: q.model || undefined,
    body: q.body || undefined,
    engine: q.engine || undefined,
    drivetrain: q.drivetrain || undefined,
    transmission: q.transmission || undefined,
    sort: q.sort === "recent" ? undefined : q.sort,
    page: q.page > 1 ? q.page : undefined,
  };
}

function facetLabel(facets: SaleFacet[], id: string) {
  return facets.find((facet) => facet.id === id)?.label ?? id;
}

export function VehicleFeedView({ feed }: { feed: VehicleFeed }) {
  const navigate = useNavigate();
  const loading = useRouterState({ select: (state) => state.isLoading });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const search = currentSearch(feed);
  const query = feed.query;
  const narrowed = Boolean(
    query.q || query.year || query.make || query.model || query.body || query.engine || query.drivetrain || query.transmission,
  );

  const chips: { key: "q" | "year" | "make" | "model" | "body" | "engine" | "drivetrain" | "transmission"; label: string }[] = [];
  if (query.year) chips.push({ key: "year", label: facetLabel(feed.facets.year, query.year) });
  if (query.make) chips.push({ key: "make", label: facetLabel(feed.facets.make, query.make) });
  if (query.model) chips.push({ key: "model", label: facetLabel(feed.facets.model, query.model) });
  if (query.body) chips.push({ key: "body", label: facetLabel(feed.facets.body, query.body) });
  if (query.engine) chips.push({ key: "engine", label: facetLabel(feed.facets.engine, query.engine) });
  if (query.drivetrain) chips.push({ key: "drivetrain", label: facetLabel(feed.facets.drivetrain, query.drivetrain) });
  if (query.transmission) chips.push({ key: "transmission", label: facetLabel(feed.facets.transmission, query.transmission) });
  if (query.q) chips.push({ key: "q", label: query.q });

  const identity = [chips.find((c) => c.key === "year")?.label, chips.find((c) => c.key === "make")?.label, chips.find((c) => c.key === "model")?.label]
    .filter(Boolean)
    .join(" ");
  const detail = chips
    .filter((chip) => chip.key === "body" || chip.key === "engine" || chip.key === "drivetrain" || chip.key === "transmission")
    .map((chip) => chip.label)
    .join(" · ");
  const headline = identity || detail || (query.q ? query.q : "Vehicles");

  function go(patch: Partial<VehicleSearch>) {
    const next: VehicleSearch = { ...search, ...patch };
    if (!("page" in patch)) next.page = undefined;
    if (next.sort === "recent") next.sort = undefined;
    void navigate({ to: "/vehicles", search: next });
  }

  function pick(key: keyof VehicleSearch, value: string) {
    if (key === "year") go({ year: value ? Number(value) : undefined });
    else if (key === "make") go({ make: value || undefined });
    else if (key === "model") go({ model: value || undefined });
    else if (key === "body") go({ body: value || undefined });
    else if (key === "engine") go({ engine: value || undefined });
    else if (key === "drivetrain") go({ drivetrain: value || undefined });
    else if (key === "transmission") go({ transmission: value || undefined });
    else if (key === "q") go({ q: value || undefined });
  }

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">{headline}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="tabular-nums">{feed.total.toLocaleString("en-US")}</span>
            {narrowed ? " matching vehicles" : " vehicles indexed"}
            {identity && detail ? ` · ${detail}` : ""}
          </p>
        </div>
      </div>

      {chips.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => pick(chip.key, "")}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-paper px-3 text-sm font-medium text-ink"
            >
              {chip.label}
              <X className="size-3.5" aria-hidden />
              <span className="sr-only">Remove {chip.label}</span>
            </button>
          ))}
          <button type="button" onClick={() => void navigate({ to: "/vehicles", search: {} })} className="h-9 px-2 text-sm text-muted hover:text-fg">
            Clear all
          </button>
        </div>
      ) : (
        <p className="mt-3 max-w-xl text-sm text-subtle">Search a VIN above, or narrow the index by year, make, and model.</p>
      )}

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-chrome max-h-dvh overflow-y-auto pb-10">
            <FacetColumn feed={feed} search={search} onPick={pick} compact />
          </div>
        </aside>

        <section className={loading ? "min-w-0 opacity-60" : "min-w-0"} aria-busy={loading}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-surface-2 text-sm font-medium text-fg shadow-[var(--shadow-border)] lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
              {chips.length ? <span className="tabular-nums text-muted">{chips.length}</span> : null}
            </button>
            <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md bg-surface-2 px-3 text-sm shadow-[var(--shadow-border)] lg:ml-auto lg:max-w-xs lg:flex-none">
              <span className="shrink-0 text-subtle">Sort</span>
              <select
                className="h-full min-w-0 flex-1 bg-transparent text-fg outline-none"
                value={feed.sort}
                onChange={(event) => go({ sort: event.target.value as VehicleSort })}
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {feed.results.length === 0 ? (
            <div className="mt-8 rounded-xl bg-surface px-5 py-8 shadow-[var(--shadow-border)]">
              <p className="font-display text-2xl font-semibold">Nothing matches</p>
              <p className="mt-2 text-sm text-muted">Clear a filter or search a VIN. The index only lists vehicles on the current sale sheet.</p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/vehicles", search: {} })}
                className="mt-4 inline-flex h-11 items-center rounded-md bg-paper px-4 text-sm font-medium text-ink"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {feed.results.map((lot) => (
                <li key={lot.lot}>
                  <VehicleRow lot={lot} />
                </li>
              ))}
            </ul>
          )}

          {feed.pages > 1 ? (
            <nav className="mt-6 flex items-center justify-between gap-3 text-sm">
              {feed.page > 1 ? (
                <Link
                  to="/vehicles"
                  search={{ ...search, page: feed.page - 1 > 1 ? feed.page - 1 : undefined }}
                  className="inline-flex h-11 items-center rounded-md bg-surface-2 px-4 text-fg shadow-[var(--shadow-border)] hover:text-paper"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted tabular-nums">
                {feed.page} / {feed.pages.toLocaleString("en-US")}
              </span>
              {feed.nextCursor ? (
                <Link
                  to="/vehicles"
                  search={{ ...search, page: feed.page + 1 }}
                  className="inline-flex h-11 items-center rounded-md bg-surface-2 px-4 text-fg shadow-[var(--shadow-border)] hover:text-paper"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-bg lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-2xl font-semibold">Filters</h2>
            <button type="button" className="inline-flex size-11 items-center justify-center text-muted hover:text-fg" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28">
            <FacetColumn feed={feed} search={search} onPick={pick} />
          </div>
          <div className="border-t border-border bg-bg px-4 py-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-12 w-full rounded-md bg-paper font-medium text-ink"
            >
              Show {feed.total.toLocaleString("en-US")} vehicles
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function FacetColumn({
  feed,
  search,
  onPick,
  compact = false,
}: {
  feed: VehicleFeed;
  search: VehicleSearch;
  onPick: (key: keyof VehicleSearch, value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-6">
      {FACETS.map((facet) => {
        const options = feed.facets[facet.facet];
        if (!options.length) return null;
        const selected = search[facet.key];
        const selectedId = selected == null ? "" : String(selected);
        return (
          <div key={facet.key}>
            <h2 className="text-xs uppercase tracking-widest text-subtle">{facet.title}</h2>
            <ul className={compact ? "mt-2 max-h-56 overflow-y-auto" : "mt-2"}>
              {options.map((option) => {
                const on = option.id === selectedId;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => onPick(facet.key, on ? "" : option.id)}
                      className={
                        on
                          ? "flex min-h-11 w-full items-center justify-between gap-3 rounded-md bg-paper px-3 text-left text-sm font-medium text-ink"
                          : "flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm text-fg hover:bg-surface-2"
                      }
                    >
                      <span className="truncate">{option.label}</span>
                      <span className={on ? "shrink-0 font-mono text-xs tabular-nums text-ink/70" : "shrink-0 font-mono text-xs tabular-nums text-subtle"}>
                        {option.count.toLocaleString("en-US")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function VehicleRow({ lot }: { lot: VehicleFeed["results"][number] }) {
  const spec = [lot.drive, lot.engine, lot.trans].filter(Boolean).join(" · ");
  const place = [lot.damage, lot.city && lot.state ? `${lot.city}, ${lot.state}` : lot.state].filter(Boolean).join(" · ");
  const price = lot.bidCents ?? lot.binCents;
  const priceLabel = lot.bidCents ? "High bid" : lot.binCents ? "Buy now" : "";
  return (
    <VehicleLink lot={lot.lot} vin={lot.vin} className="flex gap-3 p-3 hover:bg-surface-2 sm:gap-4 sm:p-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:size-28">
        {lot.thumb ? (
          <img src={lot.thumb} alt="" loading="lazy" className="media h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-end p-2 font-mono text-xs text-subtle">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-2xl font-semibold leading-tight tracking-tight">
          {lot.year} {lot.make} {lot.model}
        </h3>
        <p className="mt-1 truncate font-mono text-xs tracking-wide text-muted">{lot.vin ? formatVin(lot.vin) : "VIN unlisted"}</p>
        {price ? <p className="mt-1 font-mono text-sm tabular-nums text-fg sm:hidden">{formatUsd(price)}</p> : null}
        {spec ? <p className="mt-1 truncate text-sm text-fg">{spec}</p> : null}
        {place ? <p className="mt-1 truncate text-sm text-subtle">{place}</p> : null}
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="font-mono text-sm tabular-nums text-fg">{price ? formatUsd(price) : "—"}</p>
        {priceLabel ? <p className="mt-1 text-xs text-subtle">{priceLabel}</p> : null}
      </div>
    </VehicleLink>
  );
}
