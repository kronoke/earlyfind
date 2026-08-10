import Header from "@/components/Header";

export default function ClaimPage() {
  return <main><div className="shell"><Header />
    <section className="claim-page">
      <div className="claim-copy"><span className="eyebrow">For emerging brands</span><h1>Put your next product in front of curious shoppers.</h1><p>EarlyFind is building the discovery layer for independent online brands. Submit your store now and get your launch profile ready.</p><div className="benefit-list"><span>✓ Free early listing</span><span>✓ Product & store profile</span><span>✓ Community votes and click tracking</span><span>✓ Optional featured boosts later</span></div></div>
      <form className="claim-form">
        <label>Store name<input placeholder="Your brand" /></label>
        <label>Store URL<input placeholder="https://yourstore.com" /></label>
        <label>Best product URL<input placeholder="https://yourstore.com/products/..." /></label>
        <label>Category<select defaultValue=""><option value="" disabled>Choose category</option><option>Fashion</option><option>Home</option><option>Tech</option><option>Accessories</option><option>Beauty</option><option>Gaming</option><option>Other</option></select></label>
        <label>Email<input type="email" placeholder="you@brand.com" /></label>
        <button type="button" className="button full">Submit store</button>
        <p className="fine-print">MVP form only — backend submission comes next.</p>
      </form>
    </section>
  </div></main>;
}
