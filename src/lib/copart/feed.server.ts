import { createReadStream, existsSync, statSync } from "node:fs";
import { createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { CopartLot, SaleFacet, SalePage, SaleSort, VehicleFeed, VehicleSort } from "./types";
import { SALE_SORTS, VEHICLE_SORTS } from "./types";
import { facetKeys, type FacetDim } from "./facets";
import { env } from "@/lib/env.server";

const FILE = "/tmp/copart-sales.csv";
const FILE_TTL_MS = 20 * 60 * 1000;
const PAGE = 24;

const MAKE_DISPLAY: Record<string, string> = {
  "MERCEDES-BENZ": "Mercedes-Benz",
  "LAND ROVER": "Land Rover",
  "ALFA ROMEO": "Alfa Romeo",
  "ASTON MARTIN": "Aston Martin",
  "ROLLS-ROYCE": "Rolls-Royce",
  MINI: "MINI",
  BMW: "BMW",
  GMC: "GMC",
  RAM: "Ram",
  INFINITI: "Infiniti",
  VOLKSWAGEN: "Volkswagen",
};

type Feed = {
  at: number;
  updated: string;
  vehicles: CopartLot[];
  byLot: Map<number, CopartLot>;
  byVin: Map<string, CopartLot>;
};

const g = globalThis as typeof globalThis & {
  __copartFeed?: Feed;
  __copartPending?: Promise<Feed>;
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bOf\b/g, "of");
}

function displayMake(raw: string): string {
  const key = raw.trim().toUpperCase();
  return MAKE_DISPLAY[key] ?? titleCase(key);
}

function displayModel(raw: string): string {
  const t = raw.trim();
  if (!t || t.toUpperCase() === "UNKNOWN") return "";
  if (/^\d/.test(t) || t.length <= 4) return t.toUpperCase() === t ? titleCase(t) : t;
  return titleCase(t);
}

function money(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function saleFields(raw: string): { saleDate: string; saleOrd: number } {
  if (!/^\d{8}$/.test(raw) || raw === "00000000") return { saleDate: "Unscheduled", saleOrd: 0 };
  const y = Number(raw.slice(0, 4));
  const m = Number(raw.slice(4, 6));
  const d = Number(raw.slice(6, 8));
  if (!y || !m || !d) return { saleDate: "Unscheduled", saleOrd: 0 };
  const saleDate = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  return { saleDate, saleOrd: y * 10000 + m * 100 + d };
}

function photoUrl(raw: string): { thumb: string; photo: string } {
  let url = raw.trim();
  if (!url) return { thumb: "", photo: "" };
  if (url.startsWith("//")) url = `https:${url}`;
  else if (!url.startsWith("http")) url = `https://${url}`;
  return { thumb: url, photo: url.replace("_thb.", "_ful.") };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

async function ensureFile(): Promise<void> {
  const feedUrl = env("COPART_FEED_URL");
  if (!feedUrl) throw new Error("Copart feed is not configured.");
  if (existsSync(FILE) && Date.now() - statSync(FILE).mtimeMs < FILE_TTL_MS) return;
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "OEM.autos/1.0" },
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok || !res.body) throw new Error(`Sale sheet failed (${res.status})`);
  const tmp = `${FILE}.part`;
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), createWriteStream(tmp));
  const { renameSync } = await import("node:fs");
  renameSync(tmp, FILE);
}

