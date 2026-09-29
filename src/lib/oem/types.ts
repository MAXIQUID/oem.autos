export type Yard = {
  id: string;
  name: string;
  city: string;
  state: string;
};

export type Vehicle = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body: string;
  engine: string;
  engine_code: string | null;
  transmission: string;
  drivetrain: string;
  color: string;
  plant: string | null;
  mileage: number;
  yard_id: string;
  intake_at: string;
  title_status: string;
  damage: string | null;
  photo: string;
  yard_name: string;
  yard_city: string;
  yard_state: string;
  listed_count: number;
  in_vehicle_count: number;
  bom_count: number;
};

export type AssemblySummary = {
  id: string;
  name: string;
  short_name: string;
  sort_order: number;
  part_count: number;
  listed_count: number;
  in_vehicle_count: number;
};

export type OemPart = {
  oem_number: string;
  name: string;
  assembly_id: string;
  assembly_name: string;
  brand: string;
  description: string;
  supercedes: string | null;
  msrp_cents: number | null;
  photo: string | null;
};

export type Fitment = {
  id: number;
  oem_number: string;
  year_start: number;
  year_end: number;
  make: string;
  model: string;
  notes: string | null;
};

export type InventoryStatus = "listed" | "in_vehicle" | "sold";

export type InventoryItem = {
  sku: string;
  vin: string;
  oem_number: string;
  position: string;
  condition: string;
  grade: string;
  status: InventoryStatus;
  price_cents: number | null;
  photo: string | null;
  notes: string | null;
  removed_at: string | null;
  marketplace: string | null;
  tested: boolean;
  part_name: string;
  part_photo: string | null;
  brand: string;
  assembly_id: string;
  assembly_name: string;
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_trim: string;
  vehicle_photo: string;
  vehicle_mileage: number;
  vehicle_color: string;
  yard_name: string;
  yard_city: string;
  yard_state: string;
};

export type BomPart = {
  oem_number: string;
  name: string;
  assembly_id: string;
  position: string;
  qty: number;
  photo: string | null;
  msrp_cents: number | null;
  sku: string | null;
  status: InventoryStatus | null;
  price_cents: number | null;
  grade: string | null;
  listing_photo: string | null;
};
