# Behaviour tracking

How we observe **what the shopper does** on a product page — not just what the product is.

All tracking runs in the **content script** via `ProductPageController` (`lib/capture/page-controller.ts`). Results are sent to **background** as messages and stored in `ShopperSession`.

Implementation: `lib/events.ts` (dwell, scroll, wishlist), `lib/wishlist.ts` (button routing), `lib/sites/*/engagement.ts` (section clicks).

---

## Dwell time

**What it measures:** How long the product tab was **visible** to the user.

**Why visibility matters:** If you switch to another tab, the clock pauses. Uses the Page Visibility API (`document.visibilitychange`).

**Milestones fired** (messages to background):

| Seconds | Event label example |
| ------- | ------------------- |
| 15      | Viewed for 15s      |
| 30      | Viewed for 30s      |
| 60      | Viewed for 60s      |
| 90      | Viewed for 90s      |
| 120     | Viewed for 120s     |
| 180     | Viewed for 180s     |

Each milestone sends `DWELL_MILESTONE` once per page view.

**Live counter:** `liveDwellMs` updates every 5s (and on visibility change) so the popup can show time between milestones via `getLiveMetrics()`.

**Reset:** `ProductPageController.stop()` calls `resetLiveMetrics()` on SPA navigation.

---

## Scroll depth

**What it measures:** Maximum **percentage** of page height the user has scrolled through.

**Milestones:** 25%, 50%, 75%, 90% — sends `SCROLL_MILESTONE` to background.

**Throttling:** Scroll handler runs at most once per animation frame.

**Live counter:** `liveScrollDepthPct` always holds the current max.

---

## Wishlist (save / favourite / heart)

**What it measures:** User toggled “save for later” or equivalent.

Logic is split:

1. **`lib/wishlist.ts`** — find buttons, route to site modules
2. **`lib/sites/cos/wishlist.ts`**, **`lib/sites/zara/wishlist.ts`** — URL-scoped logical state when DOM lies
3. **`lib/events.ts` → `startWishlistTracking`** — clicks + MutationObserver

### Detection strategies

| Strategy | When used |
| -------- | --------- |
| **Click listener** | Infer add vs remove from state *before* click |
| **URL-scoped logical state** | COS, Zara — DOM/aria unreliable or button re-mounts |
| **MutationObserver** | Backup when attributes change without click |
| **Deferred attach** | `waitForWishlistButton()` if React hasn’t rendered yet |

### Site-specific notes

| Site | Selector / pattern | State detection |
|------|-------------------|-----------------|
| **ASOS** | `data-testid="saveForLater"` | Heart class + click intent |
| **COS** | `data-testid="wishlist-button"` | SVG path signatures + logical state |
| **Zara** | `data-qa-action="add-to-wishlist"` | Bookmark signature + logical state |
| **H&M group** | `pdp-addToWishlist` | `aria-label` add/remove |

### Messages

| User action | Message type | Session update |
| ----------- | ------------ | -------------- |
| Save | `WISHLIST_ADD` | `wishlistStatus: 'saved'` |
| Unsave | `WISHLIST_REMOVE` | `wishlistStatus: 'not_saved'` |

### Double-fire prevention

- Click cooldown (~1.2s) before MutationObserver can duplicate
- COS/Zara: deferred confirm at 150ms / 400ms / 800ms
- ASOS: re-seed at 150ms, 500ms, 1000ms

---

## Section engagement (segmentation signals)

**What it measures:** Intentional clicks on PDP sections that indicate consideration depth — size guide, materials, details, reviews.

**Principle:** Read-only. Never open accordions or drawers programmatically.

**Flow:**

```text
Shopper clicks section control
  → site adapter classifies click (e.g. ASOS Size & Fit → size_guide)
  → sendSectionEngagement(product, section, label)
  → background → SessionEvent (details_section_view, material_section_view, etc.)
```

Engagement attaches **immediately** on page start (not gated on product capture). Product is resolved lazily at click time.

### Retailer coverage

| Retailer | Triggers | Maps to |
|----------|----------|---------|
| **COS** | Details, materials tab, size guide, reviews | `details`, `materials`, `size_guide`, `reviews` |
| **ASOS** | Size & Fit accordion, Product Details | `size_guide`, `details` |
| **Net-a-Porter** | Accordion headings (size & fit, details, reviews) | `size_guide`, `details`, `reviews` |
| **Zara** | Composition/care, in-store stock, shipping actions | `materials`, `details` (per-action labels) |

Zara dedupes **per action** (not per section) because multiple buttons map to `details`.

### Adding engagement for a new site

1. Create `lib/sites/<brand>/engagement.ts`
2. Export `startXEngagementTracking(getProduct: () => ProductData)`
3. Register in `lib/sites/adapters/<brand>.ts`
4. Add tests in `lib/__tests__/<brand>-engagement.test.ts`

---

## What starts tracking?

`contents/capture.ts` calls `startCaptureWithRetry()`:

```text
ProductPageController.start()
  → startEngagementTracking()     ← always (lazy product)
  → captureProduct() (+ retry)    ← may fail first on SPAs
  → startDwellTracking / startScrollTracking / startWishlistTracking
```

On SPA URL change, `controller.stop()` clears all listeners before restart.

---

## Debug logs

On the **retailer page** console, filter `[Fohlioo:`:

| Category | Topic |
| -------- | ----- |
| `capture` | Product, engagement attach, content script load |
| `dwell` | Milestones |
| `scroll` | Scroll % |
| `wishlist` | Clicks, logical state |
| `message` | Outbound to background |
| `spa` | Navigation recapture |

Controlled by `lib/debug.ts` (off in production builds).

---

## Future (not built yet)

| Signal | Priority |
|--------|----------|
| `size_selected` / `colour_selected` | P1 extension rules |
| `add_to_cart` | P2 |
| `purchase_confirmed` | P2 |
| `cart_abandon` | P2 |
| `review_section_view` via Intersection Observer | P2 (COS/NAP use clicks today) |

---

## Changing behaviour

| Change | File |
| ------ | ---- |
| Dwell milestone times | `DWELL_MILESTONES_MS` in `events.ts` |
| Scroll milestone % | `SCROLL_MILESTONES_PCT` in `events.ts` |
| New site wishlist | `lib/sites/<brand>/wishlist.ts` + `wishlist.ts` registry |
| New site engagement | `lib/sites/<brand>/engagement.ts` + adapter |
| Ring progress max (3 min dwell) | `dwellProgress()` in `session-format.ts` |
