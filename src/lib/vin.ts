/** ISO-3779 VIN decode: check digit, model year, WMI make. Pure — safe on client. */

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const YEAR_CODES: Record<string, number[]> = {
  A: [1980, 2010], B: [1981, 2011], C: [1982, 2012], D: [1983, 2013],
  E: [1984, 2014], F: [1985, 2015], G: [1986, 2016], H: [1987, 2017],
  J: [1988, 2018], K: [1989, 2019], L: [1990, 2020], M: [1991, 2021],
  N: [1992, 2022], P: [1993, 2023], R: [1994, 2024], S: [1995, 2025],
  T: [1996, 2026], V: [1997, 2027], W: [1998, 2028], X: [1999, 2029],
  Y: [2000, 2030], "1": [2001, 2031], "2": [2002, 2032], "3": [2003, 2033],
  "4": [2004, 2034], "5": [2005, 2035], "6": [2006, 2036], "7": [2007, 2037],
  "8": [2008, 2038], "9": [2009, 2039],
};

type WmiEntry = { make: string; country: string; note?: string };

const WMI: Record<string, WmiEntry> = {
  "1FA": { make: "Ford", country: "USA" },
  "1FB": { make: "Ford", country: "USA" },
  "1FM": { make: "Ford", country: "USA" },
  "1FT": { make: "Ford", country: "USA", note: "truck" },
  "1GC": { make: "Chevrolet", country: "USA", note: "truck" },
  "1G1": { make: "Chevrolet", country: "USA" },
  "1G6": { make: "Cadillac", country: "USA" },
  "1HG": { make: "Honda", country: "USA" },
  "19X": { make: "Honda", country: "USA" },
  "2HG": { make: "Honda", country: "Canada" },
  "2HJ": { make: "Honda", country: "Canada" },
  "3HG": { make: "Honda", country: "Mexico" },
  JHM: { make: "Honda", country: "Japan" },
  "4T1": { make: "Toyota", country: "USA" },
  "4T3": { make: "Toyota", country: "USA" },
  "4T4": { make: "Toyota", country: "USA" },
  "5TD": { make: "Toyota", country: "USA" },
  JT2: { make: "Toyota", country: "Japan" },
  JT3: { make: "Toyota", country: "Japan" },
  JTD: { make: "Toyota", country: "Japan" },
  JTE: { make: "Toyota", country: "Japan" },
  JF1: { make: "Subaru", country: "Japan" },
  JF2: { make: "Subaru", country: "Japan" },
  "4S3": { make: "Subaru", country: "USA" },
  "4S4": { make: "Subaru", country: "USA" },
  WBA: { make: "BMW", country: "Germany" },
  WBS: { make: "BMW M", country: "Germany" },
  WBY: { make: "BMW i", country: "Germany" },
  "3MW": { make: "BMW", country: "Mexico" },
  "4US": { make: "BMW", country: "USA" },
  "5UX": { make: "BMW", country: "USA" },
  WDD: { make: "Mercedes-Benz", country: "Germany" },
  W1K: { make: "Mercedes-Benz", country: "Germany" },
  WAU: { make: "Audi", country: "Germany" },
  WA1: { make: "Audi", country: "Germany" },
  "1C4": { make: "Chrysler", country: "USA" },
  "1C6": { make: "Ram", country: "USA" },
  "1N4": { make: "Nissan", country: "USA" },
  JN1: { make: "Nissan", country: "Japan" },
  JN8: { make: "Nissan", country: "Japan" },
  KM8: { make: "Hyundai", country: "South Korea" },
  "5NP": { make: "Hyundai", country: "USA" },
  KNA: { make: "Kia", country: "South Korea" },
  "5XY": { make: "Kia", country: "USA" },
  SAL: { make: "Land Rover", country: "UK" },
  SAJ: { make: "Jaguar", country: "UK" },
  "1VW": { make: "Volkswagen", country: "USA" },
  WVW: { make: "Volkswagen", country: "Germany" },
  "3VW": { make: "Volkswagen", country: "Mexico" },
  YV1: { make: "Volvo", country: "Sweden" },
  "1GT": { make: "GMC", country: "USA", note: "truck" },
  "3FA": { make: "Ford", country: "Mexico" },
  "5YJ": { make: "Tesla", country: "USA" },
  "7SA": { make: "Tesla", country: "USA" },
};

export type VinDecode = {
  raw: string;
  vin: string;
  validLength: boolean;
  checkDigit: string | null;
  checkDigitOk: boolean | null;
  year: number | null;
  wmi: string;
  vds: string;
  vis: string;
  plant: string;
  serial: string;
  make: string | null;
  country: string | null;
  wmiNote: string | null;
};

export function normalizeVin(input: string): string {
  return input.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
}

export function computeCheckDigit(vin: string): string | null {
  if (vin.length !== 17) return null;
  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    if (i === 8) continue;
    const n = TRANSLITERATION[vin[i] ?? ""];
    if (n == null) return null;
    sum += n * (WEIGHTS[i] ?? 0);
  }
  const mod = sum % 11;
  return mod === 10 ? "X" : String(mod);
}

export function yearFromCode(code: string): number | null {
  const years = YEAR_CODES[code];
  if (!years) return null;
  return years[1] ?? years[0] ?? null;
}

export function decodeVin(input: string): VinDecode {
  const vin = normalizeVin(input);
  const validLength = vin.length === 17;
  const checkDigit = validLength ? (vin[8] ?? null) : null;
  const expected = validLength ? computeCheckDigit(vin) : null;
  const checkDigitOk =
    validLength && expected != null ? checkDigit === expected : null;
  const wmi = vin.slice(0, 3);
  const wmiInfo = wmi.length === 3 ? (WMI[wmi] ?? null) : null;
  const year = vin.length >= 10 ? yearFromCode(vin[9] ?? "") : null;

  return {
    raw: input,
    vin,
    validLength,
    checkDigit,
    checkDigitOk,
    year,
    wmi,
    vds: vin.slice(3, 9),
    vis: vin.slice(9),
    plant: vin[10] ?? "",
    serial: vin.slice(11),
    make: wmiInfo?.make ?? null,
    country: wmiInfo?.country ?? null,
    wmiNote: wmiInfo?.note ?? null,
  };
}

/** If the typed VIN misses only the check digit, return the corrected 17. */
export function withCorrectedCheckDigit(vin: string): string | null {
  const n = normalizeVin(vin);
  if (n.length !== 17) return null;
  const digit = computeCheckDigit(n);
  if (!digit) return null;
  return n.slice(0, 8) + digit + n.slice(9);
}
