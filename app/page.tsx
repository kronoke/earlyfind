import Header from "@/components/Header";
import StarterBootstrap from "@/components/StarterBootstrap";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

type StoreJoin = {
  id: string;
  name: string | null;
  domain: string;
  homepage_url: string | null;
  description: string | null;
  status: string;
};

type ProductRow = {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  product_url: string;
  first_seen_at: string;
  stores: StoreJoin | StoreJoin[];
};

function joinedStore(value: ProductRow["stores"]): StoreJoin | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function getApprovedProducts() {
  if (!isSupabaseConfigured()) return [] as ProductRow[];

  try {
    return await supabaseRest<ProductRow[]>(
      "products?select=id,title,price,image_url,product_url,first_seen_at,stores!inner(id,name,domain,homepage_url,description,status)&active=eq.true&stores.status=eq.approved&order=first_seen_at.desc&limit=18"
    );
  } catch (error) {
    console.error("Failed to load approved EarlyFind products", error);
    return [] as ProductRow[];
  }
}

function RealProductCard({ product }: { product: ProductRow }) {
  const store = joinedStore(product.stores);
  const storeName = store?.name || store?.domain || "Independent store";

  return (
    <article className="product-card">
      <a href={product.product_url} target="_blank" rel="noreferrer sponsored" className="product-image-wrap">
        {product.image_url ? (
          <img className="product-image" src={product.image_url} alt={product.title} />
        ) : (
          <div className="product-image" style={{ display: "grid", placeItems: "center", minHeight: 260, background: "#f2efe9", padding: 24, textAlign: "center" }}>
            <strong>{product.title}</strong>
          </div>
        )}
        <span className="product-badge">Verified Shopify store</span>
      </a>
      <div className="product-body">
        <div className="product-meta">
          <span>Emerging brand</span>
          <span>{product.price != null ? `$${Number(product.price).toFixed(2)}` : "Visit store"}</span>
        </div>
        <a href={product.product_url} target="_blank" rel="noreferrer sponsored" className="product-title">{product.title}</a>
        {store?.homepage_url ? (
          <a href={store.homepage_url} target="_blank" rel="noreferrer" className="product-brand">by {storeName}</a>
        ) : (
          <span className="product-brand">by {storeName}</span>
        )}
        <p>{store?.description || `Discovered from ${store?.domain || "an independent Shopify store"}.`}</p>
        <div className="product-footer">
          <span style={{ fontSize: 13, opacity: 0.65 }}>Added {new Date(product.first_seen_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <a href={product.product_url} target="_blank" rel="noreferrer sponsored" className="view-link">Visit product →</a>
        </div>
      </div>
    </article>
  );
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getApprovedProducts();
  const topProducts = products.slice(0, 6);
  const moreProducts = products.slice(6);
  const today = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date());

  return (
    <main>
      <div className="shell">
        <Header />

        <section className="hero">
          <div className="hero-kicker"><span className="live-dot" /> Real independent stores, updated daily</div>
          <h1>Find the brands<br />everyone else hasn’t.</h1>
          <p>Discover real products from emerging online stores — before they become the brands everyone already knows.</p>
          <div className="hero-actions">
            <a href="#discover" className="button">Explore today’s finds</a>
            <a href="#how-it-works" className="text-button">How it works <span>↓</span></a>
          </div>
          <div className="social-proof">
            <span><strong>{products.length}</strong> approved products live right now</span>
          </div>
        </section>

        <section className="ticker" aria-label="site highlights">
          <span>Real stores only</span><i>✦</i><span>Shopify verified</span><i>✦</i><span>No mega-brands</span><i>✦</i><span>Direct merchant links</span>
        </section>

        <section className="discover" id="discover">
          <div className="section-head" id="trending">
            <div><span className="eyebrow">Today · {today}</span><h2>Newest verified finds</h2></div>
            <div className="rank-chip">Live catalog</div>
          </div>

          {topProducts.length > 0 ? (
            <div className="product-grid">
              {topProducts.map((product) => <RealProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div style={{ border: "1px dashed #cfc8bd", borderRadius: 20, padding: "52px 24px", textAlign: "center", background: "#faf8f4" }}>
              <span className="eyebrow">Catalog warming up</span>
              <h2 style={{ margin: "10px 0" }}>Finding the first real products.</h2>
              <p style={{ maxWidth: 620, margin: "0 auto 18px", opacity: 0.72 }}>The site stays online while EarlyFind checks a small curated starter batch in the background. Valid Shopify products will appear after import.</p>
              <StarterBootstrap enabled={isSupabaseConfigured()} />
              <a className="button" style={{ marginTop: 18 }} href="/admin/discovery">Open discovery tools</a>
            </div>
          )}
        </section>

        {moreProducts.length > 0 && (
          <section className="split-section" id="new">
            <div className="section-copy">
              <span className="eyebrow">Recently discovered</span>
              <h2>Small brands.<br />Real products.</h2>
              <p>Every product here comes from a Shopify storefront that EarlyFind verified before adding it to the catalog.</p>
              <a className="inline-link" href="#more">Browse more finds →</a>
            </div>
            <div className="mini-grid" id="more">{moreProducts.map((product) => <RealProductCard key={product.id} product={product} />)}</div>
          </section>
        )}

        <section className="how" id="how-it-works">
          <div className="section-head"><div><span className="eyebrow">The idea</span><h2>Discovery that compounds.</h2></div></div>
          <div className="steps">
            <div><span>01</span><h3>We find what’s new</h3><p>EarlyFind collects candidate emerging stores from free sources today and richer discovery feeds later.</p></div>
            <div><span>02</span><h3>We verify the storefront</h3><p>The crawler checks for Shopify fingerprints and usable public products before a store can appear.</p></div>
            <div><span>03</span><h3>Shoppers discover them</h3><p>Visitors click directly through to the merchant, giving small brands another source of discovery and referral traffic.</p></div>
          </div>
        </section>

        <section className="brand-cta">
          <span className="eyebrow light">For independent brands</span>
          <h2>Launching something worth finding?</h2>
          <p>Get your product in front of people actively looking for what’s next. Early listings are free.</p>
          <a href="/claim" className="button light-button">Submit your store</a>
        </section>

        <footer>
          <div className="brand footer-brand"><span className="brand-mark">E</span><span>EarlyFind</span></div>
          <p>Discover early. Support independent.</p>
          <span>© 2026 EarlyFind</span>
        </footer>
      </div>
    </main>
  );
}
