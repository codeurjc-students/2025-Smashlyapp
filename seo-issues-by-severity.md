# SEO Issues by Severity - Smashly-App.es

## Critical Issues (Fix Immediately)

### 1. No Server-Side Rendering (SSR) or Pre-rendering
**Location:** Entire application
**Impact:**
- All content requires JavaScript to render
- Search engines can crawl but indexing is slower
- Social media previews (Open Graph) don't work for individual pages
- Users with JavaScript disabled see blank page
- Google may miss content on large product catalogs

**Current Implementation:**
```html
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

**Solution:**
```bash
# Option 1: Migrate to Next.js (recommended)
npx create-next-app@latest --typescript

# Option 2: Add pre-rendering with react-snap
npm install react-snap
# Configure in package.json:
# "scripts": {
#   "postbuild": "react-snap"
# }
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/index.html`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/vite.config.ts`

---

### 2. Non-SEO-Friendly Product URLs
**Location:** RacketDetailPage.tsx, RacketCard.tsx
**Current URLs:** `/racket-detail?id=XXX`
**Problem:** Query parameters are not SEO-friendly and don't help with ranking

**Impact:**
- Poor search engine ranking
- Unfriendly URLs for users
- Hard to share specific products
- No keyword-rich URLs

**Solution:**
Change to: `/palas/brand-model-slug` (e.g., `/palas/bullpadel-vortex-3-2024`)

**Implementation:**
```typescript
// In RacketCard.tsx, change the onClick handler
const handleRacketClick = (racket: Racket) => {
  const slug = `${racket.marca}-${racket.modelo}`.toLowerCase().replace(/\s+/g, '-');
  navigate(`/palas/${slug}`, { state: { racketId: racket.id } });
};
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/App.tsx` - Update routing
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/components/features/RacketCard.tsx` - Update navigation
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/RacketDetailPage.tsx` - Update to use slug

---

## High Priority Issues (Fix Soon)

### 3. No Dynamic Meta Tags per Page
**Location:** All pages share the same meta tags from index.html
**Impact:**
- All pages have identical titles and descriptions in search results
- Poor click-through rates
- No page-specific Open Graph tags for social sharing
- Search engines don't understand page-specific content

**Current State:**
```html
<!-- index.html - Same for ALL pages -->
<title>Smashly — Encuentra tu Pala de Pádel Perfecta</title>
<meta name="description" content="Smashly - Comparador de palas de pádel con +800 modelos..." />
```

**Solution:**
```bash
npm install react-helmet-async
```

```typescript
// In each page component
import { Helmet } from 'react-helmet-async';

const CatalogPage = () => (
  <>
    <Helmet>
      <title>Catálogo de Palas de Pádel - Smashly</title>
      <meta name="description" content="Explora más de 800 palas de pádel de las mejores marcas. Compara precios, especificaciones y encuentra tu pala perfecta." />
    </Helmet>
    {/* Page content */}
  </>
);
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/index.html` - Wrap root with HelmetProvider
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/HomePage.tsx`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/CatalogPage.tsx`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/RacketDetailPage.tsx`
- All other page components

---

### 4. Missing Trust Signals
**Location:** Product cards, detail pages, homepage
**Impact:**
- Lower conversion rates
- Reduced user trust
- Competitors with more social proof rank higher

**Missing Elements:**
- Customer reviews and ratings (not prominently displayed)
- Trust badges (SSL, secure payment, certifications)
- Brand logos of partner stores
- Testimonials from users
- User count or success metrics

**Current Code:**
- `ProductReviews` component exists but may not be visible
- `StarRating` component is implemented

**Solution:**
```typescript
// Add to RacketCard.tsx
const ReviewSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

// Display on product cards
<ReviewSummary>
  <StarRating rating={racket.average_rating} />
  <span>({racket.review_count} reseñas)</span>
</ReviewSummary>
```

**Add to Footer:**
```tsx
// Trust badges section
const TrustBadges = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 2rem;
  opacity: 0.7;
`;
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/components/features/RacketCard.tsx`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/HomePage.tsx`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/components/layout/Footer.tsx`

---

### 5. Limited Schema.org Implementation
**Location:** index.html
**Current:** Only WebSite, Organization, SoftwareApplication schemas
**Missing:** Product, Review, AggregateRating, BreadcrumbList, FAQPage

**Solution:**
Add to index.html or implement dynamically with react-helmet:

