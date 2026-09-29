import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { FinderBar } from "@/components/finder-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <a
        href="#content"
        className="absolute left-4 top-3 z-50 -translate-y-24 rounded-md bg-paper px-3 py-2 text-sm font-medium text-ink focus:translate-y-0"
      >
        Skip to results
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 lg:min-h-chrome lg:flex-row lg:items-center lg:gap-6 lg:py-2">
          <div className="flex items-center justify-between gap-3">
            <SiteHeader />
            <AccountSlot />
          </div>
          <div className="min-w-0 flex-1">
            <FinderBar />
          </div>
        </div>
      </header>
      <div id="content" className="flex-1">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}

function AccountSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-8 w-20 animate-pulse rounded-md bg-surface-2" aria-hidden />;
  if (user) return <UserButton />;
  return (
    <Link
      to="/login"
      className="inline-flex h-10 shrink-0 items-center rounded-md bg-paper px-3 text-sm font-medium text-ink hover:bg-accent"
    >
      Sign in
    </Link>
  );
}
