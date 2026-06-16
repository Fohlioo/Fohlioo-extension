# Messages & storage

How the three parts of the extension communicate — and where data lives.

---

## Why messages exist

Chrome isolates:

- **Content scripts** (inside asos.com)
- **Background** (extension service worker)
- **Popup** (extension UI)

They cannot share variables. They pass **JSON messages** via `chrome.runtime.sendMessage` and `chrome.tabs.sendMessage`.

All message **shapes** are defined in `types/messages.ts`.

---

## Message catalogue

### Content script → Background

| Type | Payload | Background action |
|------|---------|-------------------|
| `PRODUCT_CAPTURED` | `{ data: ProductData }` | Create new `ShopperSession`, save storage |
| `WISHLIST_ADD` | `{ data: ProductData }` | Update wishlist + activity event |
| `WISHLIST_REMOVE` | `{ data: ProductData }` | Update wishlist + activity event |
| `DWELL_MILESTONE` | `{ data, milestoneMs }` | Update `dwellMs` + activity event |
| `SCROLL_MILESTONE` | `{ data, milestonePct }` | Update `scrollDepthPct` + activity event |

Sent from `capture.ts` via `chrome.runtime.sendMessage`.

Failures are silently caught (extension reload during dev).

### Popup / external → Content script

| Type | Response | Purpose |
|------|----------|---------|
| `GET_PRODUCT` | `{ success, data: ProductData \| null }` | Re-capture product on demand (legacy path) |
| `GET_SESSION` | `{ success, session, live?: { dwellMs, scrollDepthPct } }` | Session + live metrics for popup |

Handled in `capture.ts` → `chrome.runtime.onMessage.addListener`.

`GET_SESSION` also triggers a fresh capture so product/sizes stay current.

### Popup → Background (indirect)

Popup mostly reads **storage** rather than messaging background directly.

Exception: future API calls will go through background (not implemented in Phase 1).

### Any → Background

| Type | Response | Purpose |
|------|----------|---------|
| `GET_TAB_COUNT` | `{ count: number }` | Count open tabs on fashion domains (for future tab_open_count signal) |

---

## GET_SESSION flow (detailed)

```text
popup.tsx
  └─ fetchShopperSession()
       └─ chrome.tabs.query({ active: true })
       └─ chrome.tabs.sendMessage(tabId, { type: 'GET_SESSION' })
            └─ capture.ts listener
                 ├─ captureProduct()  (fresh extract)
                 ├─ publishCapture() if product found
                 ├─ getShopperSession() from storage
                 ├─ getLiveMetrics() from events.ts
                 └─ sendResponse({ session merged with live })
```

Popup merges:

```text
dwellMs = max(stored.dwellMs, live.dwellMs)
scrollDepthPct = max(stored.scrollDepthPct, live.scrollDepthPct)
```

---

## Storage

**API:** `chrome.storage.local` (persists across browser restarts; not synced to cloud).

**We never use `localStorage`** — extension rules + Plasmo best practice.

| Key | Written by | Read by |
|-----|------------|---------|
| `shopperSession` | `lib/session.ts` → `setShopperSession` | Background, popup, content script (GET_SESSION) |
| `latestProduct` | Same write as above | `lib/storage.ts` fallback |

### Session update logic

`applySessionUpdate(product, event, patch)`:

1. Load existing session
2. If same product (URL + name match) → extend it
3. Else → new `buildInitialSession(product)`
4. Append event (keep last 10)
5. Apply patch (`dwellMs`, `wishlistStatus`, etc.)
6. Save

---

## Type safety

`ExtensionMessage` union in `types/messages.ts` lists all inbound background message types.

Content script listener types `GetProductMessage | GetSessionMessage` for inbound popup requests.

Shared data types live in `interface.ts` — import from there, not duplicated.

---

## Rules (from project conventions)

1. **Content scripts do not call the Fohlioo API directly** — background will (Phase 1: local only)
2. **All capture events go through background** before storage
3. **Popup prefers GET_SESSION** over storage-only for live metrics
4. **Never log PII to console in production** — use `fohliooLog` which is dev-only

---

## Adding a new message type

Checklist:

1. Add type to `types/messages.ts` (+ extend `ExtensionMessage` if background handles it)
2. Send from `capture.ts` (or popup)
3. Handle in `background.ts` → update session or API
4. Document in this file
5. If popup needs it, extend `fetchShopperSession` or add listener

Example future message: `ADD_TO_CART` → same pattern as wishlist.

---

## Async responses

Listeners return `true` when using `sendResponse` asynchronously:

```typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_SESSION') {
    getShopperSession().then((session) => {
      sendResponse({ success: true, session })
    })
    return true  // keep channel open
  }
})
```

Without `return true`, the popup would get `undefined`.