```html
<!-- Product Schema for racket detail pages -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Bullpadel Vertex 03",
  "image": "https://smashly-app.es/images/rackets/bullpadel-vertex-03.jpg",
  "description": "Pala de pádel profesional con...",
  "brand": {
    "@type": "Brand",
    "name": "Bullpadel"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "42"
  },
  "offers": [
    {
      "@type": "Offer",
      "url": "https://smashly-app.es/palas/bullpadel-vertex-03",
      "priceCurrency": "EUR",
      "price": "249.99",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Padel Nuestro"
      }
    }
  ]
}
</script>
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/index.html`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/RacketDetailPage.tsx` (for dynamic product schema)

---

## Medium Priority Issues (Fix in Next Sprint)

### 6. Empty Pages Provide No SEO Value
**Location:** Compare page, Best Racket page
**Problem:** These pages are empty without user interaction

**Current State (ComparePage.tsx):**
- Shows "Selecciona hasta 3 palas" message
- No pre-populated content

**Solution:**
```typescript
// Add popular comparisons as default content
const PopularComparisons = [
  { rackets: ['pala-1', 'pala-2', 'pala-3'], title: 'Palas profesionales de alta gama' },
  { rackets: ['pala-4', 'pala-5'], title: 'Mejores palas para nivel intermedio' },
];
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/ComparePage.tsx`
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/BestRacketPage.tsx`

---

### 7. Sitemap.xml Missing Product Pages
**Location:** /public/sitemap.xml
**Current:** Only includes main pages (home, catalog, best-racket, compare, faq)
**Problem:** No individual product URLs in sitemap

**Solution:**
Generate dynamic sitemap with all products:

```bash
# Install sitemap generator
npm install sitemap
```

```typescript
// scripts/generate-sitemap.js
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';

const urls = [
  { url: 'https://smashly-app.es/', changefreq: 'weekly', priority: 1.0 },
  { url: 'https://smashly-app.es/catalog', changefreq: 'daily', priority: 0.9 },
  // Fetch all rackets from API and add them
];

const smStream = new SitemapStream({ hostname: 'https://smashly-app.es/' });
const writeStream = createWriteStream('./public/sitemap.xml');
smStream.pipe(writeStream);
urls.forEach(url => smStream.write(url));
smStream.end();
```

**Files to Create:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/scripts/generate-sitemap.js`

---

### 8. Missing BreadcrumbList Schema
**Location:** RacketDetailPage (has visual breadcrumbs, no schema)
**Impact:** Search engines don't understand page hierarchy

**Solution:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://smashly-app.es/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Catálogo",
      "item": "https://smashly-app.es/catalog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Bullpadel Vertex 03"
    }
  ]
}
</script>
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/pages/RacketDetailPage.tsx`

---

### 9. Image SEO Not Optimized
**Location:** All product images
**Issues:**
- Images use proxy URLs which may not be crawlable
- Alt text may not be descriptive enough
- No structured image data

**Current Implementation:**
```tsx
<img
  src={`${API_URL}/api/v1/proxy/image?url=${encodeURIComponent(imageUrl)}`}
  alt={racket.modelo}  // Only uses model name, not descriptive
/>
```

**Solution:**
```tsx
<img
  src={`${API_URL}/api/v1/proxy/image?url=${encodeURIComponent(imageUrl)}`}
  alt={`${racket.marca} ${racket.modelo} - Pala de pádel ${racket.nivel || ''}`}
  loading="lazy"
  width="220"
  height="220"
/>
```

**Files to Modify:**
- `/Users/teijeiro7/Documents/Proyectos/2025-Smashlyapp/frontend/src/components/features/RacketCard.tsx`

---

## Low Priority Issues (Nice-to-Have)

### 10. No Internal Linking Strategy
**Location:** Product pages, catalog
**Solution:** Add "Related Products", "Similar Palas", "You May Also Like" sections

### 11. Missing Social Sharing Buttons
**Location:** Product detail pages
**Solution:** Add share buttons for WhatsApp, Facebook, Twitter, email

### 12. No FAQPage Schema
**Location:** FAQ page
**Solution:** Add FAQPage structured data

### 13. Missing Hreflang Tags
**Location:** index.html
**Solution:** Add hreflang tags if supporting multiple languages

### 14. No 301 Redirect Configuration
**Location:** Server/routing
**Solution:** Configure redirects when implementing SEO-friendly URLs

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1-2)
1. Implement SSR or pre-rendering
2. Fix product URLs to SEO-friendly format
3. Add 301 redirects for old URLs

### Phase 2: High Priority (Week 3-4)
4. Install and configure react-helmet-async
5. Add dynamic meta tags to all pages
6. Implement trust signals (reviews, badges)
7. Enhance Schema.org markup

### Phase 3: Medium Priority (Week 5-6)
8. Add default content to empty pages
9. Generate dynamic sitemap with products
10. Add BreadcrumbList schema
11. Optimize image alt text

### Phase 4: Low Priority (Week 7-8)
12. Implement internal linking strategy
13. Add social sharing buttons
14. Add FAQPage schema
15. Configure hreflang if needed

---

## Quick Wins (Can be done in 1-2 hours)

1. **Update sitemap.xml lastmod dates** to current date
2. **Add alt text improvements** to RacketCard component
3. **Add Open Graph tags** to main pages
4. **Add trust badges** to footer
5. **Display review counts** on product cards

---

**Document Created:** 2026-04-12
