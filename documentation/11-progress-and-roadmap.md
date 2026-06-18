# Progress & roadmap

Status of the extension against the [Extension Data Capture & Segmentation Engine](https://app.notion.com/p/Extension-Data-Capture-Segmentation-Engine-36ef963f48fc810bb07dea6c4475dffe) spec (Notion).

Last updated: June 2026.

---

## Executive summary

The extension architecture is in good shape for Phase 1. Product capture, dwell, scroll, wishlist, and **section engagement** all run through a single orchestrator (`ProductPageController`) with per-retailer adapters under `lib/sites/`. **78 unit tests** pass; Plasmo dev and production builds succeed.

What is **not** wired yet: backend API ingestion (`POST /api/v1/events`), server-side segmentation, cart/purchase detection, and auth. The popup shows a local session only.

---

## Notion spec alignment

The Notion doc defines a **capture taxonomy** (raw events) and a **segmentation engine** (derived shopper segments). Below is how the extension maps today.

### Capture taxonomy

| Notion / backend `event_type` | Extension status | Notes |
|------------------------------|------------------|-------|
| `page_view` | ✅ Local session | Fired as `PRODUCT_CAPTURED` → “Product page opened” |
| `dwell_milestone` | ✅ Live | 15s–180s milestones |
| `scroll_milestone` | ✅ Live | 25%–90% milestones |
| `wishlist_add` / `wishlist_remove` | ✅ Live | Site adapters for ASOS, COS, Zara; H&M group generic |
| `size_guide_view` | ✅ Partial | ASOS Size & Fit accordion; COS size guide click |
| `review_section_view` | ✅ Partial | COS reviews tab; Net-a-Porter reviews accordion |
| `material_section_view` | ✅ Partial | COS materials tab; Zara composition/care action |
| `details_section_view` | ✅ Partial | ASOS Product Details; NAP details; Zara shipping / in-store |
| `size_selected` | ❌ Not built | Priority 2 in project rules |
| `colour_selected` | ❌ Not built | |
| `add_to_cart` | ❌ Not built | |
| `cart_abandon` | ❌ Not built | |
| `purchase_confirmed` | ❌ Not built | |
| `return_initiated` | ❌ Phase 2 | |

### Segmentation engine (server-side)

| Notion capability | Extension status |
|-------------------|------------------|
| Rule-based segments (investment dresser, trend chaser, etc.) | ❌ Backend only — extension does not classify |
| `shopper_signals` derived from events | ❌ Requires API + Supabase |
| Segment shown in popup | ❌ Future web app |

The extension’s job in Phase 1 is to **capture signals accurately**. Segmentation runs after events land in Supabase.

---

## Site adapter coverage

| Retailer | Product extract | Wishlist | Section engagement | Material passive |
|----------|-----------------|----------|-------------------|------------------|
| **COS** | JSON-LD + DOM | ✅ Logical state + SVG paths | Details, materials, size guide, reviews | ✅ Drawer watch |
| **ASOS** | OG + DOM (no Product JSON-LD) | ✅ Heart class + click intent | Size & fit, product details | — |
| **Net-a-Porter** | JSON-LD ProductGroup | Generic | Size & fit, details, reviews | — |
| **Zara** | JSON-LD array + DOM | ✅ Logical state + bookmark sig | Composition, in-store, shipping | — |
| **Arket / Stories / H&M** | H&M group DOM | Generic `pdp-addToWishlist` | — | — |
| **Others in matches** | Generic extractors | Generic fallbacks | — | — |

---

## Architecture wins (recent)

1. **`ProductPageController`** — single lifecycle; `stop()` on SPA nav clears all trackers.
2. **Engagement decoupled from capture** — section click listeners attach immediately; product resolved lazily at click time (critical for React SPAs).
3. **Capture retry** — `startCaptureWithRetry()` polls up to 20s when PDP hydrates after `document_idle`.
4. **URL-scoped wishlist state** — COS and Zara survive unreliable DOM / button re-mounts (same pattern).
5. **`lib/capture/messenger.ts`** — all outbound messages in one place.
6. **Read-only principle** — never programmatically click retailer UI.

---

## Known gaps & risks

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Events stay in `chrome.storage.local` only | No cross-device, no segmentation | Wire `background.ts` → Hono API (next milestone) |
| SPA listener cleanup | Theoretical duplicate listeners on heavy SPA nav | `controller.stop()` on each `start()` — monitor |
| Plasmo dev build failures | Stale bundle in Chrome; changes appear “broken” | Reload extension after `Build failed`; run `yarn build` to verify |
| ASOS weak structured data | Capture depends on OG title + DOM | Retry + lazy engagement |
| Generic sites | Wishlist/engagement may miss | Add adapter per retailer as validated |

---

## Recommended next steps (priority order)

### 1. Backend event pipeline (unblocks everything else)

- [ ] Deploy Hono `POST /api/v1/events` on Railway
- [ ] Run Supabase schema (shoppers, events, sessions)
- [ ] From `background.ts`, queue and POST events after `applySessionUpdate`
- [ ] Anonymous shopper id in `chrome.storage.local` until auth

### 2. Complete Priority 1 capture (project rules)

- [ ] `size_selected` / `colour_selected` — generic + per-site where needed
- [ ] `tab_open_count` — already spec’d; wire `GET_TAB_COUNT` into session
- [ ] `return_visit_count` — URL history in `chrome.storage.local`

### 3. Engagement expansion

- [ ] H&M group engagement adapter (details / materials if exposed)
- [ ] ASOS reviews when section exists on PDP
- [ ] Validate Zara + ASOS on real devices after extension reload

### 4. Cart & purchase (Priority 2)

- [ ] `add_to_cart` — network + DOM (ASOS, Zara patterns differ)
- [ ] `purchase_confirmed` — URL + title heuristics
- [ ] `cart_abandon` — session-scoped cart without checkout

### 5. Segmentation engine (server)

- [ ] Rule-based `classifyShopper()` after each event ingest
- [ ] Write `shopper_signals` + `segment_history`
- [ ] Expose segment on `GET /api/v1/shoppers/:id` for future web app

### 6. Extension polish

- [ ] Popup: surface section engagement in activity feed labels (partially there via `recentEvents`)
- [ ] E2E smoke script or manual test checklist per retailer
- [ ] PostHog feature flags (optional)

---

## Definition of “Phase 1 done”

- [x] Extension captures product + dwell + scroll + wishlist on 4+ validated retailers
- [x] Section engagement on COS, ASOS, NAP, Zara
- [x] Popup shows live session from storage
- [x] Adapter pattern documented and tested
- [ ] Events persist to Supabase via API
- [ ] Rule-based segment computed server-side for test shoppers
- [ ] 500 MAU ready for web app feed (Phase 2 product)

---

## Test & build health

```bash
yarn tsc --noEmit   # typecheck
yarn test --run     # 78 tests (extractor, dom, wishlist, engagement per site)
yarn build          # production MV3 bundle
yarn dev            # watch → build/chrome-mv3-dev
```

Always **reload the extension** in `chrome://extensions` after a failed Plasmo build — hot reload does not reliably swap content scripts.
