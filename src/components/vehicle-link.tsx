import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { isIndexableVin } from "@/lib/vin";

export function VehicleLink({
  lot,
  vin,
  className,
  children,
}: {
  lot: number;
  vin: string;
  className?: string;
  children: ReactNode;
}) {
  if (isIndexableVin(vin)) {
    return (
      <Link to="/vin/$vin" params={{ vin }} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/lot/$lot" params={{ lot: String(lot) }} className={className}>
      {children}
    </Link>
  );
}
