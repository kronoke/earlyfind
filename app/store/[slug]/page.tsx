import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { getStoreProducts, products } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return Array.from(new Set(products.map((product) => product.storeSlug))).map((slug) => ({ slug }));
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storeProducts = getStoreProducts(slug);
  if (!storeProducts.length) notFound();
  const store = storeProducts[0];

  return <main><div className="shell"><Header />
    <section className="store-hero">
      <div className="store-avatar">{store.brand.charAt(0)}</div>
      <span className="eyebrow">Emerging brand</span>
      <h1>{store.brand}</h1>
      <p>Independent products discovered on EarlyFind. This is a demo brand profile that will later support verified merchant ownership, store links, launch stats, and promotions.</p>
      <a className="ghost-button" href="/claim">Claim this store</a>
    </section>
    <section className="discover">
      <div className="section-head"><div><span className="eyebrow">From this brand</span><h2>Featured finds</h2></div></div>
      <div className="product-grid store-products">{storeProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
    </section>
  </div></main>;
}
