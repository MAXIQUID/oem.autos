import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/vehicles", label: "Vehicles" },
  { to: "/decoder", label: "VIN decoder" },
  { to: "/makes", label: "Makes" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/faq", label: "FAQ" },
  { to: "/about", label: "About" },
] as const;

export function SiteNav() {
  return (
    <nav className="flex gap-4 overflow-x-auto text-sm text-muted" aria-label="Site">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="shrink-0 hover:text-fg"
          activeProps={{ className: "shrink-0 text-fg" }}
          activeOptions={{ exact: link.to === "/vehicles" }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
