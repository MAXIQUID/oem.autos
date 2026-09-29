import { createFileRoute } from "@tanstack/react-router";
import { vinSitemap } from "@/lib/copart/feed.server";

export const Route = createFileRoute("/vin-sitemap/$page")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const page = Number(params.page);
        const chunk = await vinSitemap(page);
        if (!chunk) return new Response("Not found", { status: 404 });
        const lastmod = chunk.updated.slice(0, 10);
        const urls = chunk.vins
          .map(
            (vin) =>
              `<url><loc>https://oem.autos/vin/${vin}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq></url>`,
          )
          .join("");
        const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
