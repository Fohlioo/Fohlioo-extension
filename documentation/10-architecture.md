# Extension architecture

How the codebase is organised so new fashion sites and event types scale without `capture.ts` becoming a junk drawer.

## Design principles

1. **`contents/capture.ts` is thin** — Plasmo config, SPA nav, one `ProductPageController` instance.
2. **Site-specific UI lives under `lib/sites/`** — one folder per retailer when behaviour diverges (COS material drawer, ASOS wishlist, etc.).
3. **Generic pipelines stay generic** — JSON-LD / OG / DOM merge, dwell, scroll, messenger.
4. **One class for lifecycle only** — `ProductPageController` starts/stops trackers; site logic stays functional modules.
5. **All background messages go through `lib/capture/messenger.ts`** — single place to add `PURCHASE_CONFIRMED` later.

## Layer diagram

```
contents/capture.ts
        │
        ▼
lib/capture/page-controller.ts     ← lifecycle (start / stop / SPA reset)
        │
        ├── lib/capture/product-capture.ts    ← extract + merge → ProductData
        ├── lib/capture/hydration.ts            ← lazy sizes / material
        ├── lib/capture/messenger.ts            ← chrome.runtime.sendMessage
        └── lib/events.ts                       ← dwell, scroll, wishlist

lib/sites/adapters/index.ts          ← register per-retailer hooks
        ├── lib/sites/cos/            ← material passive watch, engagement, wishlist
        ├── lib/sites/asos/           ← engagement
        ├── lib/sites/net-a-porter/   ← engagement
        └── lib/sites/zara/           ← engagement, wishlist

lib/extractor.ts + lib/dom-extractor.ts   ← product fields (shared)
lib/wishlist.ts                             ← wishlist routing → sites/cos, sites/zara

background.ts                        ← session storage from messages
popup.tsx                            ← reads session
```

## Event model (Notion / backend aligned)

See `types/capture-events.ts` for the full taxonomy:

| Phase | Events |
|-------|--------|
| **Live now** | `PRODUCT_CAPTURED`, dwell/scroll milestones, wishlist add/remove, `SECTION_ENGAGEMENT` (details, materials, size guide, reviews) |
| **Next** | `size_selected`, `colour_selected`, `tab_open_count`, API sync to Supabase |
| **Later** | `add_to_cart`, `purchase_confirmed`, `cart_abandon`, `return_initiated` |

Flow today:

```text
ProductPageController.start()
  → startEngagementTracking()     ← attaches immediately (lazy product getter)
  → captureProduct() (+ retry)    → sendProductCaptured()
  → trackers → sendDwellMilestone / sendScrollMilestone / sendWishlist*
  → engagement clicks → sendSectionEngagement
  → background → ShopperSession in chrome.storage.local
```

Purchase events will use the same `messenger.ts` + `background.ts` `applySessionUpdate` pattern.

## Core principle: read-only on retailer sites

The extension **never clicks, opens drawers, or changes the page**. It only:

- Reads visible DOM (JSON-LD, OG, HTML)
- Observes shopper actions (scroll, dwell, clicks they make themselves)
- Passively watches for fields to appear when the shopper reveals them

COS material is captured only after the shopper opens Details → Materials themselves.

## Adding a new fashion site

### 1. URL match
Add hostname to `contents/capture.ts` `config.matches` and `lib/sites/registry.ts` `FASHION_DOMAINS`.

### 2. DOM extraction (if needed)
Extend `SITE_DOM_CONFIG` in `lib/dom-extractor.ts` for sizes, or add JSON-LD handling in `lib/extractor.ts`.

### 3. Lazy fields hidden behind UI (optional)
If material/sizes only appear after the shopper opens a section (e.g. COS materials drawer), add a **passive** `watchMaterialReveal` — MutationObserver only, no programmatic clicks:

```typescript
// lib/sites/cos/material.ts — startCosMaterialPassiveWatch
watchMaterialReveal: startCosMaterialPassiveWatch,
```

Register in `lib/sites/adapters/index.ts`. Use `startEngagementTracking` separately to log intentional section clicks for segmentation.

### 5. Wishlist (if toggle is unreliable)
If the retailer keeps `aria-label` unchanged or re-mounts the button (COS, Zara), add URL-scoped **logical state** in `lib/sites/<brand>/wishlist.ts` — see COS and Zara modules.

### 6. Tests
Add fixtures under `lib/__tests__/fixtures/` and tests next to the site module.

## Class vs modules?

| Use a **class** | Use **modules / adapters** |
|-----------------|----------------------------|
| Page lifecycle (start/stop cleanups on SPA nav) | Per-site DOM selectors |
| One instance per content script | Extraction pure functions |
| | Event send helpers |

We use **`ProductPageController`** only for orchestration — not one class per retailer.

## File map (capture layer)

| File | Responsibility |
|------|----------------|
| `lib/capture/page-controller.ts` | Orchestrate capture + hydration + trackers |
| `lib/capture/product-capture.ts` | `captureProduct()` |
| `lib/capture/hydration.ts` | Generic DOM watchers + delegate to `SiteAdapter` |
| `lib/capture/messenger.ts` | All `sendMessage` calls to background |
| `lib/capture/message-handler.ts` | `GET_PRODUCT` / `GET_SESSION` for popup |
| `lib/sites/types.ts` | `SiteAdapter` interface |
| `lib/sites/registry.ts` | Hostname helpers, `FASHION_DOMAINS` |
| `lib/sites/adapters/index.ts` | Adapter registry (COS, NAP, ASOS, Zara) |
| `lib/sites/*/engagement.ts` | Per-retailer section click tracking |
| `lib/sites/*/wishlist.ts` | Per-retailer wishlist when DOM is unreliable |
| `types/capture-events.ts` | Event type taxonomy (Notion-aligned) |
