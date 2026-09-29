import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
        <Link to="/vehicles" className="leading-none">
          <span className="font-display text-xl font-semibold tracking-tight text-fg">OEM</span>
          <span className="font-display text-xl font-medium tracking-tight text-muted">.autos</span>
        </Link>
      </div>
    </header>
  );
}
