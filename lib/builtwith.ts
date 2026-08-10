export type BuiltWithCandidate = {
  domain: string;
  firstDetectedAt?: string;
  lastDetectedAt?: string;
  spend?: number;
  sku?: number;
  revenue?: number;
  country?: string;
};

type BuiltWithResult = {
  D?: string;
  FD?: number;
  LD?: number;
  S?: number;
  SKU?: number;
  R?: number;
  Country?: string;
};

type BuiltWithResponse = {
  Results?: BuiltWithResult[];
  NextOffset?: string;
};

function epochToIso(value?: number) {
  return value ? new Date(value * 1000).toISOString() : undefined;
}

export async function getRecentShopifyCandidates(days = 7, limit = 100): Promise<BuiltWithCandidate[]> {
  const key = process.env.BUILTWITH_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    KEY: key,
    TECH: 'Shopify',
    SINCE: `${days} Days Ago`,
    META: 'yes',
  });

  const response = await fetch(`https://api.builtwith.com/lists12/api.json?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`BuiltWith ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as BuiltWithResponse;
  return (data.Results ?? [])
    .filter((item): item is BuiltWithResult & { D: string } => Boolean(item.D))
    .slice(0, Math.max(1, Math.min(limit, 250)))
    .map((item) => ({
      domain: item.D,
      firstDetectedAt: epochToIso(item.FD),
      lastDetectedAt: epochToIso(item.LD),
      spend: item.S,
      sku: item.SKU,
      revenue: item.R,
      country: item.Country,
    }));
}
