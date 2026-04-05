# Product Requirements Document
## NutriScan — Food Nutrition Condition Scanner PWA

**Version:** 1.0
**Date:** 2026-04-05
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary
NutriScan is a Progressive Web Application (PWA) that enables users to scan EAN barcodes of food products in physical shops and instantly determine whether a product meets specific dietary or nutritional conditions (e.g., lactose-free, gluten-free, vegan, nut-free). It targets shoppers with dietary restrictions or allergies who need fast, reliable in-aisle decisions.

### 1.2 Problem Statement
People with dietary restrictions (intolerances, allergies, lifestyle choices) must manually read ingredient labels under poor lighting, in foreign languages, or with limited time. Mistakes can cause health consequences. Existing apps are either too slow, require account creation upfront, or have incomplete databases for local/regional products.

### 1.3 Goals
- Scan any EAN barcode in under 3 seconds and return a clear pass/fail for user-defined conditions.
- Work offline for previously scanned products.
- Require zero registration for basic use (anonymous scanning via Open Food Facts).
- Allow registered users to contribute product data not found in Open Food Facts.
- Be deployable as a PWA installable on any smartphone without app store friction.

### 1.4 Non-Goals
- Medical-grade allergy advice or certified nutritional labeling.
- Native iOS/Android app distribution.
- Support for QR codes, Data Matrix, or other non-EAN formats (v1.0).
- Full product catalog management or e-commerce features.

---

## 2. Target Users

### 2.1 Primary Personas

| Persona | Description | Key Need |
|---------|-------------|----------|
| **The Intolerant Shopper** | Adult with lactose/gluten intolerance, shops weekly | Fast in-aisle check without reading labels |
| **The Allergy Parent** | Parent shopping for child with nut/egg/dairy allergy | High confidence in safety, ability to flag unknown products |
| **The Lifestyle Dieter** | Vegan, Keto, or Halal diet follower | Filter for lifestyle compliance, not just medical conditions |
| **The Contributor** | Health-conscious user who wants to help fill database gaps | Easy, fast product data entry for local/unknown products |

### 2.2 User Types

- **Anonymous User** — No registration; can scan and check products using Open Food Facts data only; filters are session-persistent (localStorage).
- **Registered User** — Email/social login; persistent filter preferences; can submit product data for items not found in Open Food Facts; can view and manage their submissions.
- **Admin** — Internal role; can review and approve user-submitted product data before it enters the local database.

---

## 3. Features

### 3.1 Core Features (MVP)

#### F1 — Barcode Scanning
- Use device camera to scan EAN-8 and EAN-13 barcodes.
- Fallback: manual EAN code entry via text input.
- Real-time scanning via browser `getUserMedia` API + barcode detection library (ZXing or QuaggaJS or native `BarcodeDetector` API).
- Visual feedback: bounding box overlay on detected barcode.
- Works in PWA fullscreen mode on both iOS and Android.

#### F2 — Product Lookup
- Query Open Food Facts REST API (`world.openfoodfacts.org/api/v2/product/{ean}.json`) on scan.
- Parse and display:
  - Product name, brand, image thumbnail
  - Nutriscore grade (if available)
  - Ingredients list
  - Allergen tags (e.g., `en:gluten`, `en:milk`, `en:nuts`)
  - "May contain" warnings
- Cache lookup results locally (IndexedDB) for offline access.
- Show "Not found in database" state clearly with option to contribute (registered users).

#### F3 — Nutritional Condition Filters
- Pre-defined condition profiles:
  - Lactose-Free
  - Gluten-Free
  - Nut-Free
  - Egg-Free
  - Vegan
  - Vegetarian
  - Halal
  - Keto-Friendly (sugar < 5g per 100g)
  - Low-Sodium (< 0.3g sodium per 100g)
- Users select one or more active conditions from a filter/settings screen.
- On scan result, each active condition shows a clear status:
  - ✅ **Safe** — product explicitly labeled as compliant
  - ⚠️ **Uncertain** — product lacks data to confirm
  - ❌ **Not Safe** — product contains or may contain the restricted ingredient
- Filters are persisted per user (registered) or in localStorage (anonymous).

