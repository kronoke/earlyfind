import { NextResponse } from 'next/server';
import { getShopifyCommunityCandidates } from '../../../../lib/shopify-community-source';
import { persistCandidate, verifyShopifyStore } from '../../../../lib/discovery';
import { diagnoseCandidate } from '../../../../lib/store-candidate-diagnostics';

export const maxDuration = 300;

export async function POST() {
  const candidates = await getShopifyCommunityCandidates(40);
  let verified = 0;
  let products = 0;
  let errors = 0;
  let filtered = 0;
  const reasons = new Map<string, number>();

  function countReason(reason: string) {
    reasons.set(reason, (reasons.get(reason) || 0) + 1);
  }

  for (const candidate of candidates) {
    try {
      const diagnostic = await diagnoseCandidate(candidate.domain);
      if (!diagnostic.ok) {
        filtered += 1;
        countReason(diagnostic.reason);
        continue;
      }

      const targetDomain = diagnostic.resolvedDomain || candidate.domain;
      const store = await verifyShopifyStore(targetDomain);
      if (!store) {
        filtered += 1;
        countReason('verification_mismatch');
        continue;
      }
      if (store.products.length === 0) {
        filtered += 1;
        countReason('no_usable_products');
        continue;
      }

      const result = await persistCandidate(
        {
          ...candidate,
          domain: targetDomain,
          metadata: {
            ...(candidate.metadata || {}),
            originalDomain: candidate.domain,
            resolvedDomain: targetDomain,
          },
        },
        store
      );
      verified += 1;
      products += result.productCount;
    } catch (error) {
      errors += 1;
      countReason(error instanceof Error ? `error_${error.name || 'unknown'}` : 'error_unknown');
    }
  }

  const topReasons = [...reasons.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([reason, count]) => `${reason}:${count}`)
    .join(',');

  const params = new URLSearchParams({
    scraped: String(candidates.length),
    verified: String(verified),
    products: String(products),
    errors: String(errors),
    filtered: String(filtered),
    reasons: topReasons,
  });

  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  return NextResponse.redirect(new URL(`/admin/discovery?${params.toString()}`, origin), 303);
}
