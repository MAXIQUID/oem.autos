import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import {
  InventoryVehicle,
  vehicleDescription,
  vehicleTitle,
  vehicleUrl,
} from "@/components/inventory-vehicle";
import { getSaleVin } from "@/lib/copart/queries";
import { isIndexableVin } from "@/lib/vin";

export const Route = createFileRoute("/vin/$vin")({
  loader: ({ params }) => getSaleVin({ data: { vin: params.vin } }),
  head: ({ loaderData, params }) => {
    const lot = loaderData?.lot;
    if (!lot || !isIndexableVin(lot.vin)) {
      return {
        meta: [
          { title: "VIN not on this sheet | OEM.autos" },
          { name: "robots", content: "noindex, follow" },
        ],
      };
    }
    const title = vehicleTitle(lot);
    const description = vehicleDescription(lot);
    const url = vehicleUrl(lot.vin);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        ...(lot.photo || lot.thumb ? [{ property: "og:image", content: lot.photo || lot.thumb }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: VinPage,
});

function VinPage() {
  const { lot } = Route.useLoaderData();
  if (!lot || !isIndexableVin(lot.vin)) {
    return (
      <PageShell>
        <main className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="font-display text-3xl font-semibold">VIN not on this sheet</h1>
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
