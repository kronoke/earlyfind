import { supabaseRest } from './supabase-rest';

const USER_AGENT = 'EarlyFindBot/0.1 (+https://earlyfinds.store; discovery crawler)';

type ShopifyProduct = {
  id?: number | string;
  title?: string;
  handle?: string;
  variants?: Array<{ price?: string }>;
  images?: Array<{ src?: string }>;
  image?: { src?: string };
};

type ShopifyProductsResponse = { products?: ShopifyProduct[] };

export type DiscoveryCandidate = {
  domain: string;
  source?: string;
  country?: string;
  firstDetectedAt?: string;
  lastDetectedAt?: string;
  metadata?: Record<string, unknown>;
  spend?: number;
  sku?: number;
  revenue?: number;
};

export type VerifiedStore = {
  domain: string;
  name: string;
  homepageUrl: string;
  description?: string;
  logoUrl?: string;
  shopifyVerified: boolean;
  products: Array<{
    external_id?: string;
    handle?: string;
    title: string;
    price?: number;
    image_url?: string;
    product_url: string;
    raw: ShopifyProduct;
  }>;
  score: number;
};

function normalizeDomain(input: string) {
  const raw = input.trim().toLowerCase();
  const value = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  const url = new URL(value);
  return url.hostname.replace(/^www\./, '');
}

function absoluteUrl(value: string | undefined, base: string) {
  if (!value) return undefined;
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function extractMeta(html: string, base: string) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  const image = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  return {
    name: (ogTitle || title || new URL(base).hostname).replace(/\s*[|–—-]\s*.*$/, '').trim(),
    description: description?.trim(),
    logoUrl: absoluteUrl(image, base),
  };
}

function hasShopifyFingerprint(html: string) {
  return [
    'cdn.shopify.com',
    'Shopify.theme',
    'shopify-section',
    'myshopify.com',
    'shopify-payment-button',
    'Shopify.routes',
  ].some((fingerprint) => html.includes(fingerprint));
}

async function fetchText(url: string, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyShopifyStore(input: string): Promise<VerifiedStore | null> {
  let domain: string;
  try {
    domain = normalizeDomain(input);
  } catch {
    return null;
  }

  const homepageUrl = `https://${domain}`;

  let homepage: Response;
  try {
    homepage = await fetchText(homepageUrl);
  } catch {
    return null;
  }
  if (!homepage.ok || !homepage.headers.get('content-type')?.includes('text/html')) return null;

  const html = (await homepage.text()).slice(0, 1_500_000);
  if (!hasShopifyFingerprint(html)) return null;

  const meta = extractMeta(html, homepage.url || homepageUrl);
  let products: VerifiedStore['products'] = [];

  try {
    const response = await fetch(`${homepage.url.replace(/\/$/, '')}/products.json?limit=12`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      redirect: 'follow',
      cache: 'no-store',
    });
    if (response.ok && response.headers.get('content-type')?.includes('json')) {
      const payload = (await response.json()) as ShopifyProductsResponse;
      products = (payload.products ?? []).flatMap((product) => {
        if (!product.title || !product.handle) return [];
        const priceRaw = product.variants?.[0]?.price;
        const price = priceRaw ? Number(priceRaw) : undefined;
        return [{
          external_id: product.id != null ? String(product.id) : undefined,
          handle: product.handle,
          title: product.title,
          price: Number.isFinite(price) ? price : undefined,
          image_url: product.image?.src ?? product.images?.[0]?.src,
          product_url: `${homepage.url.replace(/\/$/, '')}/products/${product.handle}`,
          raw: product,
        }];
      });
    }
  } catch {
    // Product JSON is optional; a verified storefront can still be reviewed without it.
  }

  let score = 55;
  if (products.length >= 3) score += 15;
  if (meta.description) score += 10;
  if (meta.logoUrl) score += 5;
  if (products.some((product) => product.image_url)) score += 10;
  if (products.some((product) => product.price != null)) score += 5;

  return {
    domain,
    name: meta.name,
    homepageUrl: homepage.url || homepageUrl,
    description: meta.description,
    logoUrl: meta.logoUrl,
    shopifyVerified: true,
    products,
    score: Math.min(score, 100),
  };
}

export async function persistCandidate(candidate: DiscoveryCandidate, verified: VerifiedStore) {
  const now = new Date().toISOString();
  const source = candidate.source || 'manual';
  const storeRows = await supabaseRest<Array<{ id: string }>>('stores?on_conflict=domain', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify({
      domain: verified.domain,
      name: verified.name,
      platform: 'shopify',
      homepage_url: verified.homepageUrl,
      logo_url: verified.logoUrl ?? null,
      description: verified.description ?? null,
      country: candidate.country ?? null,
      source,
      source_first_detected_at: candidate.firstDetectedAt ?? null,
      estimated_launch_at: candidate.firstDetectedAt ?? now,
      last_seen_at: now,
      discovery_score: verified.score,
      shopify_verified: true,
      raw_meta: {
        source,
        ...(candidate.metadata ?? {}),
        ...(source === 'builtwith'
          ? {
              builtwith: {
                spend: candidate.spend,
                sku: candidate.sku,
                revenue: candidate.revenue,
                lastDetectedAt: candidate.lastDetectedAt,
              },
            }
          : {}),
      },
    }),
  });

  const storeId = storeRows[0]?.id;
  if (!storeId) throw new Error(`No store id returned for ${verified.domain}`);

  if (verified.products.length) {
    await supabaseRest('products?on_conflict=store_id,product_url', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify(verified.products.map((product) => ({
        store_id: storeId,
        external_id: product.external_id ?? null,
        handle: product.handle ?? null,
        title: product.title,
        price: product.price ?? null,
        image_url: product.image_url ?? null,
        product_url: product.product_url,
        last_seen_at: now,
        active: true,
        raw: product.raw,
      }))),
    });
  }

  return { storeId, productCount: verified.products.length };
}
