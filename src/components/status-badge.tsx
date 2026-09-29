import { Badge } from "@/components/ui/badge";
import type { InventoryStatus } from "@/lib/oem/types";

const LABELS: Record<InventoryStatus, string> = {
  listed: "Listed",
  in_vehicle: "In donor",
  sold: "Sold",
};

const TONES: Record<InventoryStatus, "listed" | "hold" | "sold"> = {
  listed: "listed",
  in_vehicle: "hold",
  sold: "sold",
};

export function StatusBadge({ status }: { status: InventoryStatus }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}

export function GradeBadge({ grade }: { grade: string }) {
  return <Badge tone="grade">Grade {grade}</Badge>;
}
