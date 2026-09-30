import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { searchVehicles } from "@/lib/copart/queries";

export const Route = createFileRoute("/makes")({
  loader: async () => {
    const feed = await searchVehicles({ data: {} });
    return { total: feed.total, makes: feed.facets.make };
  },
  head: () => ({
    meta: [
      { title: "Vehicle makes | OEM.autos" },
      {
        name: "description",
        content: "Automobile makes on the current US salvage sale sheet, with a count for each.",
      },
    ],
    links: [{ rel: "canonical", href: "https://oem.autos/makes" }],
  }),
  component: MakesPage,
});

function MakesPage() {
  const { total, makes } = Route.useLoaderData();
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-6xl px-4 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight">Vehicle makes</h1>
        <p className="mt-3 text-muted">
          <span className="tabular-nums">{total.toLocaleString("en-US")}</span> automobiles on the
          current sale sheet. Motorcycles are not in this index.
        </p>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-2 lg:grid-cols-3">
          {makes.map((make) => (
            <li key={make.id} className="bg-surface">
              <Link
                to="/vehicles"
                search={{ make: make.id }}
                className="flex items-baseline justify-between gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <span className="font-medium">{make.label}</span>
                <span className="tabular-nums text-sm text-muted">{make.count.toLocaleString("en-US")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </PageShell>
  );
}
