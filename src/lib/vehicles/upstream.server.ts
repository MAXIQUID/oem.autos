const EPA = "https://www.fueleconomy.gov/ws/rest/vehicle";

export type MenuPair = { text: string; value: string };

function decode(value: string): string {
  return value
    .replaceAll("&" + "amp;", "&")
    .replaceAll("&" + "lt;", "<")
    .replaceAll("&" + "gt;", ">")
    .replaceAll("&" + "quot;", '"')
    .replaceAll("&" + "#39;", "'")
    .trim();
}

export function menuItems(xml: string): MenuPair[] {
  const out: MenuPair[] = [];
  const re = /<menuItem>\s*<text>([^<]*)<\/text>\s*<value>([^<]*)<\/value>\s*<\/menuItem>/g;
  for (const match of xml.matchAll(re)) {
    const text = decode(match[1] ?? "");
    const value = decode(match[2] ?? "");
    if (text && value) out.push({ text, value });
  }
  return out;
}

export function xmlTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  const value = match?.[1] ? decode(match[1]) : "";
  return value || null;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/xml, application/json;q=0.9",
      "User-Agent": "OEM.autos/1.0",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`vehicle source ${res.status}`);
  return res.text();
}

export function epaYears() {
  return fetchText(`${EPA}/menu/year`).then(menuItems);
}

export function epaMakes(year: number) {
  return fetchText(`${EPA}/menu/make?year=${year}`).then(menuItems);
}

export function epaModels(year: number, make: string) {
  const q = new URLSearchParams({ year: String(year), make });
  return fetchText(`${EPA}/menu/model?${q}`).then(menuItems);
}

export function epaOptions(year: number, make: string, model: string) {
  const q = new URLSearchParams({ year: String(year), make, model });
  return fetchText(`${EPA}/menu/options?${q}`).then(menuItems);
}

export function epaVehicleXml(sourceId: string) {
  return fetchText(`${EPA}/${encodeURIComponent(sourceId)}`);
}

export type NhtsaDecode = {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  series: string | null;
  displacement: number | null;
  cylinders: number | null;
  fuel: string | null;
  drive: string | null;
  transmission: string | null;
  body: string | null;
  induction: string | null;
};

export async function decodeNhtsa(vin: string): Promise<NhtsaDecode> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`,
    { headers: { Accept: "application/json", "User-Agent": "OEM.autos/1.0" }, signal: AbortSignal.timeout(12_000) },
  );
  if (!res.ok) throw new Error(`vin source ${res.status}`);
  const json = (await res.json()) as {
    Results?: { Variable?: string; Value?: string | null }[];
  };
  const bag = new Map<string, string>();
  for (const row of json.Results ?? []) {
    const value = row.Value?.trim();
    if (!row.Variable || !value || value === "null" || value === "Not Applicable") continue;
    bag.set(row.Variable, value);
  }
  const year = Number(bag.get("Model Year"));
  const make = bag.get("Make");
  const model = bag.get("Model");
  if (!year || !make || !model) throw new Error("That VIN did not resolve to a vehicle.");
  const displacement = Number(bag.get("Displacement (L)"));
  const cylinders = Number(bag.get("Engine Number of Cylinders"));
  const turbo = bag.get("Turbo") ?? bag.get("Engine Model") ?? "";
  return {
    year,
    make,
    model,
    trim: bag.get("Trim") ?? null,
    series: bag.get("Series") ?? null,
    displacement: Number.isFinite(displacement) ? displacement : null,
    cylinders: Number.isFinite(cylinders) ? cylinders : null,
    fuel: bag.get("Fuel Type - Primary") ?? null,
    drive: bag.get("Drive Type") ?? null,
    transmission: bag.get("Transmission Style") ?? null,
    body: bag.get("Body Class") ?? null,
    induction: /turbo/i.test(turbo) ? "Turbo" : /supercharg/i.test(turbo) ? "Supercharged" : null,
  };
}
