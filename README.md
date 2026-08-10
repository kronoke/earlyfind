# EarlyFind MVP

A polished MVP for a consumer discovery platform focused on emerging ecommerce brands.

## What is included
- Homepage with discovery feed, trending ranking, categories and product cards
- Interactive local voting state
- Product detail pages
- Brand/store profile pages
- Merchant submission / claim page
- Responsive design for desktop and mobile
- Seed product data for a non-empty launch experience

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Deploy
Import the repository into Vercel. The framework preset should be detected as Next.js.

## Next build phase
1. Replace seed data with Supabase tables (stores, products, votes, submissions, clicks)
2. Add auth for shoppers and merchants
3. Persist voting / saves
4. Create real merchant claim verification
5. Track outbound clicks
6. Add admin moderation / import queue
7. Add automated Shopify store discovery and ingestion
8. Add paid boosts after organic traffic is measurable

## Working brand
“EarlyFind” is a placeholder brand for the MVP and should be researched before public launch.
