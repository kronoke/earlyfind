import Header from "@/components/Header";
import StarterBootstrap from "@/components/StarterBootstrap";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

type StoreJoin = {
  id: string;
  name: string | null;
  domain: string;
  homepage_url: string | null;
  description: string | null;
  country: string | null;
  status: string;
};

type ProductRaw = {
  product_type?: string;
  tags?: string | string[];
  vendor?: string;
  handle?: string;
  earlyfind?: {
    detected_language?: string | null;
    country_code?: string | null;
    translated_title?: string | null;
    translated_description?: string | null;
  };
};

type ProductRow = {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  product_url: string;
  first_seen_at: string;
  raw: ProductRaw | null;
  stores: StoreJoin | StoreJoin[];
};

type CategoryName = "Clothing" | "Home" | "Beauty" | "Jewelry" | "Tech" | "Gifts" | "Art" | "Food" | "Other";

const CATEGORY_ORDER: CategoryName[] = ["Clothing", "Home", "Beauty", "Jewelry", "Tech", "Gifts", "Art", "Food", "Other"];

const CATEGORY_KEYWORDS: Record<Exclude<CategoryName, "Other">, string[]> = {
  Clothing: ["shirt", "tee", "hoodie", "sweater", "dress", "jacket", "coat", "pants", "jeans", "shorts", "skirt", "apparel", "clothing", "fashion", "sock", "hat", "cap", "beanie", "shoe", "sneaker", "boot", "bag", "tote", "glove", "protective", "beekeeper"],
  Home: ["home", "decor", "candle", "lamp", "rug", "pillow", "blanket", "furniture", "kitchen", "mug", "cup", "glass", "vase", "bedding", "bath", "towel", "planter", "storage"],
  Beauty: ["beauty", "skin", "skincare", "serum", "cream", "lotion", "soap", "shampoo", "conditioner", "hair", "makeup", "lip", "cosmetic", "fragrance", "perfume", "body", "nail"],
  Jewelry: ["jewelry", "jewellery", "necklace", "bracelet", "earring", "ring", "pendant", "chain", "gem", "silver", "gold"],
  Tech: ["tech", "electronic", "charger", "cable", "keyboard", "mouse", "phone", "case", "headphone", "speaker", "gaming", "computer", "usb", "led", "smart"],
  Gifts: ["gift", "personalized", "custom", "keepsake", "birthday", "wedding", "anniversary", "baby", "pet", "novelty", "card"],
  Art: ["art", "print", "poster", "painting", "canvas", "illustration", "photography", "sculpture", "ceramic", "craft", "handmade", "book", "journal"],
  Food: ["food", "snack", "coffee", "tea", "chocolate", "candy", "sauce", "spice", "honey", "cookie", "bakery", "drink", "beverage"],
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", UK: "United Kingdom",
  AU: "Australia", NZ: "New Zealand", IE: "Ireland", DE: "Germany", FR: "France",
  NL: "Netherlands", ES: "Spain", IT: "Italy", JP: "Japan", KR: "South Korea",
};

function joinedStore(value: ProductRow["stores"]): StoreJoin | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeText(value: unknown) {
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  return String(value ?? "").toLowerCase();
}

function keywordScore(text: string, keywords: string[], weight = 1) {
  return keywords.reduce((total, keyword) => total + (text.includes(keyword) ? weight : 0), 0);
}

function productCategory(product: ProductRow): CategoryName {
  const store = joinedStore(product.stores);
  const primary = [product.title, product.raw?.product_type, product.raw?.tags, product.raw?.vendor].map(normalizeText).join(" ");
  const secondary = [store?.name, store?.description].map(normalizeText).join(" ");
  let best: CategoryName = "Other";
  let bestScore = 0;
  for (const category of CATEGORY_ORDER) {
    if (category === "Other") continue;
    const score = keywordScore(primary, CATEGORY_KEYWORDS[category], 3) + keywordScore(secondary, CATEGORY_KEYWORDS[category], 1);
    if (score > bestScore) { best = category; bestScore = score; }
  }
  return best;
}

function canonicalProductKey(product: ProductRow) {
  const store = joinedStore(product.stores);
  try {
    const url = new URL(product.product_url);
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/$/, "").toLowerCase()}`;
  } catch {
    return `${store?.domain || "unknown"}:${product.title.trim().toLowerCase()}`;
  }
}

function canonicalImageKey(product: ProductRow) {
  if (!product.image_url) return null;
  try {
    const url = new URL(product.image_url);
    let path = decodeURIComponent(url.pathname).toLowerCase();
    path = path.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|original|master|\d+x\d*|x\d+)(?=\.[a-z0-9]+$)/i, "");
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${path}`;
  } catch {
    return product.image_url.split("?")[0].toLowerCase();
  }
}

