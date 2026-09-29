import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { decodeVin, normalizeVin, withCorrectedCheckDigit } from "@/lib/vin";
import type {
  AssemblySummary,
  BomPart,
  Fitment,
  InventoryItem,
  OemPart,
  Vehicle,
} from "./types";

const LISTING_SELECT = `
  i.sku, i.vin, i.oem_number, i.position, i.condition, i.grade, i.status,
  i.price_cents, i.photo, i.notes, i.removed_at, i.marketplace, i.tested,
  p.name as part_name, p.photo as part_photo, p.brand,
  p.assembly_id, a.name as assembly_name,
  v.year as vehicle_year, v.make as vehicle_make, v.model as vehicle_model,
  v.trim as vehicle_trim, v.photo as vehicle_photo, v.mileage as vehicle_mileage,
  v.color as vehicle_color,
  y.name as yard_name, y.city as yard_city, y.state as yard_state
`;

function asInventory(rows: InventoryItem[]): InventoryItem[] {
  return rows.map((r) => ({
    ...r,
    tested: Boolean(r.tested),
    price_cents: r.price_cents == null ? null : Number(r.price_cents),
    vehicle_year: Number(r.vehicle_year),
    vehicle_mileage: Number(r.vehicle_mileage),
  }));
}

function asVehicle(row: Vehicle): Vehicle {
  return {
    ...row,
    year: Number(row.year),
    mileage: Number(row.mileage),
    listed_count: Number(row.listed_count),
    in_vehicle_count: Number(row.in_vehicle_count),
    bom_count: Number(row.bom_count),
  };
}

const VEHICLE_SELECT = `
  v.*, y.name as yard_name, y.city as yard_city, y.state as yard_state,
  (select count(*)::int from inventory i where i.vin = v.vin and i.status = 'listed') as listed_count,
  (select count(*)::int from inventory i where i.vin = v.vin and i.status = 'in_vehicle') as in_vehicle_count,
  (select count(*)::int from vehicle_bom b where b.vin = v.vin) as bom_count
`;

async function fetchVehicle(vin: string): Promise<Vehicle | null> {
  const sql = await getSql();
  const rows = await sql.query<Vehicle>(
    `select ${VEHICLE_SELECT}
     from vehicles v
     join yards y on y.id = v.yard_id
     where v.vin = $1`,
    [vin],
  );
  return rows[0] ? asVehicle(rows[0]) : null;
}

async function fetchAssemblies(vin: string): Promise<AssemblySummary[]> {
  const sql = await getSql();
  const rows = await sql.query<AssemblySummary>(
    `select a.id, a.name, a.short_name, a.sort_order,
            count(distinct b.oem_number)::int as part_count,
            count(distinct i.sku) filter (where i.status = 'listed')::int as listed_count,
            count(distinct i.sku) filter (where i.status = 'in_vehicle')::int as in_vehicle_count
     from assemblies a
     join oem_parts p on p.assembly_id = a.id
     join vehicle_bom b on b.oem_number = p.oem_number and b.vin = $1
     left join inventory i on i.oem_number = p.oem_number and i.vin = $1 and i.position = b.position
     group by a.id, a.name, a.short_name, a.sort_order
     order by a.sort_order`,
    [vin],
  );
  return rows.map((r) => ({
    ...r,
    sort_order: Number(r.sort_order),
    part_count: Number(r.part_count),
    listed_count: Number(r.listed_count),
    in_vehicle_count: Number(r.in_vehicle_count),
  }));
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const vehicles = await sql.query<Vehicle>(
    `select ${VEHICLE_SELECT}
     from vehicles v
     join yards y on y.id = v.yard_id
     order by v.intake_at desc`,
  );
  const listings = await sql.query<InventoryItem>(
    `select ${LISTING_SELECT}
     from inventory i
     join oem_parts p on p.oem_number = i.oem_number
     join assemblies a on a.id = p.assembly_id
     join vehicles v on v.vin = i.vin
     join yards y on y.id = v.yard_id
     where i.status = 'listed'
     order by i.removed_at desc nulls last, i.sku
     limit 12`,
  );
  const statsRows = await sql.query<{
    vehicles: number;
    listed: number;
    in_vehicle: number;
    parts: number;
  }>(
    `select
       (select count(*)::int from vehicles) as vehicles,
       (select count(*)::int from inventory where status = 'listed') as listed,
       (select count(*)::int from inventory where status = 'in_vehicle') as in_vehicle,
       (select count(*)::int from oem_parts) as parts`,
  );
  const stats = statsRows[0] ?? { vehicles: 0, listed: 0, in_vehicle: 0, parts: 0 };
  return {
    vehicles: vehicles.map(asVehicle),
    listings: asInventory(listings),
    stats: {
      vehicles: Number(stats.vehicles),
      listed: Number(stats.listed),
      in_vehicle: Number(stats.in_vehicle),
      parts: Number(stats.parts),
    },
  };
});

