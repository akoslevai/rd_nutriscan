# Product Roadmap
## NutriScan — Food Nutrition Condition Scanner PWA

**Version:** 1.0
**Date:** 2026-04-05

---

## Overview

```
Phase 0 ── Phase 1 ────── Phase 2 ── Phase 3 ── Phase 4
  Setup   Anonymous MVP   Backend   Polish &   Growth
  (1 wk)  frontend only   Auth &    PWA Perf   Features
           (3 wks)        Contrib   (2 wks)   (ongoing)
                          (3 wks)
```

Total to production-ready MVP: ~9 weeks

---

## Phase 0 — Project Setup (Week 1)

**Goal:** Frontend-only repo, CI/CD pipeline, deployed skeleton on Vercel.

### Tasks
- [ ] Initialize repo (`/src` frontend only — no monorepo needed yet)
- [ ] Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] Vercel project linked to GitHub repo (auto-deploy on `main`)
- [ ] GitHub Actions CI: lint + type-check + test on every PR
- [ ] PWA manifest + placeholder icons
- [ ] Shared Zod schemas for condition/product types (`/src/lib/schemas.ts`)

**Deliverable:** Blank PWA installable from Vercel URL, CI green.

---

## Phase 1 — Anonymous MVP: Frontend Only (Weeks 2–4)

**Goal:** Anonymous user can scan a barcode and see condition results. No backend — Open Food Facts called directly from the browser.

> **No backend, no auth, no database, no Supabase, no Redis at this stage.**

### Frontend Only
- [ ] Camera scanner component (`@zxing/library` + `BarcodeDetector` fallback)
  - [ ] Rear camera preference
  - [ ] Bounding box overlay on detection
  - [ ] 1.5s debounce between scans
- [ ] Manual EAN entry fallback input
- [ ] Open Food Facts API called directly from the browser
  - [ ] `GET https://world.openfoodfacts.org/api/v2/product/{ean}.json`
  - [ ] Field normalization (name, brand, image, allergens, nutriments)
  - [ ] Error handling (not found, timeout, network offline)
- [ ] Product detail view
  - [ ] Name, brand, image thumbnail
  - [ ] Nutriscore badge
  - [ ] Ingredients text
- [ ] Condition evaluation logic (pure client-side)
  - [ ] ✅ / ⚠️ / ❌ per active condition
  - [ ] "No active filters" empty state
- [ ] Settings page — condition filter selector (multi-select)
- [ ] Filter persistence in `localStorage`
- [ ] "Not found in database" state (placeholder CTA — "sign up to contribute" disabled for now)
- [ ] Scan history (IndexedDB, last 50 scans, device-local only)
- [ ] History page — list view with condition summary
- [ ] Service worker (Workbox — app shell cache + IndexedDB product cache for offline)
- [ ] Offline banner when no network detected

### Testing
- [ ] Unit tests: condition evaluation logic (100% coverage)
- [ ] Unit tests: OFF field normalization
- [ ] Component test: ScannerPage renders camera view

**Deliverable:** Installable PWA deployed on Vercel. Scan any EAN, see pass/fail for selected conditions. Works offline for cached products. Zero backend infrastructure.

---

## Phase 2 — Backend, Auth & User Contributions (Weeks 5–7)

**Goal:** Introduce backend + Supabase. User registration, login, server-synced history, and product submission.

### Infrastructure Setup (start of phase)
- [ ] Initialize `/apps/api` (Fastify + TypeScript + Drizzle ORM)
- [ ] Convert repo to monorepo (`/apps/web`, `/apps/api`, `/packages/shared`)
- [ ] Supabase project created (PostgreSQL + Auth + Storage bucket `products`)
- [ ] Upstash Redis database created (free tier)
- [ ] Render web service linked to GitHub repo (auto-deploy on `main`)
- [ ] Environment variables configured in Vercel + Render dashboards

### Backend
- [ ] Configure Supabase project (Auth + PostgreSQL + Storage bucket)
- [ ] Enable Google OAuth provider in Supabase Auth dashboard
- [ ] JWT verification middleware (validate Supabase JWT via `SUPABASE_JWT_SECRET`)
- [ ] Role claim setup (Supabase custom JWT hook to inject `role` claim for admins)
- [ ] `GET /api/products/:ean` — query local DB before OFF
- [ ] `POST /api/submissions` — product submission with image upload
  - [ ] sharp image processing (resize, strip EXIF, convert to WebP)
  - [ ] Supabase Storage upload
- [ ] `GET /api/submissions` — list own submissions
- [ ] `GET /api/admin/queue` — pending submissions list (admin role)
- [ ] `PATCH /api/admin/submissions/:id` — approve / reject
  - [ ] On approve: insert into `products` table
- [ ] `GET /api/history` + `POST /api/history` (server-synced)
- [ ] Rate limiting (authenticated tiers)
- [ ] GDPR: `DELETE /api/users/me` + `GET /api/users/me/export`

