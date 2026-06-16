# Popup & session state

What you see when you click the Fohlioo icon, and how that data is structured.

---

## Popup states

`popup.tsx` has three UI modes:

| State | When | What you see |
|-------|------|--------------|
| `loading` | First open, fetching session | Spinner + “Reading this page” |
| `empty` | No product on active tab | “No product detected” + hint to open a PDP |
| `ready` | Session available | Full `SessionDashboard` + pulsing “Live” badge |

---

## SessionDashboard sections

File: `components/session-dashboard.tsx`  
Styles: `popup.css`

### 1. Hero card
Product thumbnail, brand, name, price, stock dot, image count if multiple images.

### 2. Insight bar
“Live session on this product” + badge showing data source (JSON-LD / Open Graph / DOM).

### 3. Metric rings
Two circular progress indicators:
- **Dwell time** — formatted via `formatDwell()` (e.g. “1m 30s”)
- **Scroll depth** — percentage (e.g. “75%”)

Progress rings use `dwellProgress()` (caps at 180s = 100%) and `scrollProgress()`.

### 4. Engagement panel
Wishlist pill (♥ Saved / ♡ Not saved), colour, material, category, availability.

### 5. Sizes
Chip row when `product.sizes.length > 0`.

### 6. Activity feed
Last events from `session.recentEvents`, newest first — “Product page opened”, “Viewed for 30s”, “Added to wishlist”, etc.

### 7. Footer link
“View on site →” opens the product URL in a new tab.

---

## ShopperSession shape

Defined in `interface.ts`, managed in `lib/session.ts`.

```typescript
{
  product: ProductData,      // latest captured product
  dwellMs: number,             // highest dwell milestone (ms)
  scrollDepthPct: number,    // highest scroll milestone (%)
  wishlistStatus: 'saved' | 'not_saved' | 'unknown',
  recentEvents: SessionEvent[],  // max 10 entries
  updatedAt: string          // ISO timestamp
}
```

Each `SessionEvent`:

```typescript
{
  type: 'page_view' | 'wishlist_add' | 'wishlist_remove' | 'dwell_milestone' | 'scroll_milestone',
  label: string,       // human-readable for activity feed
  timestamp: string,
  value?: number       // optional ms or % for milestones
}
```

---

## How popup stays “live”

Two mechanisms in `popup.tsx`:

1. **Poll every 2 seconds** — `fetchShopperSession()` re-queries active tab
2. **Storage listener** — `watchSession()` updates when background writes `shopperSession`

`fetchShopperSession()` (`lib/popup-product.ts`):

1. Tries `chrome.tabs.sendMessage(activeTab, { type: 'GET_SESSION' })`
2. Content script responds with stored session **plus** live dwell/scroll from memory
3. If content script unavailable (wrong tab, no injection), falls back to `getShopperSession()` from storage only

---

## Storage keys

| Key | Contents |
|-----|----------|
| `shopperSession` | Full `ShopperSession` object |
| `latestProduct` | Copy of `session.product` for quick reads |

Both updated together in `setShopperSession()`.

---

## Session lifecycle

| Event | What happens |
|-------|--------------|
| First `PRODUCT_CAPTURED` | `buildInitialSession` — page_view event, metrics at 0 |
| Same URL, updated sizes | `applySessionUpdate` may merge if same product URL+name |
| New product URL | New initial session (different product) |
| Milestone / wishlist | `applySessionUpdate` — patch metrics + append event |

---

## Display helpers

| File | Used for |
|------|----------|
| `lib/format.ts` | Price (£55), availability labels, image pickers |
| `lib/session-format.ts` | Dwell duration, “Just now”, ring percentages |

---

## Customising the UI

| Change | Files |
|--------|-------|
| Colours, spacing, card shape | `popup.css` |
| Layout / new sections | `components/session-dashboard.tsx` |
| Poll interval | `setInterval(..., 2000)` in `popup.tsx` |
| Empty state copy | `popup.tsx` |

**Design note:** Popup uses custom CSS classes (not Tailwind) because the extension popup is separate from the main Fohlioo web app.

---

## sidepanel.tsx

Currently an empty file. Plasmo would use it for a Chrome Side Panel UI if we build one later — could mirror popup or show richer analytics.
