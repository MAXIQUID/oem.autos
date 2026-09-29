import { getSql } from "@/lib/db";
import type { ConfigChoice, IdentityVehicle, VinResolution } from "./types";
import {
  decodeNhtsa,
  epaMakes,
  epaModels,
  epaOptions,
  epaVehicleXml,
  epaYears,
  type NhtsaDecode,
  xmlTag,
} from "./upstream.server";

const MENU_TTL_MS = 24 * 60 * 60 * 1000;
const VEHICLE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const inflight = new Map<string, Promise<unknown>>();

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function inductionFrom(text: string | null): string | null {
  if (!text) return null;
  if (/turbo/i.test(text)) return "Turbo";
  if (/supercharg/i.test(text)) return "Supercharged";
  return null;
}

function num(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type VehicleRow = {
  id: string;
  year: number;
  make: string;
  model: string;
  generation: string | null;
  configuration: string;
  displacement_l: string | number | null;
  cylinders: number | null;
  fuel: string | null;
  induction: string | null;
  transmission: string | null;
  drive: string | null;
  body: string | null;
  source: string;
  source_id: string;
};

function toVehicle(row: VehicleRow): IdentityVehicle {
  const displacement = num(row.displacement_l == null ? null : String(row.displacement_l));
  return {
    id: row.id,
    year: Number(row.year),
    make: row.make,
    model: row.model,
    generation: row.generation,
    configuration: row.configuration,
    engine: {
      displacement_l: displacement,
      cylinders: row.cylinders == null ? null : Number(row.cylinders),
      fuel: row.fuel,
      induction: row.induction,
    },
    transmission: row.transmission,
    drive: row.drive,
    body: row.body,
    source: row.source,
    source_id: row.source_id,
  };
}

async function readCache(key: string): Promise<{ payload: string; at: number } | null> {
  const sql = await getSql();
  const rows = await sql.query<{ payload: string; fetched_at: string }>(
    "select payload, fetched_at from identity_menus where cache_key = $1",
    [key],
  );
  const row = rows[0];
  if (!row) return null;
  return { payload: row.payload, at: new Date(row.fetched_at).getTime() };
}

async function writeCache(key: string, payload: unknown) {
  const sql = await getSql();
  await sql.query(
    `insert into identity_menus (cache_key, payload, fetched_at)
     values ($1, $2, now())
     on conflict (cache_key) do update set payload = excluded.payload, fetched_at = now()`,
    [key, JSON.stringify(payload)],
  );
}

async function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const pending = load().finally(() => inflight.delete(key));
  inflight.set(key, pending);
  return pending;
}

async function cachedJson<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = await readCache(key);
  if (hit && Date.now() - hit.at < MENU_TTL_MS) return JSON.parse(hit.payload) as T;
  return once(`menu:${key}`, async () => {
    try {
      const fresh = await load();
      await writeCache(key, fresh);
      return fresh;
    } catch (err) {
      if (hit) return JSON.parse(hit.payload) as T;
      throw err;
    }
  });
}

export function listYears(): Promise<number[]> {
  return cachedJson("years", async () => {
    const items = await epaYears();
    return items.map((item) => Number(item.value)).filter((year) => Number.isFinite(year));
  });
}

export function listMakes(year: number): Promise<string[]> {
  return cachedJson(`makes:${year}`, async () => (await epaMakes(year)).map((item) => item.text));
}

export function listModels(year: number, make: string): Promise<string[]> {
  return cachedJson(`models:${year}:${make.toLowerCase()}`, async () =>
    (await epaModels(year, make)).map((item) => item.text),
  );
}

export function listConfigurations(year: number, make: string, model: string): Promise<ConfigChoice[]> {
  return cachedJson(`configs:${year}:${make.toLowerCase()}:${model.toLowerCase()}`, async () => {
    const items = await epaOptions(year, make, model);
    return items.map((item) => ({ id: `epa-${item.value}`, label: item.text }));
  });
}

