import { freeStarterCandidates } from './free-candidates';
import { persistCandidate, verifyShopifyStore } from './discovery';

export async function bootstrapRealStores(limit = 8) {
  const candidates = freeStarterCandidates.slice(0, Math.max(1, Math.min(limit, freeStarterCandidates.length)));
  const results = await Promise.allSettled(
    candidates.map(async (candidate) => {
      const verified = await verifyShopifyStore(candidate.domain);
      if (!verified || verified.products.length === 0) return { imported: false, domain: candidate.domain, products: 0 };
      const persisted = await persistCandidate(candidate, verified);
      return { imported: true, domain: candidate.domain, products: persisted.productCount };
    })
  );

  return results.reduce(
    (summary, result) => {
      if (result.status === 'fulfilled' && result.value.imported) {
        summary.stores += 1;
        summary.products += result.value.products;
      } else if (result.status === 'rejected') {
        summary.errors += 1;
      }
      return summary;
    },
    { stores: 0, products: 0, errors: 0 }
  );
}
