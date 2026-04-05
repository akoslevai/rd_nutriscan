# Technical Specification
## NutriScan — Food Nutrition Condition Scanner PWA

**Version:** 1.0
**Date:** 2026-04-05
**Status:** Draft
**Derived from:** PRD.md v1.0

---

## 1. System Architecture

### 1.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Client (PWA)                      │
│  React 18 + TypeScript + Vite + Tailwind + Zustand  │
│  Service Worker (Workbox) · IndexedDB cache         │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS REST
┌────────────────────▼────────────────────────────────┐
│               Backend API (Railway)                 │
│         Node.js 20 · Fastify · TypeScript           │
├──────────────┬──────────────────┬───────────────────┤
│  PostgreSQL  │      Redis       │   S3-compatible   │
│  (Railway)   │   (Railway)      │  (Cloudflare R2)  │
└──────────────┴──────────┬───────┴───────────────────┘
                          │ HTTP (proxied)
              ┌───────────▼────────────┐
              │   Open Food Facts API  │
              │  world.openfoodfacts   │
              └────────────────────────┘
```

### 1.2 Deployment Topology

| Component | Platform | Region |
|-----------|----------|--------|
| Frontend PWA | Vercel (static) | Edge (global CDN) |
| Backend API | Railway (web service) | US-East or EU-West |
| PostgreSQL | Railway managed | Same region as API |
| Redis | Railway managed | Same region as API |
| Object Storage | Cloudflare R2 | Global |
| Domain / TLS | Vercel (frontend) + Railway custom domain | — |

---

## 2. Frontend Specification

### 2.1 Stack

| Concern | Library / Tool | Version |
|---------|---------------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build | Vite | 5.x |
| PWA | vite-plugin-pwa + Workbox | latest |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui | latest |
| State | Zustand | 4.x |
| Routing | React Router | 6.x |
| HTTP client | ky | latest |
| Barcode scanning | @zxing/library + BarcodeDetector polyfill | latest |
| Local storage | idb (IndexedDB wrapper) | latest |
| Form validation | React Hook Form + Zod | latest |
| Testing | Vitest + React Testing Library | latest |

### 2.2 Application Routes

| Path | Component | Auth required |
|------|-----------|---------------|
| `/` | `ScannerPage` | No |
| `/product/:ean` | `ProductDetailPage` | No |
| `/history` | `HistoryPage` | No (local) |
| `/settings` | `SettingsPage` | No |
| `/login` | `LoginPage` | No |
| `/register` | `RegisterPage` | No |
| `/submit/:ean` | `ProductSubmitPage` | Yes |
| `/submissions` | `MySubmissionsPage` | Yes |
| `/admin/queue` | `AdminQueuePage` | Admin only |

### 2.3 PWA Configuration

**`manifest.json`**
```json
{
  "name": "NutriScan",
  "short_name": "NutriScan",
  "description": "Scan food barcodes to check dietary conditions",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Service Worker Strategy (Workbox)**

| Resource | Strategy |
|----------|----------|
| App shell (HTML/JS/CSS) | CacheFirst (versioned) |
| API responses (`/api/*`) | NetworkFirst (5s timeout, fallback to cache) |
| Open Food Facts images | StaleWhileRevalidate |
| Product lookup results | NetworkFirst + IndexedDB fallback |

### 2.4 Barcode Scanning

```typescript
// Scanning priority:
// 1. Native BarcodeDetector API (Chrome Android, Chrome Desktop)
// 2. @zxing/library (all other browsers including iOS Safari)

interface ScanResult {
  ean: string;           // raw barcode value
  format: 'EAN_8' | 'EAN_13';
}

// Supported formats: EAN_8, EAN_13 only (v1.0)
// Camera: rear-facing preferred (facingMode: "environment")
// Frame rate: 15fps scan attempts
// Debounce: 1500ms between scans to prevent duplicates
```

### 2.5 Condition Evaluation Logic

```typescript
type ConditionStatus = 'safe' | 'unsafe' | 'uncertain';

interface ConditionRule {
  id: string;
  label: string;
  // tags that MUST NOT appear in allergens_tags
  forbiddenAllergenTags: string[];
  // tags that MUST NOT appear in traces_tags
  forbiddenTraceTags: string[];
  // optional: nutrient threshold check
  nutrientCheck?: {
    nutrient: string;   // e.g. 'sugars_100g'
    operator: '<' | '>';
    threshold: number;
  };
}

// Evaluation:
// 'unsafe'    → any forbidden tag found in allergens_tags
// 'uncertain' → any forbidden tag found in traces_tags OR
//               required nutrient data missing
// 'safe'      → no forbidden tags found AND data is complete
```

**Condition Definitions**

| ID | Label | Forbidden Allergen Tags | Forbidden Trace Tags |
|----|-------|------------------------|---------------------|
| `lactose-free` | Lactose-Free | `en:milk` | `en:milk` |
| `gluten-free` | Gluten-Free | `en:gluten`, `en:wheat`, `en:barley`, `en:rye`, `en:oats` | same |
| `nut-free` | Nut-Free | `en:nuts`, `en:peanuts`, `en:almonds`, `en:hazelnuts`, `en:walnuts`, `en:cashews`, `en:pistachios` | same |
| `egg-free` | Egg-Free | `en:eggs` | `en:eggs` |
| `vegan` | Vegan | `en:milk`, `en:eggs`, `en:fish`, `en:crustaceans`, `en:molluscs`, `en:meat` | — |
| `vegetarian` | Vegetarian | `en:fish`, `en:crustaceans`, `en:molluscs`, `en:meat` | — |
| `halal` | Halal | `en:pork`, `en:alcohol` | — |
| `keto` | Keto-Friendly | — | — | nutrientCheck: `sugars_100g < 5` |
| `low-sodium` | Low-Sodium | — | — | nutrientCheck: `sodium_100g < 0.3` |

### 2.6 State Management (Zustand Stores)

```typescript
// stores/useFilterStore.ts
interface FilterStore {
  activeConditions: string[];       // condition IDs
  setConditions: (ids: string[]) => void;
}

// stores/useScanStore.ts
interface ScanStore {
  currentProduct: Product | null;
  scanStatus: 'idle' | 'scanning' | 'loading' | 'found' | 'not_found' | 'error';
  setScanResult: (product: Product | null) => void;
}

// stores/useAuthStore.ts
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  logout: () => void;
}
```

### 2.7 IndexedDB Schema

```
Database: nutriscan-db  (version 1)

Store: products
  keyPath: ean
  Fields: ean, name, brand, image_url, ingredients_text,
          allergens_tags, traces_tags, nutriments,
          source ('openfoodfacts' | 'local'), cached_at

Store: scan_history
  keyPath: id (auto-increment)
  Indexes: scanned_at (desc)
  Fields: id, ean, product_name, scanned_at, condition_results (JSON)
  Max: 50 entries (FIFO eviction)
```

---

## 3. Backend Specification

### 3.1 Stack

| Concern | Library | Version |
|---------|---------|---------|
| Runtime | Node.js | 20 LTS |
| Framework | Fastify | 4.x |
| Language | TypeScript | 5.x |
| ORM | Drizzle ORM | latest |
| Auth | @fastify/passport + passport-local + passport-google-oauth20 | latest |
| Session/JWT | jsonwebtoken + @fastify/cookie | latest |
| Validation | Zod | latest |
| Rate limiting | @fastify/rate-limit | latest |
| File upload | @fastify/multipart | latest |
| Image processing | sharp | latest |
| Testing | Vitest + supertest | latest |

### 3.2 API Endpoints

#### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register with email + password |
| `POST` | `/api/auth/login` | No | Login, returns access + refresh tokens |
| `POST` | `/api/auth/logout` | Yes | Invalidate refresh token |
| `POST` | `/api/auth/refresh` | No | Exchange refresh token for new access token |
| `GET` | `/api/auth/google` | No | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | No | Google OAuth callback |
| `GET` | `/api/auth/me` | Yes | Get current user profile |

#### Product Lookup

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/products/:ean` | No | Lookup product by EAN (local DB first, then OFF) |

**GET `/api/products/:ean` — Response**
```typescript
// 200 Found
{
  source: 'local' | 'openfoodfacts';
  product: {
    ean: string;
    name: string;
    brand: string | null;
    image_url: string | null;
    nutriscore: 'a'|'b'|'c'|'d'|'e' | null;
    ingredients_text: string | null;
    allergens_tags: string[];
    traces_tags: string[];
    nutriments: Record<string, number>;
  }
}

// 404 Not Found
{ error: 'not_found' }

// 503 OFF API unavailable
{ error: 'upstream_unavailable', cached: false }
```

#### Scan History (Registered Users)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/history` | Yes | Get scan history (paginated) |
| `POST` | `/api/history` | Yes | Add scan to server history |
| `DELETE` | `/api/history` | Yes | Clear all history |

#### Product Submissions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/submissions` | Yes | Submit new product |
| `GET` | `/api/submissions` | Yes | List own submissions |
| `GET` | `/api/submissions/:id` | Yes | Get submission detail |

#### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/queue` | Admin | List pending submissions |
| `PATCH` | `/api/admin/submissions/:id` | Admin | Approve or reject submission |

### 3.3 Product Lookup Flow (Backend)

```
GET /api/products/:ean
  1. Validate EAN format (8 or 13 digits)
  2. Check Redis cache (TTL: 1 hour) → return if hit
  3. Query local PostgreSQL products table → return if found
  4. Query Open Food Facts API
     - Timeout: 4 seconds
     - On success: normalize, store in Redis, return
     - On 404: return 404
     - On error/timeout: return 503
  5. Store OFF result in Redis cache (TTL: 1 hour)
```

### 3.4 Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- null for OAuth users
  google_id   TEXT UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Local product database (approved submissions)
CREATE TABLE products (
  ean         TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  brand       TEXT,
  image_url   TEXT,
  ingredients_text TEXT,
  allergens_tags   TEXT[] DEFAULT '{}',
  traces_tags      TEXT[] DEFAULT '{}',
  nutriments       JSONB DEFAULT '{}',
  submitted_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- User product submissions (pending review)
CREATE TABLE submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ean         TEXT NOT NULL,
  name        TEXT NOT NULL,
  brand       TEXT,
  image_url   TEXT,
  ingredients_text TEXT,
  allergens_tags   TEXT[] DEFAULT '{}',
  traces_tags      TEXT[] DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'approved'|'rejected'
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by  UUID REFERENCES users(id),
  review_note  TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at  TIMESTAMPTZ
);

-- Scan history (server-side, registered users)
CREATE TABLE scan_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ean         TEXT NOT NULL,
  product_name TEXT,
  condition_results JSONB DEFAULT '{}',
  scanned_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_scan_history_user ON scan_history(user_id, scanned_at DESC);
```

### 3.5 Authentication Flow

**Access Token:** JWT, 15-minute expiry, signed with RS256, payload: `{ sub: userId, role }`
**Refresh Token:** Opaque token, 7-day expiry, stored as hash in `refresh_tokens` table, sent as httpOnly `Secure` cookie.

**Token Refresh:**
```
Client detects 401 → POST /api/auth/refresh (cookie auto-sent)
→ Server validates refresh token hash → issues new access token
→ Refresh token rotation (old invalidated, new issued)
```

### 3.6 File Upload (Product Images)

```
1. Receive multipart/form-data (max 5MB)
2. Validate MIME type: image/jpeg, image/png, image/webp only
3. Resize to max 800×800px (sharp), strip EXIF
4. Convert to WebP (quality 80)
5. Upload to Cloudflare R2 bucket: products/{ean}/{uuid}.webp
6. Store public URL in submission record
```

### 3.7 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `GET /api/products/:ean` (anonymous) | 60 req/min per IP |
| `GET /api/products/:ean` (authenticated) | 120 req/min per user |
| `POST /api/auth/login` | 10 req/min per IP |
| `POST /api/auth/register` | 5 req/min per IP |
| `POST /api/submissions` | 10 req/hour per user |

---

## 4. Open Food Facts Integration

### 4.1 API Endpoint
```
GET https://world.openfoodfacts.org/api/v2/product/{ean}.json
    ?fields=product_name,brands,image_front_url,nutriscore_grade,
            ingredients_text,allergens_tags,traces_tags,nutriments
```

### 4.2 Field Mapping

| OFF Field | Internal Field |
|-----------|----------------|
| `product.product_name` | `name` |
| `product.brands` | `brand` |
| `product.image_front_url` | `image_url` |
| `product.nutriscore_grade` | `nutriscore` |
| `product.ingredients_text` | `ingredients_text` |
| `product.allergens_tags` | `allergens_tags` |
| `product.traces_tags` | `traces_tags` |
| `product.nutriments` | `nutriments` |

### 4.3 Error Handling

| Scenario | Behavior |
|----------|----------|
| OFF returns `status: 0` | Treat as 404 not found |
| OFF returns empty `product_name` | Use EAN as display name |
| OFF timeout (> 4s) | Return 503 to client |
| OFF rate limited (429) | Return 503, log alert |

---

## 5. Security Specification

### 5.1 Headers (via Fastify Helmet)
```
Content-Security-Policy: default-src 'self'; img-src 'self' https://images.openfoodfacts.org https://pub-*.r2.dev; connect-src 'self' https://world.openfoodfacts.org
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self)
```

### 5.2 Input Validation
- All API inputs validated with Zod schemas server-side.
- EAN: regex `/^\d{8}$|^\d{13}$/`
- Submission text fields: max lengths enforced (name: 200, ingredients: 5000, brand: 100).
- Image uploads: MIME type re-validated post-upload (not just Content-Type header).

### 5.3 GDPR
- `DELETE /api/users/me` permanently deletes user record and cascades to history + submissions.
- `GET /api/users/me/export` returns JSON dump of all user data.
- Anonymous users: no server-side data stored.

---

## 6. Environment Variables

### Frontend (Vite)
```env
VITE_API_BASE_URL=https://api.nutriscan.app
VITE_GOOGLE_CLIENT_ID=...
```

### Backend
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_PRIVATE_KEY=...      # RS256 private key (PEM)
JWT_PUBLIC_KEY=...       # RS256 public key (PEM)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nutriscan-products
R2_PUBLIC_URL=https://pub-xxx.r2.dev
CORS_ORIGIN=https://nutriscan.app
```

---

## 7. Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit (condition evaluation logic) | Vitest | 100% |
| Unit (API route handlers) | Vitest + supertest | 80% |
| Component (React) | React Testing Library | 70% |
| E2E | Playwright | Critical paths only |

**Critical E2E paths:**
1. Anonymous user scans a known EAN → sees result
2. User registers → logs in → scans → result saved to history
3. Registered user submits a product → appears in "My Submissions"
4. Admin approves submission → product appears in lookup

---

## 8. Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse PWA score | ≥ 90 |
| Lighthouse Performance score | ≥ 85 |
| Time to first scan (cold start) | < 3s on 4G |
| API p50 latency (cached) | < 100ms |
| API p90 latency (OFF proxy) | < 3s |
| Bundle size (initial JS, gzipped) | < 150KB |
| Service worker install | < 500ms |
