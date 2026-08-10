export type Product = {
  slug: string;
  name: string;
  brand: string;
  storeSlug: string;
  category: string;
  price: number;
  votes: number;
  badge?: string;
  description: string;
  image: string;
  accent: string;
};

export const products: Product[] = [
  { slug: "orbit-desk-lamp", name: "Orbit Desk Lamp", brand: "Morrow Objects", storeSlug: "morrow-objects", category: "Home", price: 44, votes: 842, badge: "#1 Today", description: "A compact magnetic lamp built for desks, nightstands, and small spaces.", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85", accent: "Warm light" },
  { slug: "stride-card-wallet", name: "Stride Card Wallet", brand: "Northline Supply", storeSlug: "northline-supply", category: "Accessories", price: 29, votes: 631, badge: "Trending", description: "A low-profile everyday wallet with quick-access storage and clean lines.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85", accent: "Everyday carry" },
  { slug: "cloud-mug", name: "Cloud Mug", brand: "Sunday Form", storeSlug: "sunday-form", category: "Home", price: 24, votes: 511, badge: "Under $25", description: "A soft-form ceramic mug designed to make the everyday coffee ritual feel better.", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1200&q=85", accent: "Small batch" },
  { slug: "halo-running-cap", name: "Halo Running Cap", brand: "Pace Dept.", storeSlug: "pace-dept", category: "Fashion", price: 32, votes: 418, description: "Breathable technical cap for runs, walks, and everything after.", image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=85", accent: "New release" },
  { slug: "pixel-dock", name: "Pixel Dock", brand: "Modular Day", storeSlug: "modular-day", category: "Tech", price: 38, votes: 379, description: "A compact desktop organizer for charging cables, earbuds, and small tech.", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85", accent: "Desk setup" },
  { slug: "daily-carry-tote", name: "Daily Carry Tote", brand: "Plain Sight", storeSlug: "plain-sight", category: "Fashion", price: 36, votes: 344, description: "Structured canvas tote with enough room for work, errands, or a day out.", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=85", accent: "Editor pick" }
];

export const categories = ["All", "Fashion", "Home", "Tech", "Accessories", "Beauty", "Gaming"];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getStoreProducts(storeSlug: string) {
  return products.filter((product) => product.storeSlug === storeSlug);
}