async function parseFile(): Promise<Feed> {
  await ensureFile();
  const vehicles: CopartLot[] = [];
  const byLot = new Map<number, CopartLot>();
  const byVin = new Map<string, CopartLot>();
  const rl = createInterface({ input: createReadStream(FILE), crlfDelay: Infinity });
  let header: string[] | null = null;
  const col = (name: string) => header!.indexOf(name);

  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line).map((h) => h.trim());
      continue;
    }
    if (!line) continue;
    const row = parseCsvLine(line);
    if (row[col("Vehicle Type")] !== "V") continue;
    const year = Number(row[col("Year")]);
    const makeRaw = row[col("Make")]?.trim() ?? "";
    if (!year || year < 1985 || !makeRaw) continue;
    const lot = Number(row[col("Lot number")]);
    if (!lot) continue;
    const make = displayMake(makeRaw);
    const model = displayModel(row[col("Model Detail")] ?? "") || displayModel(row[col("Model Group")] ?? "");
    const group = displayModel(row[col("Model Group")] ?? "");
    const { thumb, photo } = photoUrl(row[col("Image Thumbnail")] ?? "");
    const sale = saleFields(row[col("Sale Date M/D/CY")] ?? "");
    const lotRec: CopartLot = {
      lot,
      year,
      make,
      model: model || group || "Unknown",
      group: group || model || "",
      trim: (row[col("Trim")] ?? "").trim(),
      body: titleCase((row[col("Body Style")] ?? "").trim()),
      color: titleCase((row[col("Color")] ?? "").trim()),
      damage: titleCase((row[col("Damage Description")] ?? "").trim()),
      secondary: titleCase((row[col("Secondary Damage")] ?? "").trim()),
      vin: (row[col("VIN")] ?? "").trim().toUpperCase(),
      miles: Math.max(0, Math.round(Number(row[col("Odometer")]) || 0)),
      keys: (row[col("Has Keys-Yes or No")] ?? "").trim(),
      runs: (row[col("Runs/Drives")] ?? "").trim(),
      title: (row[col("Sale Title Type")] ?? "").trim(),
      yard: (row[col("Yard name")] ?? "").trim(),
      city: titleCase((row[col("Location city")] ?? "").trim()),
      state: (row[col("Location state")] ?? "").trim().toUpperCase(),
      saleDate: sale.saleDate,
      saleOrd: sale.saleOrd,
      bidCents: money(row[col("High Bid =non-vix,Sealed=Vix")] ?? ""),
      binCents: money(row[col("Buy-It-Now Price")] ?? ""),
      retailCents: money(row[col("Est. Retail Value")] ?? ""),
      repairCents: money(row[col("Repair cost")] ?? ""),
      engine: (row[col("Engine")] ?? "").trim(),
      drive: titleCase((row[col("Drive")] ?? "").trim()),
      trans: titleCase((row[col("Transmission")] ?? "").trim()),
      fuel: titleCase((row[col("Fuel Type")] ?? "").trim()),
      thumb,
      photo,
    };
    vehicles.push(lotRec);
    byLot.set(lot, lotRec);
    if (lotRec.vin.length === 17 && !byVin.has(lotRec.vin)) byVin.set(lotRec.vin, lotRec);
  }

  vehicles.sort((a, b) => (a.saleOrd || 99999999) - (b.saleOrd || 99999999) || a.lot - b.lot);

  return {
    at: Date.now(),
    updated: new Date().toISOString(),
    vehicles,
    byLot,
    byVin,
  };
}

export async function ensureFeed(): Promise<Feed> {
  if (g.__copartFeed?.byVin && Date.now() - g.__copartFeed.at < FILE_TTL_MS) return g.__copartFeed;
  if (!g.__copartPending) {
    g.__copartPending = parseFile()
      .then((feed) => {
        g.__copartFeed = feed;
        return feed;
      })
      .finally(() => {
        g.__copartPending = undefined;
      });
  }
  return g.__copartPending;
}

const SORTS = new Set<string>(SALE_SORTS);
const VEHICLE_SORT_SET = new Set<string>(VEHICLE_SORTS);
const FEED_PAGE = 24;

const FACET_CAP: Record<FacetDim, number> = {
  year: 50,
  make: 160,
  model: 40,
  body: 16,
  engine: 16,
  drive: 8,
  trans: 6,
};

