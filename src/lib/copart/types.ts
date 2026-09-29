import type { EbayHit } from "@/lib/ebay/types";

export type CopartLot = {
  lot: number;
  year: number;
  make: string;
  model: string;
  group: string;
  trim: string;
  body: string;
  color: string;
  damage: string;
  secondary: string;
  vin: string;
  miles: number;
  keys: string;
  runs: string;
  title: string;
  yard: string;
  city: string;
  state: string;
  saleDate: string;
  saleOrd: number;
  bidCents: number | null;
  binCents: number | null;
  retailCents: number | null;
  repairCents: number | null;
  engine: string;
  drive: string;
  trans: string;
  fuel: string;
  thumb: string;
  photo: string;
};

export const SALE_SORTS = ["sale", "bid", "bid-asc", "year", "year-asc", "miles"] as const;
export type SaleSort = (typeof SALE_SORTS)[number];

export type SaleFacet = { id: string; label: string; count: number };

export type SalePage = {
  total: number;
  page: number;
  pages: number;
  sheetCount: number;
  updated: string;
  vehicles: CopartLot[];
  makes: SaleFacet[];
  states: SaleFacet[];
  dates: SaleFacet[];
};

export const VEHICLE_SORTS = ["recent", "year", "year-asc", "name", "vin"] as const;
export type VehicleSort = (typeof VEHICLE_SORTS)[number];

export type VehicleQuery = {
  q: string;
  year: string;
  make: string;
  model: string;
  body: string;
  engine: string;
  drivetrain: string;
  transmission: string;
  sort: VehicleSort;
  page: number;
};

export type VehicleFacets = {
  year: SaleFacet[];
  make: SaleFacet[];
  model: SaleFacet[];
  body: SaleFacet[];
  engine: SaleFacet[];
  drivetrain: SaleFacet[];
  transmission: SaleFacet[];
};

export type VehicleFeed = {
  total: number;
  indexed: number;
  page: number;
  pages: number;
  nextCursor: string | null;
  sort: VehicleSort;
  results: CopartLot[];
  facets: VehicleFacets;
  query: VehicleQuery;
};

export type PartGroup = {
  id: string;
  label: string;
  items: EbayHit[];
};

export type PartsReport = {
  label: string;
  error: string | null;
  shown: number;
  low: number | null;
  median: number | null;
  high: number | null;
  items: EbayHit[];
  groups: PartGroup[];
};
