import type { InventoryItem } from "./types";

export function listingImage(item: {
  photo: string | null;
  part_photo?: string | null;
  vehicle_photo?: string;
}): string {
  return item.photo || item.part_photo || item.vehicle_photo || "/images/yard-hero.jpg";
}

export function ymm(item: Pick<InventoryItem, "vehicle_year" | "vehicle_make" | "vehicle_model">): string {
  return `${item.vehicle_year} ${item.vehicle_make} ${item.vehicle_model}`;
}
