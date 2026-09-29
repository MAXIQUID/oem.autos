import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/page-shell";
import { VehicleFeedView, type VehicleSearch } from "@/components/vehicle-feed";
import { searchVehicles } from "@/lib/copart/queries";
import { VEHICLE_SORTS, type VehicleSort } from "@/lib/copart/types";

const searchSchema = z.object({
  q: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  body: z.string().optional(),
  engine: z.string().optional(),
  drivetrain: z.string().optional(),
  transmission: z.string().optional(),
  sort: z.string().optional(),
  page: z.union([z.string(), z.number()]).optional(),
});

function num(value: unknown, min: number, max: number): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

function slugParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) ? s : undefined;
}

function sortParam(value: unknown): VehicleSort | undefined {
  return typeof value === "string" && (VEHICLE_SORTS as readonly string[]).includes(value)
    ? (value as VehicleSort)
    : undefined;
}

export const Route = createFileRoute("/vehicles")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }): VehicleSearch => ({
    q: search.q?.trim() || undefined,
    year: num(search.year, 1980, 2035),
    make: slugParam(search.make),
    model: slugParam(search.model),
    body: slugParam(search.body),
    engine: slugParam(search.engine),
    drivetrain: slugParam(search.drivetrain),
    transmission: slugParam(search.transmission),
    sort: sortParam(search.sort),
    page: num(search.page, 1, 8000),
  }),
  loader: ({ deps }) => searchVehicles({ data: deps }),
  component: VehiclesPage,
});

function VehiclesPage() {
  const feed = Route.useLoaderData();
  return (
    <PageShell>
      <VehicleFeedView feed={feed} />
    </PageShell>
  );
}
