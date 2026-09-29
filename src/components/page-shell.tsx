import type { ReactNode } from "react";
import { FinderBar } from "@/components/finder-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <SiteHeader />
      <FinderBar />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