#### F4 — Scan History
- Last 50 scanned products stored locally (IndexedDB).
- Anonymous: device-only, cleared on browser data clear.
- Registered: synced to user account.
- History view shows product name, thumbnail, scan date, condition result summary.

#### F5 — User Authentication
- Registration: email + password, or OAuth via Google.
- Login persists via JWT stored in httpOnly cookies (server-side session management).
- Optional: anonymous-to-registered upgrade preserves local scan history.

#### F6 — User Product Submission (Registered Only)
- Triggered when a product is not found in Open Food Facts and not in the local DB.
- Submission form fields:
  - EAN code (pre-filled)
  - Product name (required)
  - Brand (optional)
  - Ingredients (free text, required)
  - Allergen tags (multi-select from condition list)
  - "Contains" and "May contain" distinction
  - Product photo upload (optional)
- Submitted products go into a "pending" state visible to the submitter.
- Admin review queue to approve/reject submissions.
- Approved submissions enter the local product database and are returned on future lookups.

### 3.2 Secondary Features (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Share product result (link/image) | Medium | Deep-link to product result page |
| Product rating / community notes | Low | Crowdsourced commentary per product |
| Multi-language support | Medium | i18n from launch if resources allow |
| Push notifications for recalled products | Low | Requires server-side notification infra |
| Batch scan mode | Low | Scan multiple items, view combined report |
| Custom user-defined conditions | Medium | User can define own filter rules |
| Barcode history export (CSV/PDF) | Low | For dieticians or medical consultations |

---

## 4. User Flows

### 4.1 Anonymous Scan Flow
```
Open App → [Camera View] → Scan EAN → Lookup Open Food Facts
→ Product Found → Show product + condition results
→ Product Not Found → "Not in database" message + [Sign up to contribute]
```

### 4.2 Registered Scan + Contribution Flow
```
Open App → [Camera View] → Scan EAN → Lookup (OFF + Local DB)
→ Product Found → Show product + condition results → [Save to history]
→ Product Not Found → [Submit Product] form → Submit for review
→ Admin approves → Product available for all users
```

### 4.3 Filter Setup Flow
```
[Settings] → Select active dietary conditions → Save
→ All subsequent scans evaluated against active conditions
```

---

## 5. UX / Design Requirements

### 5.1 Mobile-First Design
- Primary breakpoint: 375px–430px (modern smartphones).
- Large tap targets (min 44×44px).
- High contrast for outdoor/shop use (bright ambient light conditions).
- Dark mode support.

### 5.2 Speed & Clarity
- Scan-to-result in < 3 seconds on standard 4G/WiFi.
- Condition result must be visible without scrolling (above the fold).
- Status indicators use color AND icon AND text (accessibility: WCAG 2.1 AA).

### 5.3 Offline Behavior
- App shell loads instantly when offline (service worker cache).
- Previously scanned products accessible offline from cache.
- Clear indication when operating offline.

### 5.4 PWA Requirements
- `manifest.json` with app name, icons (192px, 512px), `display: standalone`.
- Service worker with cache-first strategy for app shell, network-first for API.
- HTTPS required.
- Installable on home screen (passes Lighthouse PWA audit).

---

## 6. Technical Architecture

### 6.1 Frontend
- **Framework:** React 18+ with TypeScript
- **Build tool:** Vite
- **State management:** Zustand (lightweight, PWA-friendly)
- **Barcode scanning:** ZXing-js (`@zxing/library`) or native `BarcodeDetector` with ZXing fallback
- **PWA:** Vite PWA plugin (`vite-plugin-pwa`) with Workbox
- **UI:** Tailwind CSS + shadcn/ui components
- **Routing:** React Router v6

### 6.2 Backend
- **Runtime:** Node.js with Express or Fastify (TypeScript)
- **Authentication:** Passport.js (local + Google OAuth) + JWT
- **Database:** PostgreSQL (user accounts, submissions, approvals)
- **Cache:** Redis (API response cache, rate limiting)
- **File storage:** Object storage (S3-compatible) for product images
- **API:** REST (v1); GraphQL optional for v2

### 6.3 External Integrations
- **Open Food Facts API:** `https://world.openfoodfacts.org/api/v2/product/{ean}.json` — free, no key required
- **Google OAuth 2.0:** For social login