async function readVehicle(id: string): Promise<{ vehicle: IdentityVehicle; at: number } | null> {
  const sql = await getSql();
  const rows = await sql.query<VehicleRow & { fetched_at: string }>(
    "select * from identity_vehicles where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return { vehicle: toVehicle(row), at: new Date(row.fetched_at).getTime() };
}

async function saveVehicle(vehicle: IdentityVehicle) {
  const sql = await getSql();
  await sql.query(
    `insert into identity_vehicles (
       id, year, make, model, generation, configuration,
       displacement_l, cylinders, fuel, induction, transmission, drive, body,
       source, source_id, fetched_at
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now()
     )
     on conflict (id) do update set
       year = excluded.year,
       make = excluded.make,
       model = excluded.model,
       generation = excluded.generation,
       configuration = excluded.configuration,
       displacement_l = excluded.displacement_l,
       cylinders = excluded.cylinders,
       fuel = excluded.fuel,
       induction = excluded.induction,
       transmission = excluded.transmission,
       drive = excluded.drive,
       body = excluded.body,
       source = excluded.source,
       source_id = excluded.source_id,
       fetched_at = now()`,
    [
      vehicle.id,
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.generation,
      vehicle.configuration,
      vehicle.engine.displacement_l,
      vehicle.engine.cylinders,
      vehicle.engine.fuel,
      vehicle.engine.induction,
      vehicle.transmission,
      vehicle.drive,
      vehicle.body,
      vehicle.source,
      vehicle.source_id,
    ],
  );
}

function fromEpa(xml: string, id: string, label: string): IdentityVehicle {
  const sourceId = id.slice(4);
  const eng = xmlTag(xml, "eng_dscr");
  return {
    id,
    year: Number(xmlTag(xml, "year")),
    make: xmlTag(xml, "make") ?? "",
    model: xmlTag(xml, "model") ?? "",
    generation: null,
    configuration: label,
    engine: {
      displacement_l: num(xmlTag(xml, "displ")),
      cylinders: num(xmlTag(xml, "cylinders")),
      fuel: xmlTag(xml, "fuelType1"),
      induction: inductionFrom(eng),
    },
    transmission: xmlTag(xml, "trany"),
    drive: xmlTag(xml, "drive"),
    body: xmlTag(xml, "VClass"),
    source: "epa",
    source_id: sourceId,
  };
}

export async function ensureYearMakeModel(
  year: number,
  make: string,
  model: string,
): Promise<IdentityVehicle> {
  const makes = await listMakes(year);
  const exactMake = makes.find((item) => item.toLowerCase() === make.toLowerCase());
  if (!exactMake) throw new Error("That make is not listed for this year.");
  const models = await listModels(year, exactMake);
  const exactModel =
    models.find((item) => item === model) ??
    models.find((item) => item.toLowerCase() === model.toLowerCase());
  if (!exactModel) throw new Error("That model is not listed for this year and make.");

  const id = `ymm-${year}-${slug(exactMake)}-${slug(exactModel)}`;
  const sourceId = `${year}|${norm(exactMake)}|${norm(exactModel)}`;
  const sql = await getSql();
  const existing = await sql.query<VehicleRow>(
    "select * from identity_vehicles where source = 'ymm' and source_id = $1",
    [sourceId],
  );
  if (existing[0]) return toVehicle(existing[0]);

  const vehicle: IdentityVehicle = {
    id,
    year,
    make: exactMake,
    model: exactModel,
    generation: null,
    configuration: "",
    engine: { displacement_l: null, cylinders: null, fuel: null, induction: null },
    transmission: null,
    drive: null,
    body: null,
    source: "ymm",
    source_id: sourceId,
  };
  await saveVehicle(vehicle);
  return vehicle;
}

export async function getVehicle(id: string): Promise<IdentityVehicle | null> {
  const cached = await readVehicle(id);
  if (cached && (id.startsWith("nhtsa-") || Date.now() - cached.at < VEHICLE_TTL_MS)) {
    return cached.vehicle;
  }
  if (!id.startsWith("epa-")) return cached?.vehicle ?? null;
  const sourceId = id.slice(4);
  if (!/^\d+$/.test(sourceId)) return cached?.vehicle ?? null;
  try {
    const xml = await epaVehicleXml(sourceId);
    const vehicle = fromEpa(xml, id, cached?.vehicle.configuration ?? xmlTag(xml, "trany") ?? "Configuration");
    if (!vehicle.year || !vehicle.make || !vehicle.model) return cached?.vehicle ?? null;
    const menu = await readCache(
      `configs:${vehicle.year}:${vehicle.make.toLowerCase()}:${vehicle.model.toLowerCase()}`,
    );
    if (menu) {
      const choices = JSON.parse(menu.payload) as { id: string; label: string }[];
      const match = choices.find((choice) => choice.id === id);
      if (match) vehicle.configuration = match.label;
    }
    await saveVehicle(vehicle);
    return vehicle;
  } catch {
    return cached?.vehicle ?? null;
  }
}

function scoreChoice(label: string, modelName: string, decoded: NhtsaDecode): number {
  const hay = `${modelName} ${label}`.toLowerCase();
  let score = 0;
  if (decoded.displacement != null && hay.includes(String(decoded.displacement))) score += 4;
  if (decoded.cylinders != null && hay.includes(`${decoded.cylinders} cyl`)) score += 3;
  const drive = (decoded.drive ?? "").toLowerCase();
  const awd = hay.includes("awd") || hay.includes("4wd") || hay.includes("all-wheel");
  if (drive.includes("all") || drive.includes("4wd") || drive.includes("awd")) score += awd ? 3 : -1;
  if (drive.includes("front") || drive.includes("fwd")) score += awd ? 0 : 2;
  const trim = decoded.trim ?? "";
  for (const word of trim.toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length > 2 && hay.includes(word)) score += 2;
  }
  return score;
}

