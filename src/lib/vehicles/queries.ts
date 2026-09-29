import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ConfigChoice, IdentityVehicle, VinResolution } from "./types";
import type { PartsReport } from "@/lib/copart/types";

const year = z.number().int().min(1980).max(2035);
const name = z.string().trim().min(1).max(80);
const vehicleId = z.string().regex(/^(epa-\d+|nhtsa-[a-z0-9-]+|ymm-\d{4}-[a-z0-9-]+)$/);

export const getYears = createServerFn({ method: "GET" }).handler(async (): Promise<number[]> => {
  const { listYears } = await import("./catalog.server");
  return listYears();
});

export const getMakes = createServerFn({ method: "GET" })
  .validator(z.object({ year }))
  .handler(async ({ data }): Promise<string[]> => {
    const { listMakes } = await import("./catalog.server");
    return listMakes(data.year);
  });

export const getModels = createServerFn({ method: "GET" })
  .validator(z.object({ year, make: name }))
  .handler(async ({ data }): Promise<string[]> => {
    const { listModels } = await import("./catalog.server");
    return listModels(data.year, data.make);
  });

export const getConfigurations = createServerFn({ method: "GET" })
  .validator(z.object({ year, make: name, model: name }))
  .handler(async ({ data }): Promise<ConfigChoice[]> => {
    const { listConfigurations } = await import("./catalog.server");
    return listConfigurations(data.year, data.make, data.model);
  });

export const ensureYmm = createServerFn({ method: "POST" })
  .validator(z.object({ year, make: name, model: name }))
  .handler(async ({ data }): Promise<IdentityVehicle> => {
    const { ensureYearMakeModel } = await import("./catalog.server");
    return ensureYearMakeModel(data.year, data.make, data.model);
  });

export const getIdentity = createServerFn({ method: "GET" })
  .validator(z.object({ id: vehicleId }))
  .handler(async ({ data }): Promise<IdentityVehicle | null> => {
    const { getVehicle } = await import("./catalog.server");
    return getVehicle(data.id);
  });

export const resolveVinToVehicle = createServerFn({ method: "GET" })
  .validator(z.object({ vin: z.string().min(11).max(20) }))
  .handler(async ({ data }): Promise<VinResolution> => {
    const { resolveVin } = await import("./catalog.server");
    return resolveVin(data.vin);
  });

export const getVehicleParts = createServerFn({ method: "GET" })
  .validator(z.object({ id: vehicleId }))
  .handler(async ({ data }): Promise<PartsReport> => {
    const { getVehicle } = await import("./catalog.server");
    const { partsForVehicle } = await import("@/lib/copart/parts.server");
    const vehicle = await getVehicle(data.id);
    if (!vehicle) {
      return {
        label: "",
        error: "Unknown vehicle.",
        shown: 0,
        low: null,
        median: null,
        high: null,
        items: [],
        groups: [],
      };
    }
    return partsForVehicle({ year: vehicle.year, make: vehicle.make, model: vehicle.model });
  });
