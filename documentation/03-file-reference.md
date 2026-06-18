# File reference

Every meaningful file in `fohlioo-extension/`, what it does, and who uses it.

---

## Root entry points (Plasmo auto-detects these)

| File | Role |
|------|------|
| `contents/capture.ts` | **Main content script.** Runs on fashion PDPs. Orchestrates extraction, tracking, SPA nav, messaging. |
| `background.ts` | **Service worker.** Handles incoming messages; builds/updates `ShopperSession` in storage. |
| `popup.tsx` | **Extension popup UI shell.** Loads session, polls every 2s, shows loading/empty/dashboard states. |
| `popup.css` | Styles for the popup (layout, cards, metric rings, activity list). |
| `sidepanel.tsx` | **Empty placeholder.** Not used yet; reserved for a future side panel UI. |

---

## Types & contracts

| File | Role |
|------|------|
| `interface.ts` | **Shared TypeScript shapes:** `ProductData`, `ShopperSession`, `SessionEvent`. The “dictionary” of our data. |
| `types/messages.ts` | **Message types** between content script ↔ background ↔ popup (`PRODUCT_CAPTURED`, `GET_SESSION`, etc.). |
| `assets.d.ts` | Tells TypeScript that importing `.svg`/`.png` gives a URL string (fixes build errors on logo import). |

---

## UI components

| File | Role |
|------|------|
| `components/session-dashboard.tsx` | **Main popup content:** hero product card, dwell/scroll rings, engagement details, size chips, activity feed. |
| `assets/logo.svg` | Fohlioo logo in popup header. |

---

## Product extraction (`lib/`)

| File | Role |
|------|------|
| `lib/extractor.ts` | Reads **JSON-LD** (`<script type="application/ld+json">`) and **Open Graph** meta tags. Handles retailer quirks (NAP ProductGroup, Zara multi-product arrays, Reebok size in offers). Exports `mergeExtractedProductData`. |
| `lib/dom-extractor.ts` | **HTML fallback** when structured data is incomplete. Per-site size selectors (COS buttons, ASOS `<select>`, H&M group). Generic selectors for name, price, brand. |
| `lib/site-patterns.ts` | **Human notes** on how each retailer structures JSON-LD/DOM — not executed at runtime, documentation for developers. |
| `lib/format.ts` | **Display helpers** for popup: format price, availability label, primary image, extraction source name. |

---

## Behaviour & wishlist (`lib/`)

| File | Role |
|------|------|
| `lib/events.ts` | **Dwell, scroll, wishlist orchestration.** Used by `ProductPageController`. |
| `lib/wishlist.ts` | **Wishlist routing** — delegates to `lib/sites/cos/wishlist.ts`, `lib/sites/zara/wishlist.ts`, ASOS helpers. |
| `lib/sites/` | **Per-retailer adapters** — engagement, wishlist, material passive watch. |
| `lib/sites/adapters/` | Registry: COS, Net-a-Porter, ASOS, Zara. |
| `lib/product-merge.ts` | Sticky material/sizes — fields don’t regress when DOM hides them. |

---

## Session & popup data (`lib/`)

| File | Role |
|------|------|
| `lib/session.ts` | **Session CRUD:** build initial session, merge events, read/write `shopperSession` in storage. |
| `lib/storage.ts` | Thin wrapper to read/write `latestProduct` (legacy/quick access alongside session). |
| `lib/popup-product.ts` | **Popup’s data layer:** `fetchShopperSession()` (messages active tab), `watchSession()` (storage listener). |
| `lib/session-format.ts` | Formats dwell time (“2m 15s”), relative timestamps (“Just now”), progress % for rings. |

---

## Developer experience (`lib/`)

| File | Role |
|------|------|
| `lib/debug.ts` | Coloured `[Fohlioo:category]` console logs on product pages in dev. Categories: capture, dwell, scroll, wishlist, spa, sizes, message. |

---

## Tests

| File / folder | Role |
|---------------|------|
| `vitest.config.ts` | Vitest config — uses **jsdom** to simulate a browser DOM in tests. |
| `lib/__tests__/extractor.test.ts` | JSON-LD parsing (Net-a-Porter, Zara fixtures). |
| `lib/__tests__/dom-extractor.test.ts` | DOM size extraction (COS buttons, ASOS select). |
| `lib/__tests__/wishlist.test.ts` | Wishlist selectors — ASOS, COS, Zara logical state. |
| `lib/__tests__/asos-engagement.test.ts` | ASOS accordion click classification. |
| `lib/__tests__/nap-engagement.test.ts` | Net-a-Porter accordion clicks. |
| `lib/__tests__/zara-engagement.test.ts` | Zara PDP action buttons. |
| `lib/__tests__/product-merge.test.ts` | Sticky material/sizes merge. |
| `lib/__tests__/fixtures/` | Real saved HTML/JSON-LD snippets from retailers for realistic tests. |

---

## Config & build (not application logic)

| File | Role |
|------|------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `test`), manifest permissions snippet. |
| `tsconfig.json` | TypeScript compiler options. |
| `README.md` | Dev setup, commands, technical architecture (developer-facing). |
| `documentation/` | **This folder** — layman guides. |
| `build/` | Generated extension output (load `build/chrome-mv3-dev` in Chrome during dev). |

---

## Dependency graph (simplified)

```
capture.ts
  ├── extractor.ts ──► dom-extractor.ts (merge import)
  ├── dom-extractor.ts
  ├── events.ts ──► wishlist.ts ──► dom-extractor.ts (getSiteKey)
  ├── session.ts
  ├── debug.ts
  └── types/messages.ts

background.ts
  ├── session.ts
  └── types/messages.ts

popup.tsx
  ├── popup-product.ts ──► session.ts, storage.ts, types/messages.ts
  ├── session-dashboard.tsx ──► format.ts, session-format.ts
  └── interface.ts
```

---

## “If I need to change X, which file?”

| Goal | Start here |
|------|------------|
| Add a new fashion site URL | `contents/capture.ts` (`config.matches`) + often `background.ts` (`FASHION_DOMAINS`) |
| Fix wrong price/name from JSON-LD | `lib/extractor.ts` |
| Fix missing sizes on a site | `lib/dom-extractor.ts` (`SITE_DOM_CONFIG`) |
| Fix wishlist not firing | `lib/sites/<brand>/wishlist.ts`, `lib/wishlist.ts`, `lib/events.ts` |
| Fix section engagement | `lib/sites/<brand>/engagement.ts`, adapter registry |
| Add engagement for new site | See [Architecture](./10-architecture.md) + [Behaviour tracking](./05-behaviour-tracking.md) |
| Change dwell/scroll milestones | `lib/events.ts` (`DWELL_MILESTONES_MS`, `SCROLL_MILESTONES_PCT`) |
| Change popup layout or copy | `components/session-dashboard.tsx`, `popup.css` |
| Change what gets stored in session | `lib/session.ts`, `background.ts` |
| Add a new message type | `types/messages.ts` + handler in `background.ts` and/or `capture.ts` |
