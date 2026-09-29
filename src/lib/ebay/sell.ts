/** Numeric eBay item id used by Sell Similar. Browse ids look like v1|123|0. */
export function sellItemId(itemId: string, legacy?: string | null): string | null {
  const direct = legacy?.trim();
  if (direct && /^\d+$/.test(direct)) return direct;
  const fromBrowse = /^v1\|(\d+)\|\d+$/.exec(itemId);
  if (fromBrowse?.[1]) return fromBrowse[1];
  return /^\d+$/.test(itemId) ? itemId : null;
}

/** Opens eBay's listing form prefilled from an existing item. Nothing is published here. */
export function sellSimilarUrl(itemId: string): string {
  return `https://www.ebay.com/sl/list?mode=SellLikeItem&itemId=${itemId}`;
}
