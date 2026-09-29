import { createReadStream, createWriteStream, existsSync, readdirSync, rmSync } from "node:fs";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const SITE = "https://oem.autos";
const CHUNK = 10_000;
const OUT_DIR = "public";
const INDEX_PATH = "public/sitemap.xml";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

async function csvPath() {
  if (process.env.SITEMAP_CSV && existsSync(process.env.SITEMAP_CSV)) return process.env.SITEMAP_CSV;
  const url = process.env.COPART_FEED_URL?.trim();
  if (!url) return null;
  const dest = "/tmp/copart-sales.csv";
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok || !res.body) throw new Error(`Copart feed failed (${res.status})`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}

async function vinsFrom(path) {
  const vins = [];
  const seen = new Set();
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let header = null;
  let typeCol = 0;
  let yearCol = 0;
  let makeCol = 0;
  let vinCol = 0;
  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line).map((cell) => cell.trim());
      typeCol = header.indexOf("Vehicle Type");
      yearCol = header.indexOf("Year");
      makeCol = header.indexOf("Make");
      vinCol = header.indexOf("VIN");
      if (vinCol < 0) throw new Error("Copart feed has no VIN column");
      continue;
    }
    if (!line) continue;
    const row = parseCsvLine(line);
    if (row[typeCol] !== "V") continue;
    const year = Number(row[yearCol]);
    if (!year || year < 1985 || !row[makeCol]?.trim()) continue;
    const vin = (row[vinCol] ?? "").trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin) || seen.has(vin)) continue;
    seen.add(vin);
    vins.push(vin);
  }
  return vins;
}

function writeChunk(page, vins) {
  const file = createWriteStream(`${OUT_DIR}/vin-sitemap-${page}.xml`);
  file.write('<?xml version="1.0" encoding="UTF-8"?>\n');
  file.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
  for (const vin of vins) file.write(`<url><loc>${SITE}/vin/${vin}</loc></url>\n`);
  file.write("</urlset>\n");
  return new Promise((resolve, reject) => {
    file.end(() => resolve());
    file.on("error", reject);
  });
}

const path = await csvPath();
if (!path) {
  console.warn("write-sitemaps: COPART_FEED_URL unset, keeping existing sitemap files");
  process.exit(0);
}

const vins = await vinsFrom(path);
if (!vins.length) throw new Error("write-sitemaps: feed had no VINs");

rmSync(OUT_DIR + "/sitemaps", { recursive: true, force: true });
for (const name of readdirSync(OUT_DIR)) {
  if (/^vin-sitemap-\d+\.xml$/.test(name)) rmSync(`${OUT_DIR}/${name}`);
}
const pages = Math.ceil(vins.length / CHUNK);
for (let page = 1; page <= pages; page += 1) {
  const slice = vins.slice((page - 1) * CHUNK, page * CHUNK);
  await writeChunk(page, slice);
}

const index = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Array.from({ length: pages }, (_, i) => `<sitemap><loc>${SITE}/vin-sitemap-${i + 1}.xml</loc></sitemap>`),
  "</sitemapindex>",
  "",
].join("\n");
await new Promise((resolve, reject) => {
  const file = createWriteStream(INDEX_PATH);
  file.on("error", reject);
  file.end(index, () => resolve());
});
console.log(`write-sitemaps: ${vins.length} VINs in ${pages} files`);
