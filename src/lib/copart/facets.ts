import type { CopartLot } from "./types";

export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normBody(raw: string): string {
  const s = raw.toUpperCase();
  if (!s.trim()) return "";
  if (s.includes("PICKUP") || s.includes("PICK-UP")) return "Pickup";
  if (s.includes("SUV") || s.includes("SPORT UTILITY") || s.includes("UTILITY")) return "SUV";
  if (s.includes("SEDAN")) return "Sedan";
  if (s.includes("COUPE") || s.includes("COUP")) return "Coupe";
  if (s.includes("HATCH")) return "Hatchback";
  if (s.includes("WAGON")) return "Wagon";
  if (s.includes("VAN")) return "Van";
  if (s.includes("CONVERT") || s.includes("CABRIO") || s.includes("ROADSTER")) return "Convertible";
  return "Other";
}

export function normDrive(raw: string): string {
  const s = raw.toUpperCase();
  if (!s.trim()) return "";
  if (s.includes("4X4") || s.includes("4WD") || s.includes("FOUR")) return "4WD";
  if (s.includes("ALL")) return "AWD";
  if (s.includes("FRONT")) return "FWD";
  if (s.includes("REAR")) return "RWD";
  return "Other";
}

export function normTrans(raw: string): string {
  const s = raw.toUpperCase();
  if (s.includes("AUTO")) return "Automatic";
  if (s.includes("MANUAL")) return "Manual";
  return "";
}

export function normEngine(raw: string): string {
  const s = raw.trim().replace(/\s+/g, " ");
  if (!s || /^unknown$/i.test(s) || /^0+(?:\.0+)?(?:\s*l.*)?$/i.test(s)) return "";
  if (/electric/i.test(s)) return "Electric";
  const match = s.match(/^(\d+(?:\.\d+)?)L(?:\s+(\d+))?/i);
  if (!match || Number(match[1]) === 0) return "";
  return match[2] ? `${match[1]}L ${match[2]}-cyl` : `${match[1]}L`;
}

function prettyModel(model: string): string {
  if (/^[A-Z][a-z]{0,2}(?:-[A-Za-z0-9])?$/.test(model) && !/[aeiou]/i.test(model)) return model.toUpperCase();
  if (/^[A-Za-z]+\d[A-Za-z0-9]*$/.test(model) && model.length <= 5) return model.toUpperCase();
  return model;
}

export type FacetDim = "year" | "make" | "model" | "body" | "engine" | "drive" | "trans";

export type FacetKey = { id: string; label: string };

export function facetKeys(lot: CopartLot): Record<FacetDim, FacetKey> {
  const body = normBody(lot.body);
  const drive = normDrive(lot.drive);
  const trans = normTrans(lot.trans);
  const engine = normEngine(lot.engine);
  const model = prettyModel(lot.model);
  return {
    year: { id: String(lot.year), label: String(lot.year) },
    make: { id: slug(lot.make), label: lot.make },
    model: { id: slug(model), label: model },
    body: { id: body ? slug(body) : "", label: body },
    engine: { id: engine ? slug(engine) : "", label: engine },
    drive: { id: drive ? slug(drive) : "", label: drive },
    trans: { id: trans ? slug(trans) : "", label: trans },
  };
}
