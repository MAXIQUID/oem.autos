import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-lg font-semibold tracking-tight text-fg">OEM.autos</span>
          <span className="mt-1 block">E-commerce for used OEM parts, from US salvage yards.</span>
        </p>
        <nav className="flex gap-4">
          <Link to="/vehicles" className="hover:text-fg">
            Vehicles
          </Link>
          <Link to="/about" className="hover:text-fg">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