### Frontend
- [ ] Login page (email/password + Google OAuth button)
- [ ] Register page
- [ ] Auth store (Zustand) wrapping `supabase.auth` + `onAuthStateChange` listener
- [ ] Protected route wrapper
- [ ] Anonymous → registered history migration prompt
- [ ] Product submission form (`/submit/:ean`)
  - [ ] Pre-filled EAN
  - [ ] Allergen multi-select
  - [ ] Image upload with preview
  - [ ] Zod validation + React Hook Form
- [ ] "My Submissions" page with status badges (pending / approved / rejected)
- [ ] Sync scan history to server on login
- [ ] User menu (avatar, logout, submissions link)

### Testing
- [ ] API tests: full auth flow (register → login → refresh → logout)
- [ ] API tests: submission lifecycle (submit → admin approve → appears in lookup)
- [ ] E2E (Playwright): anonymous scan → register → scan saved to history
- [ ] E2E (Playwright): submit product → admin approves → product found on rescan

**Deliverable:** Full user lifecycle. Registered users can submit products. Admin can approve via API.

---

## Phase 3 — Polish & PWA Performance (Week 8–9)

**Goal:** Production-quality UX, Lighthouse ≥ 90, accessibility compliant.

### UX Polish
- [ ] Dark mode (Tailwind `dark:` + `prefers-color-scheme`)
- [ ] Loading skeletons on product lookup
- [ ] Haptic feedback on successful scan (Vibration API)
- [ ] Animated scan line on camera view
- [ ] Empty states (no history, no submissions)
- [ ] Error toast notifications (network errors, validation failures)
- [ ] Onboarding flow for first-time users (condition selector modal)
- [ ] Keyboard-accessible all interactive elements (WCAG 2.1 AA)
- [ ] `aria-live` region for scan result announcements (screen readers)

### Performance
- [ ] Bundle analysis (rollup-plugin-visualizer) — target < 150KB gzipped
- [ ] Image lazy loading + WebP with fallback
- [ ] Preload critical fonts
- [ ] Service worker precache audit
- [ ] Lighthouse CI gate in GitHub Actions (fail PR if score < 85)

### Security Hardening
- [ ] Penetration test checklist (OWASP Top 10 self-review)
- [ ] CSP violation reporting endpoint
- [ ] Dependabot alerts enabled
- [ ] Secrets scanning (GitHub secret scanning)

### Observability
- [ ] Structured logging (pino) on backend
- [ ] Error tracking (Sentry — free tier) on both frontend and backend
- [ ] Uptime monitoring (Better Uptime or Railway built-in)
- [ ] Basic analytics (Plausible — privacy-first, no cookies)

**Deliverable:** Production launch. Passes Lighthouse PWA + Performance. Publicly announced.

---

## Phase 4 — Growth Features (Post-Launch, Prioritized Backlog)

| Feature | Priority | Notes |
|---------|----------|-------|
| Custom user-defined condition rules | High | Most-requested v2 feature |
| Multi-language / i18n (ES, DE, FR) | High | i18next, language auto-detect |
| Share product result (link/image) | Medium | Web Share API + OG image generation |
| Admin web dashboard UI | Medium | Replace API-only admin with React page |
| Product photo from camera during submission | Medium | Currently file upload only |
| Push notifications (product recalls) | Low | Requires Web Push + backend worker |
| Barcode history export (CSV) | Low | dietician use case |
| Community notes per product | Low | Crowdsourced commentary |
| Batch scan mode | Low | Scan multiple, view combined |
| Offline submission queue | Medium | Submit when back online |
| Family/shared accounts | Low | Multiple profiles, one login |

---

## Milestones Summary

| Milestone | Target | Gate Criteria |
|-----------|--------|---------------|
| **M0 — Setup complete** | Week 1 | CI green, frontend deployed on Vercel |
| **M1 — Anonymous MVP** | Week 4 | Scan + condition result + offline, frontend only |
| **M2 — Auth + Submissions** | Week 7 | Backend live, register, login, submit product, admin approve |
| **M3 — Production Launch** | Week 9 | Lighthouse ≥ 90, Sentry active, domain live |
| **M4 — 500 WAU** | 3 months post-launch | Per PRD KPI targets |

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari `BarcodeDetector` not supported | High | High | ZXing fallback (already planned) |
| Open Food Facts API downtime | Low | High | Phase 1: IndexedDB cache; Phase 2+: Redis cache + graceful 503 |
| Camera permission denied by user | Medium | High | Prominent permission prompt + manual entry fallback |
| Render free tier cold starts | Medium | Medium | Not relevant in Phase 1; Phase 2+: keep-alive ping or upgrade to paid ($7/mo) |
| OFF product data incomplete / inaccurate | High | Medium | "Uncertain" status shown; user can submit corrections |
| Spam product submissions | Medium | Medium | Rate limiting (10/hour) + admin review queue |

---

## Definition of Done

A feature is **done** when:
1. Code merged to `main` via reviewed PR
2. Unit/integration tests written and passing
3. CI pipeline green (lint + types + tests)
4. Feature verified on both iOS Safari and Chrome Android
5. No new Lighthouse score regression > 5 points
