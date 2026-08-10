"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/data";

export default function ProductCard({ product }: { product: Product }) {
  const [votes, setVotes] = useState(product.votes);
  const [voted, setVoted] = useState(false);

  return (
    <article className="product-card">
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img className="product-image" src={product.image} alt={product.name} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="product-accent">{product.accent}</span>
      </Link>
      <div className="product-body">
        <div className="product-meta"><span>{product.category}</span><span>${product.price}</span></div>
        <Link href={`/product/${product.slug}`} className="product-title">{product.name}</Link>
        <Link href={`/store/${product.storeSlug}`} className="product-brand">by {product.brand}</Link>
        <p>{product.description}</p>
        <div className="product-footer">
          <button className={`vote-button ${voted ? "voted" : ""}`} onClick={() => { setVoted(!voted); setVotes((v) => v + (voted ? -1 : 1)); }} aria-pressed={voted}>
            <span>↑</span> {votes.toLocaleString()}
          </button>
          <Link href={`/product/${product.slug}`} className="view-link">View find →</Link>
        </div>
      </div>
    </article>
  );
}
