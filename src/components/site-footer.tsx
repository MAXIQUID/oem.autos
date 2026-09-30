import { SiteNav } from "@/components/site-nav";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted">
        <p>
          <span className="font-display text-lg font-semibold tracking-tight text-fg">OEM.autos</span>
          <span className="mt-1 block">Search OEM parts and salvage cars. Version 1.1.5.</span>
        </p>
        <SiteNav />
      </div>
    </footer>
  );
}
