import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/lib/oem/types";
import { formatMiles, formatVin } from "@/lib/utils";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      to="/vin/$vin"
      params={{ vin: vehicle.vin }}
      className="group overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-2">
        <img
          src={vehicle.photo}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="media h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2">
          <Badge tone="paper">{vehicle.title_status}</Badge>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-widest text-subtle">
          {vehicle.yard_city}, {vehicle.yard_state}
        </p>
        <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight text-fg">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-muted">{vehicle.trim}</p>
        <p className="font-mono text-xs tracking-wider text-subtle">{formatVin(vehicle.vin)}</p>
        <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted">
          <span className="tabular-nums">{formatMiles(vehicle.mileage)}</span>
          <span>{vehicle.listed_count} listed</span>
          <span>{vehicle.in_vehicle_count} still in donor</span>
        </div>
      </div>
    </Link>
  );
}
