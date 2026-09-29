import { createFileRoute } from "@tanstack/react-router";
import { vinSitemap } from "@/lib/copart/feed.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const page = await vinSitemap(1);
        const pages = page?.pages ?? 1;
        const lastmod = (page?.updated ?? new Date().toISOString()).slice(0, 10);
        const body = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...Array.from({ length: pages }, (_, i) => {
            const n = i + 1;
            return `<sitemap><loc>https://oem.autos/vin-sitemap/${n}</loc><lastmod>${lastmod}</lastmod></sitemap>`;
          }),
          `</sitemapindex>`,
        ].join("");
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