function productFamilyTitle(title: string) {
  return title.toLowerCase().normalize("NFKD").replace(/[–—]/g, "-")
    .replace(/\b(?:gr\.?|größe|groesse|size|taille)\s*[:.\-]?\s*(?:xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|\d{1,3})\b/gi, " ")
    .replace(/\b(?:xxxs|xxs|xs|s|m|l|xl|xxl|xxxl)\b\s*$/gi, " ")
    .replace(/\b(?:small|medium|large|extra small|extra large)\b\s*$/gi, " ")
    .replace(/[\s|,_-]+/g, " ").trim();
}

function isEnglishProduct(product: ProductRow) {
  const detected = product.raw?.earlyfind?.detected_language?.toLowerCase();
  if (detected) return detected === "en";

  const store = joinedStore(product.stores);
  const sample = `${product.title} ${store?.description || ""}`.toLowerCase();
  const obviousNonEnglish = [
    /\b(?:größe|groesse|für|mit|und|oder|abnehmbar|schleier|imker|jacke|handschuh)\b/i,
    /\b(?:pour|avec|taille|homme|femme|nouveau|nouvelle|bijoux|maison)\b/i,
    /\b(?:para|con|talla|hombre|mujer|nuevo|nueva|hogar|joyas)\b/i,
    /\b(?:per|con|taglia|uomo|donna|nuovo|nuova|casa|gioielli)\b/i,
    /[ぁ-んァ-ン一-龯가-힣]/,
  ];
  return !obviousNonEnglish.some((pattern) => pattern.test(sample));
}

function dedupeProducts(products: ProductRow[]) {
  const seenUrls = new Set<string>();
  const seenStoreTitles = new Set<string>();
  const seenStoreImages = new Set<string>();
  const seenFamilies = new Set<string>();
  const result: ProductRow[] = [];

  for (const product of products) {
    if (!isEnglishProduct(product)) continue;
    const store = joinedStore(product.stores);
    const storeKey = store?.domain?.replace(/^www\./, "").toLowerCase() || "unknown";
    const urlKey = canonicalProductKey(product);
    const titleKey = `${storeKey}:${product.title.trim().toLowerCase()}`;
    const familyKey = `${storeKey}:${productFamilyTitle(product.title)}`;
    const image = canonicalImageKey(product);
    const imageKey = image ? `${storeKey}:${image}` : null;
    if (seenUrls.has(urlKey) || seenStoreTitles.has(titleKey) || seenFamilies.has(familyKey) || (imageKey && seenStoreImages.has(imageKey))) continue;
    seenUrls.add(urlKey);
    seenStoreTitles.add(titleKey);
    seenFamilies.add(familyKey);
    if (imageKey) seenStoreImages.add(imageKey);
    result.push(product);
  }
  return result;
}

function countryFlag(code?: string | null) {
  if (!code) return "";
  const normalized = code.toUpperCase() === "UK" ? "GB" : code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(...[...normalized].map((char) => 127397 + char.charCodeAt(0)));
}

function countryLabel(product: ProductRow) {
  const store = joinedStore(product.stores);
  const code = (store?.country || product.raw?.earlyfind?.country_code || "").toUpperCase();
  if (!code) return null;
  const normalized = code === "UK" ? "GB" : code;
  return `${countryFlag(normalized)} ${COUNTRY_NAMES[normalized] || normalized}`;
}

async function getApprovedProducts() {
  if (!isSupabaseConfigured()) return [] as ProductRow[];
  try {
    const rows = await supabaseRest<ProductRow[]>(
      "products?select=id,title,price,image_url,product_url,first_seen_at,raw,stores!inner(id,name,domain,homepage_url,description,country,status)&active=eq.true&stores.status=eq.approved&order=first_seen_at.desc&limit=180"
    );
    return dedupeProducts(rows);
  } catch (error) {
    console.error("Failed to load approved EarlyFind products", error);
    return [] as ProductRow[];
  }
}

