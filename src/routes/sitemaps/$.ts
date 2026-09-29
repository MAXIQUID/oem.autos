import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemaps/$")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const match = /^vin-(\d+)\.xml$/.exec(params._splat ?? "");
        if (!match) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 301,
          headers: { location: `https://oem.autos/vin-sitemap-${match[1]}.xml` },
        });
      },
    },
  },
});
