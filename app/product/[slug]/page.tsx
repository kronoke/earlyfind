import Header from "@/components/Header";
import { getProduct, products } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return <main><div className="shell"><Header />
    <section className="detail-page">
      <div className="detail-image"><img src={product.image} alt={product.name} /></div>
      <div className="detail-copy">
        <span className="eyebrow">{product.category} · {product.accent}</span>
        <h1>{product.name}</h1>
        <Link className="store-line" href={`/store/${product.storeSlug}`}>by {product.brand} →</Link>
        <p className="detail-description">{product.description}</p>
        <div className="price-line"><strong>${product.price}</strong><span>{product.votes.toLocaleString()} community votes</span></div>
        <button className="button full">Visit store ↗</button>
        <p className="fine-print">Demo listing for the EarlyFind MVP. External merchant links and click tracking come with the backend.</p>
      </div>
    </section>
  </div></main>;
}
