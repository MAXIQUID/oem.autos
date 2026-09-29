import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatMiles(n: number): string {
  return `${new Intl.NumberFormat("en-US").format(n)} mi`;
}

export function formatVin(vin: string): string {
  const v = vin.toUpperCase();
  if (v.length !== 17) return v;
  return `${v.slice(0, 3)} ${v.slice(3, 9)} ${v.slice(9)}`;
}