type IndexedRow = {
  lot: CopartLot;
  id: Record<FacetDim, string>;
  label: Record<FacetDim, string>;
};

const rowCache = new WeakMap<Feed, IndexedRow[]>();

function indexedRows(feed: Feed): IndexedRow[] {
  const hit = rowCache.get(feed);
  if (hit) return hit;
  const rows = feed.vehicles.map((lot) => {
    const keys = facetKeys(lot);
    const id = {} as Record<FacetDim, string>;
    const label = {} as Record<FacetDim, string>;
    for (const dim of Object.keys(keys) as FacetDim[]) {
      id[dim] = keys[dim].id;
      label[dim] = keys[dim].label;
    }
    return { lot, id, label };
  });
  rowCache.set(feed, rows);
  return rows;
}

function packFacet(
  map: Map<string, { label: string; count: number }>,
  selected: string,
  dim: FacetDim,
): SaleFacet[] {
  let rows = [...map.entries()].filter(([, value]) => value.count > 0 && value.label);
  rows.sort(
    dim === "year"
      ? (a, b) => Number(b[0]) - Number(a[0])
      : (a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label),
  );
  const cap = FACET_CAP[dim];
  let sliced = rows.slice(0, cap);
  if (selected && !sliced.some(([id]) => id === selected)) {
    const found = rows.find(([id]) => id === selected);
    sliced = [found ?? [selected, { label: selected, count: 0 }], ...sliced.slice(0, cap - 1)];
  }
  return sliced.map(([id, value]) => ({ id, label: value.label, count: value.count }));
}

function compareVehicles(sort: VehicleSort) {
  return (a: CopartLot, b: CopartLot) => {
    switch (sort) {
      case "year":
        return b.year - a.year || a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.lot - b.lot;
      case "year-asc":
        return a.year - b.year || a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || a.lot - b.lot;
      case "name":
        return a.make.localeCompare(b.make) || a.model.localeCompare(b.model) || b.year - a.year || a.lot - b.lot;
      case "vin":
        return (a.vin || "\uffff").localeCompare(b.vin || "\uffff") || a.lot - b.lot;
      default:
        return b.lot - a.lot;
    }
  };
}

