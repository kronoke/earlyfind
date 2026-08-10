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
- Supabase-backed Shopify discovery pipeline
- Protected admin review queue
- Free batch domain verification/import
- Optional BuiltWith source for future scale

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Deploy
Import the repository into Vercel. The framework preset should be detected as Next.js.

## Discovery setup
Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in Vercel. Run `supabase/schema.sql` once in Supabase.

For the free MVP workflow, visit `/admin/discovery`, paste candidate store domains, and EarlyFind will verify Shopify fingerprints, import public product data where available, and place valid stores into the approval queue. `BUILTWITH_API_KEY` is optional and can remain blank until paid automated discovery is worth the cost.

## Next build phase
1. Replace public seed data with approved Supabase stores/products
2. Add outbound click and impression tracking
3. Add merchant claim verification and dashboards
4. Add shopper auth and persistent votes/saves
5. Add additional free or low-cost candidate sources
6. Add paid boosts after organic traffic is measurable

## Working brand
“EarlyFind” is a placeholder brand for the MVP and should be researched before public launch.
