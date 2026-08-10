import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/lib/data";

export default function HomePage() {
  return (
    <main>
      <div className="shell">
        <Header />

        <section className="hero">
          <div className="hero-kicker"><span className="live-dot" /> Fresh finds, updated daily</div>
          <h1>Find the brands<br />everyone else hasn’t.</h1>
          <p>Discover standout products from emerging online stores — before they hit your feed everywhere else.</p>
          <div className="hero-actions">
            <a href="#discover" className="button">Explore today’s finds</a>
            <a href="#how-it-works" className="text-button">How it works <span>↓</span></a>
          </div>
          <div className="social-proof">
            <div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>K</span></div>
            <span><strong>2,481</strong> discovery votes this week</span>
          </div>
        </section>

        <section className="ticker" aria-label="site highlights">
          <span>New brands daily</span><i>✦</i><span>Community ranked</span><i>✦</i><span>No mega-brands</span><i>✦</i><span>Hidden gems first</span>
        </section>

        <section className="discover" id="discover">
          <div className="section-head" id="trending">
            <div><span className="eyebrow">Today · August 10</span><h2>Today’s top finds</h2></div>
            <div className="rank-chip">Community ranked</div>
          </div>
          <div className="category-row">
            {categories.map((category, index) => <button key={category} className={index === 0 ? "active" : ""}>{category}</button>)}
          </div>
          <div className="product-grid">
            {products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </section>

        <section className="split-section" id="new">
          <div className="section-copy">
            <span className="eyebrow">Just launched</span>
            <h2>Small brands.<br />Big first impressions.</h2>
            <p>Fresh products deserve more than an algorithmic shrug. EarlyFind gives new stores a place to be discovered on day one.</p>
            <a className="inline-link" href="#more">See what just dropped →</a>
          </div>
          <div className="mini-grid" id="more">{products.slice(3).map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </section>

        <section className="how" id="how-it-works">
          <div className="section-head"><div><span className="eyebrow">The idea</span><h2>Discovery that compounds.</h2></div></div>
          <div className="steps">
            <div><span>01</span><h3>We find what’s new</h3><p>Emerging brands and creators get a clean launch page instead of disappearing into the noise.</p></div>
            <div><span>02</span><h3>The community ranks it</h3><p>Votes, saves, and clicks surface products people actually find interesting.</p></div>
            <div><span>03</span><h3>Great brands get momentum</h3><p>Top products earn visibility, referral traffic, and a story worth sharing with their own audience.</p></div>
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
          <span>© 2026 EarlyFind · MVP</span>
        </footer>
      </div>
    </main>
  );
}
