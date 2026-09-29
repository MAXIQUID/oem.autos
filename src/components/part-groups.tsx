import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { EbayHit } from "@/lib/ebay/types";
import { sellSimilarUrl } from "@/lib/ebay/sell";
import type { PartsReport } from "@/lib/copart/types";
import { formatUsd } from "@/lib/utils";
const FILLER = new Set([
  "a",
  "an",
  "and",
  "for",
  "fit",
  "fits",
  "the",
  "with",
  "oem",
  "genuine",
  "used",
  "new",
  "part",
  "parts",
  "assembly",
  "assy",
  "replacement",
]);

/** Same part, different sellers or word order, becomes one key. */
function partKey(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !FILLER.has(word) && !/^(19|20)\d{2}$/.test(word));
  words.sort();
  return words.join(" ");
}

function cheaper(next: EbayHit, current: EbayHit): boolean {
  return (next.priceCents ?? Number.POSITIVE_INFINITY) < (current.priceCents ?? Number.POSITIVE_INFINITY);
}

function dedupe(items: EbayHit[]): { item: EbayHit; extra: number }[] {
  const map = new Map<string, { item: EbayHit; extra: number }>();
  for (const item of items) {
    const key = partKey(item.title) || item.itemId;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { item, extra: 0 });
      continue;
    }
    prev.extra += 1;
    if (cheaper(item, prev.item)) prev.item = item;
  }
  return [...map.values()];
}

export function PartsBoard({ report }: { report: PartsReport }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const filtered = needle
      ? report.groups
          .map((group) => {
            if (group.label.toLowerCase().includes(needle)) return group;
            return {
              ...group,
              items: group.items.filter((item) => item.title.toLowerCase().includes(needle)),
            };
          })
          .filter((group) => group.items.length > 0)
      : report.groups;
    return filtered
      .map((group) => ({ ...group, rows: dedupe(group.items) }))
      .filter((group) => group.rows.length > 0);
  }, [needle, report.groups]);
  const shown = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const matched = groups.reduce((sum, group) => sum + group.rows.reduce((n, row) => n + 1 + row.extra, 0), 0);

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
      <label className="mt-6 block">
        <span className="sr-only">Filter parts</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter parts, like headlight or transmission"
          className="h-12 w-full rounded-md bg-surface-2 px-4 text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </label>
      {needle ? (
        <p className="mt-2 text-sm text-muted">
          {shown} parts from {matched} listings match “{query.trim()}”
        </p>
      ) : shown < report.shown ? (
        <p className="mt-2 text-sm text-muted">
          {shown} parts. {report.shown - shown} repeat listings are folded in.
        </p>
      ) : null}
      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-subtle">No part title matches that.</p>
      ) : (
        groups.map((group) => (
          <section key={group.id} className="mt-8 min-w-0">
            <h3 className="font-display text-2xl font-semibold tracking-tight">
              {group.label}
              <span className="ml-2 text-muted">({group.rows.length})</span>
            </h3>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {group.rows.map((row) => (
                <PartRow key={row.item.itemId} item={row.item} extra={row.extra} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}

function PartRow({ item, extra }: { item: EbayHit; extra: number }) {
  return (
    <li className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <Link
        to="/market/$itemId"
        params={{ itemId: item.itemId }}
        className="flex min-w-0 flex-1 gap-3"
      >
        <span className="size-20 shrink-0 overflow-hidden rounded-md bg-surface-2">
          {item.image ? (
            <img src={item.image} alt="" className="media size-full object-cover" />
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 font-medium leading-snug">{item.title}</span>
          <span className="mt-1 block text-sm text-muted">
            {formatUsd(item.priceCents)}
            {item.condition ? ` · ${item.condition}` : ""}
            {item.location ? ` · ${item.location}` : ""}
            {extra > 0 ? ` · ${extra} more like this` : ""}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 flex-col gap-2">
        <Button asChild size="sm">
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.buyNow ? "Buy now" : "View listing"}
          </a>
        </Button>
        {item.sellItemId ? (
          <Button asChild size="sm" variant="secondary">
            <a href={sellSimilarUrl(item.sellItemId)} target="_blank" rel="noreferrer">
              Sell similar
            </a>
          </Button>
        ) : null}
      </div>
    </li>
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
