import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CopartLot, PartsReport, SalePage, VehicleFeed } from "./types";
import { VEHICLE_SORTS } from "./types";

const filters = z.object({
  q: z.string().max(80).optional(),
  make: z.string().max(40).optional(),
  state: z.string().max(8).optional(),
  sale: z.number().int().min(0).max(99_999_999).optional(),
  sort: z.string().max(20).optional(),
  runs: z.boolean().optional(),
  page: z.number().int().min(1).max(8000).optional(),
});

export const searchVehicles = createServerFn({ method: "GET" })
  .validator(
    z.object({
      q: z.string().max(80).optional(),
      year: z.number().int().min(1980).max(2035).optional(),
      make: z.string().max(60).optional(),
      model: z.string().max(60).optional(),
      body: z.string().max(60).optional(),
      engine: z.string().max(60).optional(),
      drivetrain: z.string().max(60).optional(),
      transmission: z.string().max(60).optional(),
      sort: z.enum(VEHICLE_SORTS).optional(),
      page: z.number().int().min(1).max(8000).optional(),
    }),
  )
  .handler(async ({ data }): Promise<VehicleFeed> => {
    const { searchVehicles: run } = await import("./feed.server");
    return run(data);
  });

export const getSalePage = createServerFn({ method: "GET" })
  .validator(filters)
  .handler(async ({ data }) => {
    const { querySale } = await import("./feed.server");
    return querySale(data);
  });

export const lookupInventory = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string().trim().min(1).max(80) }))
  .handler(async ({ data }): Promise<{ lot: number | null }> => {
    const { findInventory } = await import("./feed.server");
    const lot = await findInventory(data.q);
    return { lot: lot?.lot ?? null };
  });

export const getSaleLot = createServerFn({ method: "GET" })
  .validator(z.object({ lot: z.string().regex(/^\d{4,12}$/) }))
  .handler(async ({ data }): Promise<{ lot: CopartLot | null }> => {
    const { getLot } = await import("./feed.server");
    return { lot: await getLot(Number(data.lot)) };
  });

export const getSaleParts = createServerFn({ method: "GET" })
  .validator(z.object({ lot: z.string().regex(/^\d{4,12}$/) }))
  .handler(async ({ data }): Promise<PartsReport> => {
    const { getLot } = await import("./feed.server");
    const { partsForLot } = await import("./parts.server");
    const lot = await getLot(Number(data.lot));
    if (!lot) {
      return {
        label: "",
        error: "That lot is not on the current sale sheet.",
        shown: 0,
        low: null,
        median: null,
        high: null,
        items: [],
        groups: [],
      };
    }
    return partsForLot(lot);
  });

export type { SalePage };
