# Behaviour tracking

How we observe **what the shopper does** on a product page — not just what the product is.

All tracking code runs in the **content script** (`capture.ts` starts it). Results are sent to **background** as messages and stored in `ShopperSession`.

Implementation lives in `lib/events.ts` (trackers) and `lib/wishlist.ts` (button detection).

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

**Reset:** New page view (`capturePageView`) calls `resetLiveMetrics()`.

---

## Scroll depth

**What it measures:** Maximum **percentage** of page height the user has scrolled through.

Formula roughly: `(scrollY + viewport height) / total document height × 100`.

**Milestones:**


| %              | When it fires                      |
| -------------- | ---------------------------------- |
| 25, 50, 75, 90 | First time user reaches that depth |


Sends `SCROLL_MILESTONE` to background.

**Throttling:** Scroll handler runs at most once per animation frame (~250ms effective) to avoid performance issues.

**Live counter:** `liveScrollDepthPct` always holds the current max.

---

## Wishlist (save / favourite / heart)

**What it measures:** User toggled “save for later” or equivalent.

**Hard part:** Every site uses different buttons, classes, and ARIA labels. Logic is split:

1. `**lib/wishlist.ts`** — find buttons, detect active/inactive state
2. `**lib/events.ts` → `startWishlistTracking**` — wire clicks + DOM mutations to callbacks

### Detection strategies


| Strategy             | When used                                                                       |
| -------------------- | ------------------------------------------------------------------------------- |
| **Click listener**   | User clicks; infer add vs remove from state *before* click                      |
| **MutationObserver** | Button `aria-label`, `class`, or `aria-pressed` changes without us seeing click |
| **Deferred attach**  | `waitForWishlistButton()` if React hasn’t rendered the button yet               |


### Site-specific notes

**ASOS (`saveForLater`):**

- Heart icon class toggles (`product-heartempty` vs `product-heartfilled`)
- `aria-label` often stays “Save for later” even when saved → we use **click intent** (flip state on click) plus heart class confirmation

**Arket / COS / H&M group (`pdp-addToWishlist`):**

- `aria-label` usually changes between add/remove

**Generic fallbacks:**

- Buttons with aria-label containing “wishlist”, “favourite”, “save for later”
- `data-testid`, `data-action="wishlist"`, etc.

### Messages


| User action | Message type      | Session update                |
| ----------- | ----------------- | ----------------------------- |
| Save        | `WISHLIST_ADD`    | `wishlistStatus: 'saved'`     |
| Unsave      | `WISHLIST_REMOVE` | `wishlistStatus: 'not_saved'` |


Activity feed gets “Added to wishlist” / “Removed from wishlist”.

### Double-fire prevention

- Click cooldown (~1.2s) before MutationObserver can fire duplicate events
- ASOS re-seeds button state after 150ms, 500ms, 1000ms

---

## What starts tracking?

In `capture.ts`, after a successful `captureProduct()`:

```text
startDwellTracking(product, onMilestone)
startScrollTracking(product, onMilestone)
startWishlistTracking(product, onAdd, onRemove)
```

All three receive the same `ProductData` so messages to background include product context.

**Note:** Trackers from a previous page view are not explicitly torn down in current code — new page view resets metrics; listeners accumulate on SPA nav (known area for future cleanup).

---

## Debug logs

On the **retailer page** console (not popup), filter `[Fohlioo:`:


| Category   | Colour / topic                |
| ---------- | ----------------------------- |
| `dwell`    | Green — milestones            |
| `scroll`   | Cyan — scroll %               |
| `wishlist` | Pink — clicks, attach         |
| `message`  | Gray — outbound to background |


Controlled by `lib/debug.ts` (off in production builds).

---

## Future (Phase 2 — not built yet)

Comments in `events.ts` mention cart detection, review section views, cart abandon. These will follow the same pattern: detect in content script → message background → update session/API.

---

## Changing behaviour


| Change                          | File                                       |
| ------------------------------- | ------------------------------------------ |
| Dwell milestone times           | `DWELL_MILESTONES_MS` in `events.ts`       |
| Scroll milestone %              | `SCROLL_MILESTONES_PCT` in `events.ts`     |
| New site wishlist button        | `WISHLIST_SITE_SELECTORS` in `wishlist.ts` |
| Ring progress max (3 min dwell) | `dwellProgress()` in `session-format.ts`   |


