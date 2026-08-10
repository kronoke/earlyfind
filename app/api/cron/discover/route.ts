import { NextRequest, NextResponse } from 'next/server';
import { getRecentShopifyCandidates } from '../../../../lib/builtwith';
import { persistCandidate, verifyShopifyStore } from '../../../../lib/discovery';
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
  const candidates = hasBuiltWith
    ? await getRecentShopifyCandidates(7, Number(process.env.DISCOVERY_LIMIT || 60))
    : [];
  const errors: Array<{ domain: string; error: string }> = [];
  let verifiedCount = 0;
  let productCount = 0;

  const runRows = await supabaseRest<Array<{ id: string }>>('discovery_runs', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ source: hasBuiltWith ? 'builtwith' : 'no-paid-provider', started_at: startedAt, candidates_found: candidates.length }),
  });
  const runId = runRows[0]?.id;

  for (const candidate of candidates) {
    try {
      const verified = await verifyShopifyStore(candidate.domain);
      if (!verified) continue;
      const result = await persistCandidate({ ...candidate, source: 'builtwith' }, verified);
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
    provider: hasBuiltWith ? 'builtwith' : 'none',
    candidates: candidates.length,
    verified: verifiedCount,
    products: productCount,
    errors: errors.length,
    message: hasBuiltWith ? undefined : 'No paid discovery provider configured; use /admin/discovery for free batch imports.',
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