function nhtsaVehicle(decoded: NhtsaDecode, make: string): IdentityVehicle {
  const model = decoded.model;
  const configuration = decoded.trim || decoded.series || "VIN configuration";
  const id = `nhtsa-${decoded.year}-${slug(make)}-${slug(model)}-${slug(configuration)}`;
  const generation = decoded.series && norm(decoded.series) !== norm(model) ? decoded.series : null;
  return {
    id,
    year: decoded.year,
    make,
    model,
    generation,
    configuration,
    engine: {
      displacement_l: decoded.displacement,
      cylinders: decoded.cylinders,
      fuel: decoded.fuel,
      induction: decoded.induction,
    },
    transmission: decoded.transmission,
    drive: decoded.drive,
    body: decoded.body,
    source: "nhtsa",
    source_id: id,
  };
}

export async function resolveVin(vin: string): Promise<VinResolution> {
  const clean = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  if (clean.length !== 17) throw new Error("VIN must be 17 characters.");

  const sql = await getSql();
  const known = await sql.query<{ vehicle_id: string; fetched_at: string }>(
    "select vehicle_id, fetched_at from identity_vins where vin = $1",
    [clean],
  );
  const prior = known[0];
  if (prior && Date.now() - new Date(prior.fetched_at).getTime() < VEHICLE_TTL_MS) {
    const vehicle = await getVehicle(prior.vehicle_id);
    if (vehicle) return { vehicle, vin: clean };
  }

  const decoded = await decodeNhtsa(clean);
  const makes = await listMakes(decoded.year);
  const make =
    makes.find((item) => norm(item) === norm(decoded.make)) ??
    decoded.make.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  const models = await listModels(decoded.year, make).catch(() => [] as string[]);
  const needle = norm(decoded.model);
  const candidates = models.filter((item) => {
    const n = norm(item);
    return n === needle || n.startsWith(needle) || needle.startsWith(n);
  });

  let best: { id: string; label: string; model: string; score: number } | null = null;
  for (const model of candidates) {
    const configs = await listConfigurations(decoded.year, make, model).catch(() => [] as ConfigChoice[]);
    for (const config of configs) {
      const score = scoreChoice(config.label, model, decoded);
      if (!best || score > best.score) best = { id: config.id, label: config.label, model, score };
    }
  }

  let vehicle: IdentityVehicle;
  if (best) {
    const loaded = await getVehicle(best.id);
    vehicle =
      loaded ??
      ({
        id: best.id,
        year: decoded.year,
        make,
        model: best.model,
        generation: null,
        configuration: best.label,
        engine: {
          displacement_l: decoded.displacement,
          cylinders: decoded.cylinders,
          fuel: decoded.fuel,
          induction: decoded.induction,
        },
        transmission: decoded.transmission,
        drive: decoded.drive,
        body: decoded.body,
        source: "epa",
        source_id: best.id.slice(4),
      } satisfies IdentityVehicle);
    if (!loaded) await saveVehicle(vehicle);
    else if (loaded.configuration !== best.label) {
      vehicle = { ...loaded, configuration: best.label };
      await saveVehicle(vehicle);
    }
  } else {
    vehicle = nhtsaVehicle(decoded, make);
    await saveVehicle(vehicle);
  }

  await sql.query(
    `insert into identity_vins (vin, vehicle_id, fetched_at)
     values ($1, $2, now())
     on conflict (vin) do update set vehicle_id = excluded.vehicle_id, fetched_at = now()`,
    [clean, vehicle.id],
  );
  return { vehicle, vin: clean };
}