export async function searchVehicles(input: {
  q?: string;
  year?: number;
  make?: string;
  model?: string;
  body?: string;
  engine?: string;
  drivetrain?: string;
  transmission?: string;
  sort?: string;
  page?: number;
}): Promise<VehicleFeed> {
  const feed = await ensureFeed();
  const rows = indexedRows(feed);
  const q = (input.q ?? "").trim().toLowerCase();
  const selected: Record<FacetDim, string> = {
    year: input.year ? String(input.year) : "",
    make: (input.make ?? "").trim().toLowerCase(),
    model: (input.model ?? "").trim().toLowerCase(),
    body: (input.body ?? "").trim().toLowerCase(),
    engine: (input.engine ?? "").trim().toLowerCase(),
    drive: (input.drivetrain ?? "").trim().toLowerCase(),
    trans: (input.transmission ?? "").trim().toLowerCase(),
  };
  const sort: VehicleSort =
    input.sort && VEHICLE_SORT_SET.has(input.sort) ? (input.sort as VehicleSort) : "recent";

  const dims: FacetDim[] = ["year", "make", "model", "body", "engine", "drive", "trans"];
  const buckets = Object.fromEntries(dims.map((dim) => [dim, new Map<string, { label: string; count: number }>()])) as Record<
    FacetDim,
    Map<string, { label: string; count: number }>
  >;
  const matched: IndexedRow[] = [];

  for (const row of rows) {
    if (q && !matchesQuery(row.lot, q)) continue;
    let misses = 0;
    let missed: FacetDim | null = null;
    for (const dim of dims) {
      const want = selected[dim];
      if (want && row.id[dim] !== want) {
        misses += 1;
        missed = dim;
        if (misses > 1) break;
      }
    }
    if (misses > 1) continue;
    if (misses === 0) matched.push(row);
    const bump = misses === 0 ? dims : [missed!];
    for (const dim of bump) {
      const id = row.id[dim];
      if (!id) continue;
      const slot = buckets[dim].get(id) ?? { label: row.label[dim], count: 0 };
      slot.count += 1;
      buckets[dim].set(id, slot);
    }
  }

  matched.sort((a, b) => compareVehicles(sort)(a.lot, b.lot));
  const pages = Math.max(1, Math.ceil(matched.length / FEED_PAGE));
  const page = Math.min(Math.max(input.page ?? 1, 1), pages);
  const start = (page - 1) * FEED_PAGE;

  return {
    total: matched.length,
    indexed: feed.vehicles.length,
    page,
    pages,
    nextCursor: page < pages ? String(page + 1) : null,
    sort,
    results: matched.slice(start, start + FEED_PAGE).map((row) => ({
      ...row.lot,
      model: row.label.model || row.lot.model,
      body: row.label.body || row.lot.body,
      engine: row.label.engine || row.lot.engine,
      drive: row.label.drive || row.lot.drive,
      trans: row.label.trans || row.lot.trans,
    })),
    facets: {
      year: packFacet(buckets.year, selected.year, "year"),
      make: packFacet(buckets.make, selected.make, "make"),
      model: packFacet(buckets.model, selected.model, "model"),
      body: packFacet(buckets.body, selected.body, "body"),
      engine: packFacet(buckets.engine, selected.engine, "engine"),
      drivetrain: packFacet(buckets.drive, selected.drive, "drive"),
      transmission: packFacet(buckets.trans, selected.trans, "trans"),
    },
    query: {
      q,
      year: selected.year,
      make: selected.make,
      model: selected.model,
      body: selected.body,
      engine: selected.engine,
      drivetrain: selected.drive,
      transmission: selected.trans,
      sort,
      page,
    },
  };
}

