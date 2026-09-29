import type { EbayAspect, EbayHit, EbayItem, EbaySearchResult } from "./types";

const CLIENT_ID = process.env.EBAY_CLIENT_ID?.trim() ?? "";
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET?.trim() ?? "";

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const ITEM_URL = "https://api.ebay.com/buy/browse/v1/item";
const SCOPE = "https://api.ebay.com/oauth/api_scope";
const MARKETPLACE = "EBAY_US";
const PARTS_CATEGORY = "6030";
const TTL_MS = 10 * 60 * 1000;

type TokenSlot = { token: string; expiresAt: number };
type CacheSlot = { at: number; value: EbaySearchResult };

const g = globalThis as typeof globalThis & {
  __ebayToken?: TokenSlot;
  __ebaySearch?: Map<string, CacheSlot>;
};

function dollarsToCents(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function phrase(q: string): string {
  const t = q.trim();
  if (/\s/.test(t) || !/\d/.test(t)) return t;
  return `"${t.replaceAll('"', "")}"`;
}

async function accessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("eBay credentials are not configured");
  const now = Date.now();
  if (g.__ebayToken && g.__ebayToken.expiresAt > now + 60_000) return g.__ebayToken.token;
  const body = new URLSearchParams({ grant_type: "client_credentials", scope: SCOPE });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`eBay auth failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("eBay auth returned no token");
  g.__ebayToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 7200) * 1000,
  };
  return json.access_token;
}

type RawSummary = {
  itemId?: string;
  title?: string;
  condition?: string;
  itemWebUrl?: string;
  price?: { value?: string; currency?: string };
  image?: { imageUrl?: string };
  seller?: { username?: string; feedbackPercentage?: string };
  buyingOptions?: string[];
  itemLocation?: { city?: string; stateOrProvince?: string; country?: string };
  shippingOptions?: { shippingCost?: { value?: string } }[];
  categories?: { categoryId?: string; categoryName?: string }[];
  leafCategoryIds?: string[];
};

const PARENT_CATEGORIES = new Set(["6000", "6028", PARTS_CATEGORY]);

function pickCategory(raw: RawSummary): { categoryId: string | null; categoryName: string | null } {
  const cats = raw.categories ?? [];
  const leafId = raw.leafCategoryIds?.[0];
  const leaf = leafId ? cats.find((cat) => cat.categoryId === leafId) : undefined;
  if (leaf?.categoryId) return { categoryId: leaf.categoryId, categoryName: leaf.categoryName ?? null };
  const specific = cats.find((cat) => cat.categoryId && !PARENT_CATEGORIES.has(cat.categoryId));
  return {
    categoryId: specific?.categoryId ?? leafId ?? null,
    categoryName: specific?.categoryName ?? null,
  };
}

function mapHit(raw: RawSummary): EbayHit | null {
  if (!raw.itemId || !raw.title || !raw.itemWebUrl) return null;
  const loc = [raw.itemLocation?.city, raw.itemLocation?.stateOrProvince]
    .filter(Boolean)
    .join(", ");
  return {
    itemId: raw.itemId,
    title: raw.title,
    priceCents: dollarsToCents(raw.price?.value),
    currency: raw.price?.currency ?? "USD",
    condition: raw.condition ?? null,
    image: raw.image?.imageUrl ?? null,
    url: raw.itemWebUrl,
    seller: raw.seller?.username ?? null,
    feedback: raw.seller?.feedbackPercentage ?? null,
    location: loc || null,
    shippingCents: dollarsToCents(raw.shippingOptions?.[0]?.shippingCost?.value),
    buying: raw.buyingOptions?.[0]?.replaceAll("_", " ").toLowerCase() ?? null,
    ...pickCategory(raw),
  };
}

async function browse(
  q: string,
  category?: string,
  extra?: {
    limit?: number;
    offset?: number;
    compatibility?: string;
    filter?: string;
    sort?: string;
    aspectFilter?: string;
  },
): Promise<{ items: EbayHit[]; total: number }> {
  const token = await accessToken();
  const params = new URLSearchParams({ q, limit: String(extra?.limit ?? 24) });
  if (category) params.set("category_ids", category);
  if (extra?.offset) params.set("offset", String(extra.offset));
  if (extra?.compatibility) params.set("compatibility_filter", extra.compatibility);
  if (extra?.filter) params.set("filter", extra.filter);
  if (extra?.sort) params.set("sort", extra.sort);
  if (extra?.aspectFilter) params.set("aspect_filter", extra.aspectFilter);
  const res = await fetch(`${SEARCH_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`eBay search failed (${res.status})`);
  const json = (await res.json()) as { total?: number; itemSummaries?: RawSummary[] };
  const items = (json.itemSummaries ?? []).map(mapHit).filter((x): x is EbayHit => x != null);
  return { items, total: Number(json.total ?? items.length) };
}

export function browseCompatible(input: {
  q: string;
  category?: string;
  limit?: number;
  offset?: number;
  compatibility?: string;
  filter?: string;
  sort?: string;
  aspectFilter?: string;
}) {
  return browse(input.q, input.category, {
    limit: input.limit,
    offset: input.offset,
    compatibility: input.compatibility,
    filter: input.filter,
    sort: input.sort,
    aspectFilter: input.aspectFilter,
  });
}

const empty: EbaySearchResult = { items: [], total: 0, error: null };

export async function searchEbayParts(query: string): Promise<EbaySearchResult> {
  const q = query.trim();
  if (!q) return empty;
  g.__ebaySearch ??= new Map();
  const key = q.toLowerCase();
  const hit = g.__ebaySearch.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  try {
    const phrased = phrase(q);
    let result = await browse(phrased, PARTS_CATEGORY);
    if (result.total === 0) result = await browse(phrased);
    const value: EbaySearchResult = { ...result, error: null };
    g.__ebaySearch.set(key, { at: Date.now(), value });
    return value;
  } catch (err) {
    const message = err instanceof Error ? err.message : "eBay search failed";
    return { items: [], total: 0, error: message };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

export function isEbayItemId(id: string): boolean {
  return /^v1\|\d+\|\d+$/.test(id);
}

export async function getEbayItem(itemId: string): Promise<EbayItem | null> {
  if (!isEbayItemId(itemId)) return null;
  const token = await accessToken();
  const res = await fetch(`${ITEM_URL}/${encodeURIComponent(itemId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": MARKETPLACE,
    },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`eBay item failed (${res.status})`);
  const raw = (await res.json()) as RawSummary & {
    description?: string;
    shortDescription?: string;
    additionalImages?: { imageUrl?: string }[];
    localizedAspects?: { name?: string; value?: string }[];
  };
  const base = mapHit(raw);
  if (!base) return null;
  const images = [
    raw.image?.imageUrl,
    ...(raw.additionalImages ?? []).map((i) => i.imageUrl),
  ].filter((u): u is string => Boolean(u));
  const aspects: EbayAspect[] = (raw.localizedAspects ?? [])
    .filter((a) => a.name && a.value)
    .slice(0, 16)
    .map((a) => ({ name: a.name as string, value: a.value as string }));
  const description = raw.shortDescription
    ? stripHtml(raw.shortDescription)
    : raw.description
      ? stripHtml(raw.description)
      : null;
  return { ...base, images, description, aspects };
}
