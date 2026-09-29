import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vin-sitemap/$page")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const page = params.page;
        if (!/^\d+$/.test(page)) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 301,
          headers: { location: `https://oem.autos/vin-sitemap-${page}.xml` },
        });
      },
    },
  },
});
