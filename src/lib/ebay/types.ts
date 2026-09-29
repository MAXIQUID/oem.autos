export type EbayHit = {
  itemId: string;
  title: string;
  priceCents: number | null;
  currency: string;
  condition: string | null;
  image: string | null;
  url: string;
  seller: string | null;
  feedback: string | null;
  location: string | null;
  shippingCents: number | null;
  buying: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type EbaySearchResult = {
  items: EbayHit[];
  total: number;
  error: string | null;
};

export type EbayAspect = { name: string; value: string };

export type EbayItem = EbayHit & {
  images: string[];
  description: string | null;
  aspects: EbayAspect[];
};
