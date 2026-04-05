# Product Roadmap
## NutriScan — Food Nutrition Condition Scanner PWA

**Version:** 1.0
**Date:** 2026-04-05

---

## Overview

```
Phase 0 ── Phase 1 ── Phase 2 ── Phase 3 ── Phase 4
  Setup     MVP       Auth &     Polish &   Growth
  (1 wk)   (3 wks)   Contrib    PWA Perf   Features
            (3 wks)   (2 wks)   (ongoing)
```

Total to production-ready MVP: ~9 weeks

---

## Phase 0 — Project Setup (Week 1)

**Goal:** Working monorepo, CI/CD pipelines, deployed skeletons.

### Tasks
- [ ] Initialize monorepo (`/apps/web`, `/apps/api`, `/packages/shared`)
- [ ] Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] Backend: Fastify + TypeScript + Drizzle ORM scaffold
- [ ] PostgreSQL + Redis provisioned on Railway
- [ ] Cloudflare R2 bucket created
- [ ] Vercel project linked to GitHub repo (auto-deploy on `main`)
- [ ] Railway project linked to GitHub repo (auto-deploy on `main`)
- [ ] GitHub Actions CI: lint + type-check + test on every PR
- [ ] Environment variables configured in both platforms
- [ ] Basic health check endpoint (`GET /api/health`)
- [ ] Shared Zod schemas package (`/packages/shared`)

**Deliverable:** Both apps deployable to production URLs, CI green.

---

## Phase 1 — MVP: Scan & Display (Weeks 2–4)

**Goal:** Anonymous user can scan a barcode and see condition results.

### Backend
- [ ] `GET /api/products/:ean` — Open Food Facts proxy with Redis cache
- [ ] EAN validation middleware
- [ ] Rate limiting (anonymous tier)
- [ ] Error handling (OFF timeout, not found, upstream error)
- [ ] Fastify Helmet + CSP headers

### Frontend
- [ ] Camera scanner component (`@zxing/library` + `BarcodeDetector` fallback)
  - [ ] Rear camera preference
  - [ ] Bounding box overlay on detection
  - [ ] 1.5s debounce between scans
- [ ] Manual EAN entry fallback input
- [ ] Product detail view
  - [ ] Name, brand, image thumbnail
  - [ ] Nutriscore badge
  - [ ] Ingredients text
- [ ] Condition results display
  - [ ] ✅ / ⚠️ / ❌ per active condition
  - [ ] "No active filters" empty state
- [ ] Settings page — condition filter selector (multi-select)
- [ ] Filter persistence in `localStorage`
- [ ] "Not found in database" state with placeholder CTA
- [ ] Scan history (IndexedDB, last 50, anonymous)
- [ ] History page — list view with condition summary
- [ ] PWA manifest + icons
- [ ] Service worker (Workbox — app shell + API cache strategies)
- [ ] Offline banner when no network detected

### Testing
- [ ] Unit tests: condition evaluation logic (100% coverage)
- [ ] Unit tests: OFF field normalization
- [ ] Component test: ScannerPage renders camera view
- [ ] API test: product lookup (hit / miss / timeout scenarios)

**Deliverable:** Installable PWA. Scan any EAN, see pass/fail for selected conditions. Works offline for cached products.

---

## Phase 2 — Auth & User Contributions (Weeks 5–7)

**Goal:** User registration, login, server-synced history, and product submission.

### Backend
- [ ] `POST /api/auth/register` (email + password)
- [ ] `POST /api/auth/login` / logout / refresh
- [ ] Google OAuth flow (`GET /api/auth/google` + callback)
- [ ] JWT (RS256) access token + httpOnly refresh token cookie
- [ ] Refresh token rotation + revocation
- [ ] `GET /api/auth/me`
- [ ] `GET /api/products/:ean` — query local DB before OFF
- [ ] `POST /api/submissions` — product submission with image upload
  - [ ] sharp image processing (resize, strip EXIF, convert to WebP)
  - [ ] R2 upload
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
- [ ] Auth store (Zustand) + token refresh interceptor
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
| **M0 — Setup complete** | Week 1 | CI green, both apps deployed |
| **M1 — Scan MVP** | Week 4 | Anonymous scan + condition result + offline |
| **M2 — Auth + Submissions** | Week 7 | Register, login, submit product, admin approve |
| **M3 — Production Launch** | Week 9 | Lighthouse ≥ 90, Sentry active, domain live |
| **M4 — 500 WAU** | 3 months post-launch | Per PRD KPI targets |

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| iOS Safari `BarcodeDetector` not supported | High | High | ZXing fallback (already planned) |
| Open Food Facts API downtime | Low | High | Redis cache + graceful 503 response |
| Camera permission denied by user | Medium | High | Prominent permission prompt + manual entry fallback |
| Railway free tier cold starts | Medium | Medium | Keep-alive ping or upgrade to paid |
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
