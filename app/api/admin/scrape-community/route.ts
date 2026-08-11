import { NextResponse } from 'next/server';
import { getShopifyCommunityCandidates } from '../../../../lib/shopify-community-source';
import { persistCandidate, verifyShopifyStore } from '../../../../lib/discovery';

export const maxDuration = 300;

export async function POST() {
  const candidates = await getShopifyCommunityCandidates(40);
  let verified = 0;
  let products = 0;
  let errors = 0;

  for (const candidate of candidates) {
    try {
      const store = await verifyShopifyStore(candidate.domain);
      if (!store || store.products.length === 0) continue;
      const result = await persistCandidate(candidate, store);
      verified += 1;
      products += result.productCount;
    } catch {
      errors += 1;
    }
  }

  const params = new URLSearchParams({
    scraped: String(candidates.length),
    verified: String(verified),
    products: String(products),
    errors: String(errors),
  });
  return NextResponse.redirect(new URL(`/admin/discovery?${params.toString()}`, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'), 303);
}
