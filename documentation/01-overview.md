# Overview — What is this extension?

## The big picture

Fohlioo is a fashion intelligence platform. **This repo is the browser extension** — the piece that sits in Chrome and collects data while someone shops.

Think of it as a **quiet observer** on supported fashion websites. It does not change how the site looks. It:

1. Notices when you're on a **product page** (a single item — e.g. a coat on COS, not the homepage)
2. **Reads** product info from the page (name, brand, price, sizes, images)
3. **Watches** what you do on that page (how long you stay, how far you scroll, wishlist, section clicks)
4. **Remembers** the latest session and shows it in the **popup** when you click the Fohlioo icon

That data will eventually feed the full Fohlioo platform (style profile for shoppers, analytics for brands). Right now, Phase 1 focuses on **capturing it reliably**.

## The three “places” code runs

Chrome extensions are split into isolated worlds. Ours has three:

| Place | File(s) | Plain English |
|-------|---------|---------------|
| **Content script** | `contents/capture.ts` | A small program injected **into the retailer page**. It can read the DOM and listen to scroll/clicks. It **cannot** call our API directly or draw the popup. |
| **Background (service worker)** | `background.ts` | The extension’s **back office**. It receives messages from the content script and writes to storage. No visible UI. |
| **Popup** | `popup.tsx` + components | The **small window** when you click the extension icon. React UI that reads session data and refreshes every few seconds. |

**Rule we follow:** Content scripts never call external APIs or storage-heavy logic alone — they **message the background**, which updates `chrome.storage.local`.

## Supported sites

Only URLs listed in `contents/capture.ts` → `config.matches` get the content script. Examples: COS, Net-a-Porter, ASOS, Zara, Arket, H&M, Reebok, and others.

If you're on Gmail or a non-fashion site, the extension does nothing — by design.

## What data we capture

### Product data (static-ish — from the page)

- Name, brand, price, currency, colour, category, material
- Images (one or many)
- Available sizes
- Stock status (when detectable)
- Which method found the data: JSON-LD, Open Graph, or DOM scraping

### Behaviour (dynamic — from the shopper)

- **Dwell time** — how long the tab was visible (pauses when you switch tabs)
- **Scroll depth** — furthest % down the page you scrolled
- **Wishlist** — saved vs not saved (site-specific adapters on ASOS, COS, Zara)
- **Section engagement** — intentional clicks on PDP sections (size guide, materials, details, reviews) — retailer-specific
- **Activity feed** — a short log of milestones (e.g. “Viewed for 30s”, “Opened size & fit”)

## What we deliberately do *not* do (Phase 1)

- No login / Supabase sync from the extension yet (storage is local in Chrome)
- No cart or purchase detection in the popup (some logic is planned in `events.ts` comments)
- No UI injected onto retailer pages (only the popup)
- No tracking on non-whitelisted domains

## Tech in one line

**Plasmo** (extension framework) + **TypeScript** + **React** (popup) + **Vitest** (tests) + **chrome.storage.local** (memory).
