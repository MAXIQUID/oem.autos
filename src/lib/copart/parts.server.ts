import { browseCompatible } from "@/lib/ebay/client.server";
import type { EbayHit } from "@/lib/ebay/types";
import type { CopartLot, PartGroup, PartsReport } from "./types";

/** Query is year + make + model only. Trim and engine configuration stay off the search. */
const USED = "conditions:{USED}";
const ASPECT = "categoryId:6030,Performance Part:{No},Vintage Part:{No}";
const PAGE = 100;
const MAX_PAGES = 5;
const TTL_MS = 15 * 60 * 1000;

type Slot = { at: number; value: PartsReport };
const g = globalThis as typeof globalThis & { __copartParts?: Map<string, Slot> };

function median(values: number[]): number | null {
  if (!values.length) return null;
  const xs = [...values].sort((a, b) => a - b);
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid]! : Math.round((xs[mid - 1]! + xs[mid]!) / 2);
}

function band(items: EbayHit[]) {
  const prices = items.map((i) => i.priceCents).filter((n): n is number => n != null);
  return {
    low: prices.length ? Math.min(...prices) : null,
    high: prices.length ? Math.max(...prices) : null,
    median: median(prices),
  };
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function words(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function hasPhrase(title: string, phrase: string) {
  const full = norm(phrase);
  const n = norm(title);
  if (full.length >= 2 && n.includes(full)) return true;
  const parts = words(phrase).filter((w) => w.length > 2);
  return parts.length > 0 && parts.every((w) => n.includes(norm(w)));
}

/** Drop listings that do not name this make and model. Counts are never the raw API total. */
function namesVehicle(title: string, make: string, model: string) {
  return hasPhrase(title, make) && hasPhrase(title, model);
}

function enlarge(url: string | null) {
  return url ? url.replace(/s-l\d+/, "s-l500") : null;
}

function vehicleModel(lot: CopartLot) {
  const model = lot.model.trim();
  if (model && model.toLowerCase() !== "unknown") return model;
  return lot.group.trim();
}

function groupByCategory(items: EbayHit[]): PartGroup[] {
  const buckets = new Map<string, { label: string; items: EbayHit[] }>();
  for (const item of items) {
    const id = item.categoryId || "other";
    const name = item.categoryName?.trim();
    const slot = buckets.get(id) ?? { label: name || "Other", items: [] };
    if (slot.label === "Other" && name) slot.label = name;
    slot.items.push(item);
    buckets.set(id, slot);
  }

  return [...buckets.entries()]
    .map(([id, slot]) => ({
      id,
      label: slot.label,
      items: slot.items.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1)),
    }))
    .sort((a, b) => {
      if (a.id === "other") return 1;
      if (b.id === "other") return -1;
      return b.items.length - a.items.length || a.label.localeCompare(b.label);
    });
}

async function searchPage(query: string, offset: number) {
  const base = {
    q: query,
    category: "6030",
    limit: PAGE,
    offset,
    filter: USED,
    sort: "-price",
  };
  try {
    return await browseCompatible({ ...base, aspectFilter: ASPECT });
  } catch {
    return browseCompatible(base);
  }
}

export async function partsForVehicle(input: {
  year: number;
  make: string;
  model: string;
}): Promise<PartsReport> {
  const model = input.model.trim();
  const make = input.make.trim();
  const label = `${input.year} ${make} ${model}`.trim();
  const empty = (error: string | null): PartsReport => ({
    label,
    error,
    shown: 0,
    low: null,
    median: null,
    high: null,
    items: [],
    groups: [],
  });

  if (!model || model.toLowerCase() === "unknown" || !make) {
    return empty("This vehicle has no model to search.");
  }

  const key = `${input.year}|${make}|${model}|ymm-v8`;
  g.__copartParts ??= new Map();
  const cached = g.__copartParts.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  try {
    const query = label;
    const first = await searchPage(query, 0);
    const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(first.total / PAGE)));
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, index) =>
        searchPage(query, (index + 1) * PAGE).catch(() => ({ items: [] as EbayHit[], total: 0 })),
      ),
    );

    const seen = new Set<string>();
    const items = [first, ...rest]
      .flatMap((page) => page.items)
      .filter((item) => namesVehicle(item.title, make, model))
      .map((item) => ({ ...item, image: enlarge(item.image) }))
      .filter((item) => {
        if (seen.has(item.itemId)) return false;
        seen.add(item.itemId);
        return true;
      });

    const groups = groupByCategory(items);
    const value: PartsReport = {
      label,
      error: null,
      shown: items.length,
      ...band(items),
      items,
      groups,
    };
    g.__copartParts.set(key, { at: Date.now(), value });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : "eBay search failed";
    return empty(message);
  }
}

export async function partsForLot(lot: CopartLot): Promise<PartsReport> {
  const model = vehicleModel(lot);
  if (!model || model.toLowerCase() === "unknown") {
    return {
      label: `${lot.year} ${lot.make}`.trim(),
      error: "This lot has no model name to search.",
      shown: 0,
      low: null,
      median: null,
      high: null,
      items: [],
      groups: [],
    };
  }
  return partsForVehicle({ year: lot.year, make: lot.make, model });
}
