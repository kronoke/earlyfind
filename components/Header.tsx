import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="EarlyFind home">
        <span className="brand-mark">E</span>
        <span>EarlyFind</span>
      </Link>
      <nav className="nav-links">
        <a href="/#discover">Discover</a>
        <a href="/#trending">Trending</a>
        <a href="/#new">New</a>
      </nav>
      <div className="header-actions">
        <Link href="/claim" className="ghost-button">For brands</Link>
        <Link href="/claim" className="button small">Submit a product</Link>
      </div>
    </header>
  );
}