function saleLabel(ord: number): string {
  if (!ord) return "Unscheduled";
  const y = Math.floor(ord / 10000);
  const m = Math.floor((ord % 10000) / 100) - 1;
  const d = ord % 100;
  return new Date(Date.UTC(y, m, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function priceOf(lot: CopartLot): number | null {
  return lot.bidCents ?? lot.binCents;
}

function compareSale(sort: SaleSort) {
  return (a: CopartLot, b: CopartLot) => {
    switch (sort) {
      case "bid":
      case "bid-asc": {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa == null && pb == null) return a.lot - b.lot;
        if (pa == null) return 1;
        if (pb == null) return -1;
        return sort === "bid" ? pb - pa || a.lot - b.lot : pa - pb || a.lot - b.lot;
      }
      case "year":
        return b.year - a.year || a.lot - b.lot;
      case "year-asc":
        return a.year - b.year || a.lot - b.lot;
      case "miles": {
        const ma = a.miles || Number.POSITIVE_INFINITY;
        const mb = b.miles || Number.POSITIVE_INFINITY;
        return ma - mb || a.lot - b.lot;
      }
      default:
        return (a.saleOrd || 99_999_999) - (b.saleOrd || 99_999_999) || a.lot - b.lot;
    }
  };
}

function matchesQuery(lot: CopartLot, q: string) {
  if (/^\d{5,}$/.test(q) && String(lot.lot) === q) return true;
  const hay =
    `${lot.year} ${lot.make} ${lot.model} ${lot.group} ${lot.vin} ${lot.lot} ${lot.yard} ${lot.city} ${lot.state}`.toLowerCase();
  return hay.includes(q);
}

function facetList(entries: [string, number][], alpha = false): SaleFacet[] {
  const sorted = alpha
    ? entries.sort((a, b) => a[0].localeCompare(b[0]))
    : entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted.map(([id, count]) => ({ id, label: id, count }));
}

export async function querySale(input: {
  q?: string;
  make?: string;
  state?: string;
  sale?: number;
  sort?: string;
  runs?: boolean;
  page?: number;
}): Promise<SalePage> {
  const feed = await ensureFeed();
  const q = (input.q ?? "").trim().toLowerCase();
  const make = (input.make ?? "").trim().toLowerCase();
  const state = (input.state ?? "").trim().toUpperCase();
  const sale = input.sale != null && Number.isFinite(input.sale) ? input.sale : null;
  const runs = Boolean(input.runs);
  const sort: SaleSort = input.sort && SORTS.has(input.sort) ? (input.sort as SaleSort) : "sale";

  const makeCount = new Map<string, number>();
  const stateCount = new Map<string, number>();
  const dateCount = new Map<number, number>();
  const filtered: CopartLot[] = [];

  for (const lot of feed.vehicles) {
    if (q && !matchesQuery(lot, q)) continue;
    const makeOk = !make || lot.make.toLowerCase() === make;
    const stateOk = !state || lot.state === state;
    const saleOk = sale == null || lot.saleOrd === sale;
    if (stateOk && saleOk) makeCount.set(lot.make, (makeCount.get(lot.make) ?? 0) + 1);
    if (makeOk && saleOk && lot.state) stateCount.set(lot.state, (stateCount.get(lot.state) ?? 0) + 1);
    if (makeOk && stateOk) dateCount.set(lot.saleOrd, (dateCount.get(lot.saleOrd) ?? 0) + 1);
    if (!makeOk || !stateOk || !saleOk) continue;
    if (runs && !lot.runs.toLowerCase().includes("run")) continue;
    filtered.push(lot);
  }

  filtered.sort(compareSale(sort));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const page = Math.min(Math.max(input.page ?? 1, 1), pages);
  const start = (page - 1) * PAGE;
  const dates = [...dateCount.entries()]
    .sort((a, b) => (a[0] || 99_999_999) - (b[0] || 99_999_999))
    .map(([ord, count]) => ({ id: String(ord), label: saleLabel(ord), count }));

  return {
    total: filtered.length,
    page,
    pages,
    sheetCount: feed.vehicles.length,
    updated: feed.updated,
    vehicles: filtered.slice(start, start + PAGE),
    makes: facetList([...makeCount.entries()]),
    states: facetList([...stateCount.entries()], true),
    dates,
  };
}

export async function findInventory(q: string): Promise<CopartLot | null> {
  const feed = await ensureFeed();
  const clean = q.trim().toUpperCase();
  if (/^\d{6,12}$/.test(clean)) return feed.byLot.get(Number(clean)) ?? null;
  const vin = clean.replace(/[^A-HJ-NPR-Z0-9]/g, "");
  if (vin.length === 17) return feed.byVin.get(vin) ?? null;
  return null;
}

export async function getLot(lot: number): Promise<CopartLot | null> {
  const feed = await ensureFeed();
  return feed.byLot.get(lot) ?? null;
}

export async function getByVin(vin: string): Promise<CopartLot | null> {
  const clean = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  if (clean.length !== 17) return null;
  const feed = await ensureFeed();
  return feed.byVin.get(clean) ?? null;
}

const SITEMAP_SIZE = 10_000;

export async function vinSitemap(page: number): Promise<{ vins: string[]; pages: number; updated: string } | null> {
  const feed = await ensureFeed();
  const pages = Math.max(1, Math.ceil(feed.byVin.size / SITEMAP_SIZE));
  if (!Number.isInteger(page) || page < 1 || page > pages) return null;
  const start = (page - 1) * SITEMAP_SIZE;
  const end = start + SITEMAP_SIZE;
  const vins: string[] = [];
  let i = 0;
  for (const vin of feed.byVin.keys()) {
    if (i >= end) break;
    if (i >= start) vins.push(vin);
    i += 1;
  }
  return { vins, pages, updated: feed.updated };
}