export const getYardData = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const vehicles = await sql.query<Vehicle>(
    `select ${VEHICLE_SELECT}
     from vehicles v
     join yards y on y.id = v.yard_id
     order by y.name, v.year desc`,
  );
  const yards = await sql.query<{
    id: string;
    name: string;
    city: string;
    state: string;
    vehicle_count: number;
  }>(
    `select y.id, y.name, y.city, y.state, count(v.vin)::int as vehicle_count
     from yards y
     left join vehicles v on v.yard_id = y.id
     group by y.id
     order by y.name`,
  );
  return {
    vehicles: vehicles.map(asVehicle),
    yards: yards.map((y) => ({ ...y, vehicle_count: Number(y.vehicle_count) })),
  };
});

const vinInput = z.object({ vin: z.string().min(1).max(32) });

export const getVehiclePage = createServerFn({ method: "GET" })
  .validator(vinInput)
  .handler(async ({ data }) => {
    const decoded = decodeVin(data.vin);
    const candidates = [decoded.vin, withCorrectedCheckDigit(decoded.vin)].filter(
      (v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i,
    );
    let vehicle: Vehicle | null = null;
    for (const c of candidates) {
      vehicle = await fetchVehicle(c);
      if (vehicle) break;
    }
    if (!vehicle) {
      const sql = await getSql();
      const similar = decoded.make
        ? await sql.query<Vehicle>(
            `select ${VEHICLE_SELECT}
             from vehicles v
             join yards y on y.id = v.yard_id
             where v.make = $1
             order by abs(v.year - $2)
             limit 4`,
            [decoded.make, decoded.year ?? 2017],
          )
        : [];
      return {
        decoded,
        vehicle: null,
        assemblies: [] as AssemblySummary[],
        listings: [] as InventoryItem[],
        similar: similar.map(asVehicle),
      };
    }
    const sql = await getSql();
    const listings = await sql.query<InventoryItem>(
      `select ${LISTING_SELECT}
       from inventory i
       join oem_parts p on p.oem_number = i.oem_number
       join assemblies a on a.id = p.assembly_id
       join vehicles v on v.vin = i.vin
       join yards y on y.id = v.yard_id
       where i.vin = $1
       order by case i.status when 'listed' then 0 when 'in_vehicle' then 1 else 2 end, p.name`,
      [vehicle.vin],
    );
    return {
      decoded,
      vehicle,
      assemblies: await fetchAssemblies(vehicle.vin),
      listings: asInventory(listings),
      similar: [] as Vehicle[],
    };
  });

export const getAssemblyPage = createServerFn({ method: "GET" })
  .validator(z.object({ vin: z.string().min(1), assembly: z.string().min(1) }))
  .handler(async ({ data }) => {
    const page = await getVehiclePage({ data: { vin: data.vin } });
    if (!page.vehicle) return { ...page, assembly: null, parts: [] as BomPart[] };
    const sql = await getSql();
    const assemblyRows = await sql.query<{
      id: string;
      name: string;
      short_name: string;
      sort_order: number;
    }>(`select id, name, short_name, sort_order from assemblies where id = $1`, [
      data.assembly,
    ]);
    const assembly = assemblyRows[0] ?? null;
    const parts = await sql.query<BomPart>(
      `select b.oem_number, p.name, p.assembly_id, b.position, b.qty, p.photo, p.msrp_cents,
              i.sku, i.status, i.price_cents, i.grade, i.photo as listing_photo
       from vehicle_bom b
       join oem_parts p on p.oem_number = b.oem_number
       left join inventory i
         on i.vin = b.vin and i.oem_number = b.oem_number and i.position = b.position
       where b.vin = $1 and p.assembly_id = $2
       order by p.name`,
      [page.vehicle.vin, data.assembly],
    );
    return {
      ...page,
      assembly,
      parts: parts.map((p) => ({
        ...p,
        qty: Number(p.qty),
        msrp_cents: p.msrp_cents == null ? null : Number(p.msrp_cents),
        price_cents: p.price_cents == null ? null : Number(p.price_cents),
      })),
    };
  });

export const getPartPage = createServerFn({ method: "GET" })
  .validator(z.object({ oem: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const oem = data.oem.trim();
    const partRows = await sql.query<OemPart>(
      `select p.oem_number, p.name, p.assembly_id, a.name as assembly_name,
              p.brand, p.description, p.supercedes, p.msrp_cents, p.photo
       from oem_parts p
       join assemblies a on a.id = p.assembly_id
       where upper(p.oem_number) = upper($1)`,
      [oem],
    );
    const part = partRows[0]
      ? { ...partRows[0], msrp_cents: partRows[0].msrp_cents == null ? null : Number(partRows[0].msrp_cents) }
      : null;
    if (!part) {
      const { searchEbayParts } = await import("@/lib/ebay/client.server");
      const ebay = await searchEbayParts(oem);
      return {
        part: null,
        fitment: [] as Fitment[],
        listings: [] as InventoryItem[],
        donors: [] as Vehicle[],
        ebay,
      };
    }
    const fitment = await sql.query<Fitment>(
      `select id, oem_number, year_start, year_end, make, model, notes
       from part_fitment where oem_number = $1
       order by make, model, year_start`,
      [part.oem_number],
    );
    const listings = await sql.query<InventoryItem>(
      `select ${LISTING_SELECT}
       from inventory i
       join oem_parts p on p.oem_number = i.oem_number
       join assemblies a on a.id = p.assembly_id
       join vehicles v on v.vin = i.vin
       join yards y on y.id = v.yard_id
       where i.oem_number = $1
       order by case i.status when 'listed' then 0 when 'in_vehicle' then 1 else 2 end, i.price_cents nulls last`,
      [part.oem_number],
    );
    const donors = await sql.query<Vehicle>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       join yards y on y.id = v.yard_id
       join vehicle_bom b on b.vin = v.vin
       where b.oem_number = $1
       order by v.year desc`,
      [part.oem_number],
    );
    const { searchEbayParts } = await import("@/lib/ebay/client.server");
    const ebay = await searchEbayParts(part.oem_number);
    return {
      part,
      fitment: fitment.map((f) => ({
        ...f,
        id: Number(f.id),
        year_start: Number(f.year_start),
        year_end: Number(f.year_end),
      })),
      listings: asInventory(listings),
      donors: donors.map(asVehicle),
      ebay,
    };
  });

export const getListingPage = createServerFn({ method: "GET" })
  .validator(z.object({ sku: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<InventoryItem>(
      `select ${LISTING_SELECT}
       from inventory i
       join oem_parts p on p.oem_number = i.oem_number
       join assemblies a on a.id = p.assembly_id
       join vehicles v on v.vin = i.vin
       join yards y on y.id = v.yard_id
       where upper(i.sku) = upper($1)`,
      [data.sku.trim()],
    );
    const listing = asInventory(rows)[0] ?? null;
    if (!listing) return { listing: null, siblings: [] as InventoryItem[], part: null as OemPart | null };
    const partRows = await sql.query<OemPart>(
      `select p.oem_number, p.name, p.assembly_id, a.name as assembly_name,
              p.brand, p.description, p.supercedes, p.msrp_cents, p.photo
       from oem_parts p
       join assemblies a on a.id = p.assembly_id
       where p.oem_number = $1`,
      [listing.oem_number],
    );
    const siblings = await sql.query<InventoryItem>(
      `select ${LISTING_SELECT}
       from inventory i
       join oem_parts p on p.oem_number = i.oem_number
       join assemblies a on a.id = p.assembly_id
       join vehicles v on v.vin = i.vin
       join yards y on y.id = v.yard_id
       where i.oem_number = $1 and i.sku <> $2
       order by case i.status when 'listed' then 0 else 1 end
       limit 4`,
      [listing.oem_number, listing.sku],
    );
    const part = partRows[0]
      ? { ...partRows[0], msrp_cents: partRows[0].msrp_cents == null ? null : Number(partRows[0].msrp_cents) }
      : null;
    return { listing, siblings: asInventory(siblings), part };
  });

export const searchCatalog = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string().max(80).optional() }))
  .handler(async ({ data }) => {
    const q = (data.q ?? "").trim();
    if (!q) {
      return {
        q,
        vehicles: [] as Vehicle[],
        parts: [] as OemPart[],
        listings: [] as InventoryItem[],
        ebay: { items: [], total: 0, error: null },
      };
    }
    const decoded = decodeVin(q);
    const sql = await getSql();
    const like = `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;

    let vehicles = await sql.query<Vehicle>(
      `select ${VEHICLE_SELECT}
       from vehicles v
       join yards y on y.id = v.yard_id
       where v.vin = $1
          or v.vin = $2
          or (v.make ilike $3 or v.model ilike $3 or (v.year::text || ' ' || v.make || ' ' || v.model) ilike $3)
       order by v.year desc
       limit 8`,
      [decoded.vin, withCorrectedCheckDigit(decoded.vin) ?? decoded.vin, like],
    );

    const parts = await sql.query<OemPart>(
      `select p.oem_number, p.name, p.assembly_id, a.name as assembly_name,
              p.brand, p.description, p.supercedes, p.msrp_cents, p.photo
       from oem_parts p
       join assemblies a on a.id = p.assembly_id
       where p.oem_number ilike $1 or p.name ilike $1 or p.brand ilike $1
       order by p.brand, p.name
       limit 12`,
      [like],
    );

    const listings = await sql.query<InventoryItem>(
      `select ${LISTING_SELECT}
       from inventory i
       join oem_parts p on p.oem_number = i.oem_number
       join assemblies a on a.id = p.assembly_id
       join vehicles v on v.vin = i.vin
       join yards y on y.id = v.yard_id
       where i.sku ilike $1 or p.oem_number ilike $1 or p.name ilike $1
       order by case i.status when 'listed' then 0 else 1 end
       limit 12`,
      [like],
    );

    const { searchEbayParts } = await import("@/lib/ebay/client.server");
    const ebay = decoded.validLength
      ? { items: [], total: 0, error: null }
      : await searchEbayParts(q);

    return {
      q,
      decoded: decoded.validLength ? decoded : null,
      vehicles: vehicles.map(asVehicle),
      parts: parts.map((p) => ({
        ...p,
        msrp_cents: p.msrp_cents == null ? null : Number(p.msrp_cents),
      })),
      listings: asInventory(listings),
      ebay,
    };
  });

export const getMarketItem = createServerFn({ method: "GET" })
  .validator(z.object({ itemId: z.string().min(3).max(80) }))
  .handler(async ({ data }) => {
    const { getEbayItem } = await import("@/lib/ebay/client.server");
    try {
      const item = await getEbayItem(data.itemId);
      return { item, error: null as string | null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "eBay item failed";
      return { item: null, error: message };
    }
  });
