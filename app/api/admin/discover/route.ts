import { NextRequest, NextResponse } from 'next/server';
import { persistCandidate, verifyShopifyStore } from '../../../../lib/discovery';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const raw = String(formData.get('domains') || '');
  const domains = [...new Set(raw.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean))].slice(0, 25);

  let verified = 0;
  let products = 0;

  for (const domain of domains) {
    const store = await verifyShopifyStore(domain);
    if (!store) continue;
    const result = await persistCandidate({ domain, source: 'manual' }, store);
    verified += 1;
    products += result.productCount;
  }

  const target = new URL('/admin/discovery', request.url);
  target.searchParams.set('checked', String(domains.length));
  target.searchParams.set('verified', String(verified));
  target.searchParams.set('products', String(products));
  return NextResponse.redirect(target, 303);
}
