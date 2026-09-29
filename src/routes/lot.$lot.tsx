import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { InventoryVehicle } from "@/components/inventory-vehicle";
import { PageShell } from "@/components/page-shell";
import { getSaleLot } from "@/lib/copart/queries";
import { isIndexableVin } from "@/lib/vin";

export const Route = createFileRoute("/lot/$lot")({
  loader: async ({ params }) => {
    const data = await getSaleLot({ data: { lot: params.lot } });
    if (data.lot && isIndexableVin(data.lot.vin)) {
      throw redirect({ to: "/vin/$vin", params: { vin: data.lot.vin }, statusCode: 301 });
    }
    return data;
  },
  head: () => ({
    meta: [
      { title: "Vehicle | OEM.autos" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: SaleLotPage,
});

function SaleLotPage() {
  const { lot } = Route.useLoaderData();
  if (!lot) {
    return (
      <PageShell>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold">Vehicle not on this sheet</h1>
          <Link to="/vehicles" className="mt-6 inline-block text-sm text-muted hover:text-fg">
            Browse vehicles
          </Link>
        </main>
      </PageShell>
    );
  }
  return (
    <PageShell>
      <InventoryVehicle lot={lot} />
    </PageShell>
  );
}