function RealProductCard({ product }: { product: ProductRow }) {
  const store = joinedStore(product.stores);
  const storeName = store?.name || store?.domain || "Independent store";
  const category = productCategory(product);
  const country = countryLabel(product);
  const description = store?.description?.replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const shortDescription = description && description.length > 180 ? `${description.slice(0, 177)}...` : description;

  return (
    <article className="product-card">
      <a href={product.product_url} target="_blank" rel="noreferrer sponsored" className="product-image-wrap">
        {product.image_url ? (
          <img className="product-image" src={product.image_url} alt={product.title} />
        ) : (
          <div className="product-image" style={{ display: "grid", placeItems: "center", minHeight: 260, background: "#f2efe9", padding: 24, textAlign: "center" }}><strong>{product.title}</strong></div>
        )}
        <span className="product-badge">{category}</span>
      </a>
      <div className="product-body">
        <div className="product-meta">
          <span>{country || category}</span>
          <span>{product.price != null ? `$${Number(product.price).toFixed(2)}` : "Visit store"}</span>
        </div>
        <a href={product.product_url} target="_blank" rel="noreferrer sponsored" className="product-title">{product.title}</a>
        {store?.homepage_url ? <a href={store.homepage_url} target="_blank" rel="noreferrer" className="product-brand">by {storeName}</a> : <span className="product-brand">by {storeName}</span>}
        <p>{shortDescription || `Discovered from ${store?.domain || "an independent Shopify store"}.`}</p>
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
  const today = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(new Date());
  const categorized = new Map<CategoryName, ProductRow[]>();
  for (const product of products) {
    const category = productCategory(product);
    categorized.set(category, [...(categorized.get(category) || []), product]);
  }
  const activeCategories = CATEGORY_ORDER.filter((category) => (categorized.get(category)?.length || 0) > 0);
  const newest = products.slice(0, 12);

  return (
    <main>
      <div className="shell">
        <Header />

        <section className="hero">
          <div className="hero-kicker"><span className="live-dot" /> English-language independent stores, updated daily</div>
          <h1>Shop small.<br />Find something different.</h1>
          <p>Browse real products from emerging English-language online stores in one place.</p>
          <div className="hero-actions">
            <a href="#discover" className="button">Browse new finds</a>
            <a href="#categories" className="text-button">Shop categories <span>↓</span></a>
          </div>
          <div className="social-proof"><span><strong>{products.length}</strong> unique product families live right now</span></div>
        </section>

        <section className="ticker" aria-label="site highlights">
          <span>Independent stores</span><i>✦</i><span>English listings only</span><i>✦</i><span>Shopify verified</span><i>✦</i><span>Direct merchant links</span>
        </section>

        {activeCategories.length > 0 && (
          <section className="discover" id="categories" style={{ paddingBottom: 20 }}>
            <div className="section-head"><div><span className="eyebrow">Browse</span><h2>Shop by category</h2></div></div>
            <div className="category-row">
              {activeCategories.map((category) => <a key={category} href={`#category-${category.toLowerCase()}`} className="button" style={{ textDecoration: "none" }}>{category} · {categorized.get(category)?.length || 0}</a>)}
            </div>
          </section>
        )}

        <section className="discover" id="discover">
          <div className="section-head" id="trending"><div><span className="eyebrow">Today · {today}</span><h2>Newest finds</h2></div><div className="rank-chip">Unique products</div></div>
          {newest.length > 0 ? (
            <div className="product-grid">{newest.map((product) => <RealProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div style={{ border: "1px dashed #cfc8bd", borderRadius: 20, padding: "52px 24px", textAlign: "center", background: "#faf8f4" }}>
              <span className="eyebrow">Catalog warming up</span><h2 style={{ margin: "10px 0" }}>Finding English-language products.</h2>
              <p style={{ maxWidth: 620, margin: "0 auto 18px", opacity: 0.72 }}>EarlyFind is checking independent Shopify stores in the background. English listings appear automatically after verification.</p>
              <StarterBootstrap enabled={isSupabaseConfigured()} />
              <a className="button" style={{ marginTop: 18 }} href="/admin/discovery">Open discovery tools</a>
            </div>
          )}
        </section>

        {activeCategories.map((category) => {
          const categoryProducts = categorized.get(category) || [];
          if (categoryProducts.length === 0) return null;
          return (
            <section className="discover" id={`category-${category.toLowerCase()}`} key={category} style={{ paddingTop: 30 }}>
              <div className="section-head"><div><span className="eyebrow">Shop small</span><h2>{category}</h2></div><div className="rank-chip">{categoryProducts.length} finds</div></div>
              <div className="product-grid">{categoryProducts.slice(0, 12).map((product) => <RealProductCard key={`${category}-${product.id}`} product={product} />)}</div>
            </section>
          );
        })}

        <section className="how" id="how-it-works">
          <div className="section-head"><div><span className="eyebrow">The idea</span><h2>A marketplace for small brands.</h2></div></div>
          <div className="steps">
            <div><span>01</span><h3>We discover stores</h3><p>EarlyFind finds emerging independent shops and verifies the storefront before importing products.</p></div>
            <div><span>02</span><h3>We filter the catalog</h3><p>Non-English listings are hidden, duplicate variants are collapsed, and products are organized into shopping categories.</p></div>
            <div><span>03</span><h3>You shop the merchant</h3><p>Choose something you like and EarlyFind sends you directly to the small business to purchase it.</p></div>
          </div>
        </section>

        <section className="brand-cta"><span className="eyebrow light">For independent brands</span><h2>Launching something worth finding?</h2><p>Get your products in front of people actively looking for independent brands. Early listings are free.</p><a href="/claim" className="button light-button">Submit your store</a></section>

        <footer><div className="brand footer-brand"><span className="brand-mark">E</span><span>EarlyFind</span></div><p>Discover early. Support independent.</p><span>© 2026 EarlyFind</span></footer>
      </div>
    </main>
  );
}