### 6.4 Data Flow
```
[Camera] → [Barcode Decoder] → [App State]
    → [Local Cache (IndexedDB)] → hit? → [Display Result]
    → miss → [Backend API]
        → [Local DB] → hit? → [Display Result]
        → miss → [Open Food Facts API] → [Cache + Display Result]
        → OFF miss → [Not Found State]
```

---

## 7. Deployment Options

### Option A — Recommended: Vercel (Frontend) + Railway (Backend)
| Component | Service | Cost |
|-----------|---------|------|
| Frontend PWA | Vercel (free tier) | $0–$20/mo |
| Backend API | Railway (starter) | $5–$20/mo |
| PostgreSQL | Railway managed Postgres | Included |
| Redis | Railway managed Redis | Included |
| Object Storage | Cloudflare R2 | $0–$5/mo |
| **Total** | | **~$5–$45/mo** |

**Pros:** Zero DevOps, instant deploys from GitHub, global CDN for PWA, generous free tiers.
**Cons:** Less control, cold starts on free Railway tier.

### Option B — Fly.io (Full Stack)
| Component | Service | Cost |
|-----------|---------|------|
| Frontend + Backend | Fly.io (2× shared-cpu-1x) | $0–$15/mo |
| PostgreSQL | Fly Postgres | $0–$5/mo |
| Redis | Upstash Redis | $0–$10/mo |
| Object Storage | Cloudflare R2 | $0–$5/mo |
| **Total** | | **~$0–$35/mo** |

**Pros:** Docker-native, runs in multiple regions, generous free tier.
**Cons:** Slightly more configuration than Vercel/Railway.

### Option C — AWS (Production-Grade Scaling)
| Component | Service |
|-----------|---------|
| Frontend | S3 + CloudFront |
| Backend | ECS Fargate or Lambda |
| Database | RDS PostgreSQL |
| Cache | ElastiCache Redis |
| Storage | S3 |

**Pros:** Enterprise-grade, scales to millions of users.
**Cons:** Complex setup, higher cost at low volume (~$50–$150/mo minimum).

> **Recommendation for v1.0:** Option A (Vercel + Railway). Lowest friction, sufficient for thousands of users, easy to migrate to Option C if scale demands.

---

## 8. Security & Privacy

- HTTPS enforced everywhere (TLS 1.2+).
- No PII stored for anonymous users; only EAN codes in local IndexedDB.
- Registered user passwords hashed with bcrypt (cost factor ≥ 12).
- JWT tokens short-lived (15 min access + 7-day refresh).
- Rate limiting on scan/lookup endpoint (100 req/min per IP).
- Open Food Facts queries proxied through backend to avoid CORS and to enable caching.
- Product images scanned by users resized/stripped of EXIF metadata before storage.
- GDPR-compliant: users can export and delete their account data.

---

## 9. Success Metrics (KPIs)

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Weekly Active Users (WAU) | 500+ |
| Scans per active user per week | ≥ 5 |
| Product lookup success rate (found in DB) | ≥ 85% |
| Scan-to-result latency (P90) | < 3 seconds |
| PWA install rate (visitors who install) | ≥ 15% |
| User-submitted products (registered users) | ≥ 50 total |
| User retention (week 2) | ≥ 40% |

---

## 10. Out of Scope (v1.0)

- Barcode types other than EAN-8 / EAN-13
- Nutrition tracking / calorie counting
- Integration with fitness apps (MyFitnessPal, Apple Health)
- Multi-user family accounts
- Paid subscription tiers
- Admin web dashboard (admin actions via API/CLI in v1.0)
- Native mobile app (iOS App Store / Google Play)

---

## 11. Open Questions

1. Should the local product database be synchronized back to Open Food Facts as a contribution, or remain private?
2. What moderation SLA is acceptable for user-submitted products? (24h? 72h?)
3. Should anonymous users be rate-limited more aggressively than registered users?
4. Do we need a Terms of Service / Privacy Policy page before launch?
5. Internationalization priority: which languages beyond English for v1.1?

---

*Document owner: Product Team*
*Next step: Review open questions, then proceed to SPEC.md and ROADMAP.md*
