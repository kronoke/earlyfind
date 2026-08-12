const USER_AGENT = 'EarlyFindBot/0.3 (+https://earlyfinds.site; verification diagnostics)';

export type CandidateDiagnostic = {
  domain: string;
  ok: boolean;
  reason: string;
  resolvedDomain?: string;
};

async function timedFetch(url: string, accept: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: accept },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function hasShopifyFingerprint(html: string) {
  const lower = html.toLowerCase();
  return [
    'cdn.shopify.com',
    'shopify.theme',
    'shopify-section',
    'myshopify.com',
    'shopify-payment-button',
    'shopify.routes',
  ].some((fingerprint) => lower.includes(fingerprint));
}

export async function diagnoseCandidate(domain: string): Promise<CandidateDiagnostic> {
  let homepage: Response;
  try {
    homepage = await timedFetch(`https://${domain}`, 'text/html,application/xhtml+xml');
  } catch (error) {
    return {
      domain,
      ok: false,
      reason: error instanceof Error && error.name === 'AbortError' ? 'homepage_timeout' : 'homepage_unreachable',
    };
  }

  if (!homepage.ok) {
    return { domain, ok: false, reason: `homepage_http_${homepage.status}` };
  }

  const resolvedUrl = homepage.url || `https://${domain}`;
  const resolvedDomain = new URL(resolvedUrl).hostname.replace(/^www\./, '').toLowerCase();
  const contentType = homepage.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return { domain, resolvedDomain, ok: false, reason: 'homepage_not_html' };
  }

  const html = (await homepage.text()).slice(0, 1_000_000);
  const lower = html.toLowerCase();
  if (
    lower.includes('enter using password') ||
    lower.includes('password-page') ||
    lower.includes('storefront password')
  ) {
    return { domain, resolvedDomain, ok: false, reason: 'password_protected' };
  }

  const fingerprint = hasShopifyFingerprint(html);

  let productResponse: Response | null = null;
  try {
    const base = resolvedUrl.replace(/\/$/, '');
    productResponse = await timedFetch(`${base}/products.json?limit=3`, 'application/json');
  } catch (error) {
    if (!fingerprint) {
      return {
        domain,
        resolvedDomain,
        ok: false,
        reason: error instanceof Error && error.name === 'AbortError' ? 'product_feed_timeout' : 'product_feed_unreachable',
      };
    }
  }

  if (productResponse?.ok) {
    try {
      const payload = (await productResponse.json()) as { products?: unknown[] };
      if (Array.isArray(payload.products) && payload.products.length > 0) {
        return { domain, resolvedDomain, ok: true, reason: 'shopify_with_products' };
      }
      if (Array.isArray(payload.products) && payload.products.length === 0) {
        return { domain, resolvedDomain, ok: false, reason: 'no_products' };
      }
    } catch {
      if (!fingerprint) return { domain, resolvedDomain, ok: false, reason: 'invalid_product_feed' };
    }
  }

  if (productResponse && (productResponse.status === 401 || productResponse.status === 403)) {
    return { domain, resolvedDomain, ok: false, reason: 'product_feed_blocked' };
  }

  if (fingerprint) {
    return { domain, resolvedDomain, ok: false, reason: 'shopify_no_usable_products' };
  }

  return { domain, resolvedDomain, ok: false, reason: 'not_shopify' };
}
