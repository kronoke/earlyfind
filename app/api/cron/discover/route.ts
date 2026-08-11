import { NextRequest, NextResponse } from 'next/server';
import { getRecentShopifyCandidates } from '../../../../lib/builtwith';
import { persistCandidate, verifyShopifyStore } from '../../../../lib/discovery';
import { getShopifyCommunityCandidates } from '../../../../lib/shopify-community-source';
import { supabaseRest } from '../../../../lib/supabase-rest';

export const maxDuration = 300;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

async function runDiscovery() {
  const startedAt = new Date().toISOString();
  const hasBuiltWith = Boolean(process.env.BUILTWITH_API_KEY);
  const limit = Number(process.env.DISCOVERY_LIMIT || 40);
  const source = hasBuiltWith ? 'builtwith' : 'shopify-community-scrape';
  const candidates = hasBuiltWith
    ? (await getRecentShopifyCandidates(7, limit)).map((candidate) => ({ ...candidate, source }))
    : await getShopifyCommunityCandidates(limit);

  const errors: Array<{ domain: string; error: string }> = [];
  let verifiedCount = 0;
  let productCount = 0;

  const runRows = await supabaseRest<Array<{ id: string }>>('discovery_runs', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ source, started_at: startedAt, candidates_found: candidates.length }),
  });
  const runId = runRows[0]?.id;

  for (const candidate of candidates) {
    try {
      const verified = await verifyShopifyStore(candidate.domain);
      if (!verified || verified.products.length === 0) continue;
      const result = await persistCandidate(candidate, verified);
      verifiedCount += 1;
      productCount += result.productCount;
    } catch (error) {
      errors.push({ domain: candidate.domain, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (runId) {
    await supabaseRest(`discovery_runs?id=eq.${encodeURIComponent(runId)}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({
        finished_at: new Date().toISOString(),
        stores_verified: verifiedCount,
        products_found: productCount,
        errors,
      }),
    });
  }

  return {
    provider: source,
    candidates: candidates.length,
    verified: verifiedCount,
    products: productCount,
    errors: errors.length,
  };
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json(await runDiscovery());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Discovery failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
