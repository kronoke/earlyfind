import { isSupabaseConfigured, supabaseRest } from '../../../lib/supabase-rest';

type StoreRow = {
  id: string;
  domain: string;
  name: string | null;
  description: string | null;
  homepage_url: string | null;
  logo_url: string | null;
  discovery_score: number;
  source_first_detected_at: string | null;
  first_seen_at: string;
  status: string;
};

export const dynamic = 'force-dynamic';

function friendlyReason(value: string) {
  const labels: Record<string, string> = {
    not_shopify: 'Not Shopify',
    no_products: 'No products',
    no_usable_products: 'No usable products',
    shopify_no_usable_products: 'Shopify, no usable products',
    password_protected: 'Password protected',
    product_feed_blocked: 'Product feed blocked',
    product_feed_timeout: 'Product feed timed out',
    product_feed_unreachable: 'Product feed unreachable',
    homepage_timeout: 'Homepage timed out',
    homepage_unreachable: 'Homepage unreachable',
    homepage_not_html: 'Homepage not HTML',
    invalid_product_feed: 'Invalid product feed',
    verification_mismatch: 'Verification mismatch',
  };
  if (labels[value]) return labels[value];
  if (value.startsWith('homepage_http_')) return `Homepage HTTP ${value.replace('homepage_http_', '')}`;
  if (value.startsWith('error_')) return value.replace('error_', 'Error: ');
  return value.replaceAll('_', ' ');
}

export default async function DiscoveryAdminPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isSupabaseConfigured()) {
    return (
      <main style={{ maxWidth: 900, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
        <h1>Discovery Queue</h1>
        <p>Supabase is not configured yet. Add the required environment variables, then refresh this page.</p>
      </main>
    );
  }

  const params = (await searchParams) || {};
  const checked = typeof params.checked === 'string' ? params.checked : null;
  const scraped = typeof params.scraped === 'string' ? params.scraped : null;
  const verified = typeof params.verified === 'string' ? params.verified : null;
  const products = typeof params.products === 'string' ? params.products : null;
  const errors = typeof params.errors === 'string' ? params.errors : null;
  const filtered = typeof params.filtered === 'string' ? params.filtered : null;
  const reasonsRaw = typeof params.reasons === 'string' ? params.reasons : '';
  const reasons = reasonsRaw
    ? reasonsRaw.split(',').map((entry) => {
        const splitAt = entry.lastIndexOf(':');
        return splitAt > 0 ? { reason: entry.slice(0, splitAt), count: entry.slice(splitAt + 1) } : null;
      }).filter(Boolean) as Array<{ reason: string; count: string }>
    : [];

  const stores = await supabaseRest<StoreRow[]>(
    'stores?select=id,domain,name,description,homepage_url,logo_url,discovery_score,source_first_detected_at,first_seen_at,status&status=eq.pending&order=discovery_score.desc,first_seen_at.desc&limit=100'
  );

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, opacity: 0.6, fontWeight: 700 }}>EARLYFIND ADMIN</p>
          <h1 style={{ margin: '6px 0' }}>Discovery Queue</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>{stores.length} stores waiting for review</p>
        </div>
        <a href="/" style={{ color: 'inherit' }}>View site</a>
      </div>

      <section style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Automatic free discovery</h2>
        <p style={{ opacity: 0.72, marginTop: 0 }}>
          Scrape recent public Shopify Store Feedback posts, filter obvious non-store domains, follow storefront redirects, verify Shopify, and auto-import stores that expose usable products.
        </p>
        <form action="/api/admin/scrape-community" method="post">
          <button type="submit" style={{ padding: '11px 16px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}>
            Find more stores now
          </button>
        </form>
        {scraped && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              Last scrape: found {scraped} candidates · verified {verified || '0'} stores · imported {products || '0'} products · filtered {filtered || '0'} · {errors || '0'} errors
            </p>
            {reasons.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {reasons.map(({ reason, count }) => (
                  <span key={reason} style={{ fontSize: 13, padding: '6px 9px', borderRadius: 999, background: '#eee' }}>
                    {friendlyReason(reason)}: {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Manual batch discovery</h2>
        <p style={{ opacity: 0.72, marginTop: 0 }}>
          Paste up to 25 domains or storefront URLs. EarlyFind will visit each public storefront, verify Shopify, and import public products when available.
        </p>
        <form action="/api/admin/discover" method="post">
          <textarea
            name="domains"
            required
            rows={7}
            placeholder={'example-store.com\nhttps://anotherbrand.com\nthirdstore.com'}
            style={{ width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 12, border: '1px solid #ccc', font: 'inherit', resize: 'vertical' }}
          />
          <button type="submit" style={{ marginTop: 12, padding: '11px 16px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}>
            Verify & import
          </button>
        </form>
        {checked && (
          <p style={{ marginBottom: 0, fontWeight: 600 }}>
            Last manual batch: checked {checked} · verified {verified || '0'} Shopify stores · imported {products || '0'} products
          </p>
        )}
      </section>

      <div style={{ display: 'grid', gap: 16 }}>
        {stores.map((store) => (
          <article key={store.id} style={{ border: '1px solid #ddd', borderRadius: 16, padding: 18, display: 'grid', gridTemplateColumns: '1fr auto', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20 }}>{store.name || store.domain}</h2>
                <span style={{ fontSize: 13, padding: '4px 8px', borderRadius: 999, background: '#eee' }}>Score {store.discovery_score}</span>
              </div>
              <p style={{ margin: '8px 0', opacity: 0.72 }}>{store.description || 'No description detected.'}</p>
              <div style={{ fontSize: 14, opacity: 0.65 }}>
                <span>{store.domain}</span>
                {store.source_first_detected_at && <span> · first detected {new Date(store.source_first_detected_at).toLocaleDateString()}</span>}
              </div>
              {store.homepage_url && (
                <p style={{ marginBottom: 0 }}><a href={store.homepage_url} target="_blank" rel="noreferrer">Open storefront ↗</a></p>
              )}
            </div>
            <form action={`/api/admin/stores/${store.id}`} method="post" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button name="action" value="approved" style={{ padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer' }}>Approve</button>
              <button name="action" value="rejected" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', cursor: 'pointer', background: 'transparent' }}>Reject</button>
            </form>
          </article>
        ))}

        {stores.length === 0 && (
          <div style={{ border: '1px dashed #ccc', borderRadius: 16, padding: 32, textAlign: 'center', opacity: 0.7 }}>
            No pending stores. Verified stores with products are auto-approved and should appear on the public site.
          </div>
        )}
      </div>
    </main>
  );
}
