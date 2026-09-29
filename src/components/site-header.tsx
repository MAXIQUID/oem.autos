import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <Link to="/vehicles" className="shrink-0 leading-none">
      <span className="font-display text-2xl font-semibold tracking-tight text-fg">OEM</span>
      <span className="font-display text-2xl font-medium tracking-tight text-muted">.autos</span>
    </Link>
  );
}
