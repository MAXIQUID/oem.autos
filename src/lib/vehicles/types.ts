export type VehicleEngine = {
  displacement_l: number | null;
  cylinders: number | null;
  fuel: string | null;
  induction: string | null;
};

export type IdentityVehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  generation: string | null;
  configuration: string;
  engine: VehicleEngine;
  transmission: string | null;
  drive: string | null;
  body: string | null;
  source: string;
  source_id: string;
};

export type ConfigChoice = {
  id: string;
  label: string;
};

export type VinResolution = {
  vehicle: IdentityVehicle;
  vin: string;
};
