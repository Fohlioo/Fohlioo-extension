# Glossary

Jargon used in this codebase, explained simply.

| Term | Meaning |
|------|---------|
| **PDP** | Product Detail Page — a single product (not category/homepage). |
| **Content script** | JavaScript injected into retailer pages; can read DOM, not the popup. |
| **Background / service worker** | Extension process with no UI; handles messages and storage. |
| **Popup** | Small UI when you click the extension icon in the toolbar. |
| **Plasmo** | Framework that builds our Chrome extension from React + TypeScript files. |
| **MV3** | Manifest V3 — current Chrome extension platform (replaces MV2). |
| **JSON-LD** | Hidden JSON in the page (`application/ld+json`) describing the product for search engines. |
| **Open Graph (OG)** | `<meta property="og:...">` tags — title, image, sometimes price. |
| **DOM extraction** | Reading product info by querying HTML elements when structured data fails. |
| **SPA** | Single Page App — site changes URL without full reload (Zara, ASOS). We watch URL and recapture after 800ms. |
| **Dwell time** | Time user kept the product tab visible (pauses when tab hidden). |
| **Scroll depth** | Furthest % of page height scrolled. |
| **Milestone** | Threshold event (e.g. 30s dwell) sent once per page view. |
| **ShopperSession** | Our bundle of product + behaviour metrics + recent activity for the popup. |
| **ProductData** | Normalized product fields (name, price, sizes, etc.). |
| **mergeExtractedProductData** | Combines JSON-LD + OG + DOM without overwriting filled fields. |
| **chrome.storage.local** | Extension’s private persistent key-value store in the browser. |
| **sendMessage** | Chrome API to pass JSON between extension parts. |
| **GET_SESSION** | Popup → content script request for session + live metrics. |
| **PRODUCT_CAPTURED** | Content script → background “here is the product on this page”. |
| **Hydration** | React finishing rendering controls (e.g. size buttons) after first paint. |
| **Fixture** | Saved HTML/JSON snippet used in unit tests. |
| **Vitest** | Test runner (like Jest) for TypeScript. |
| **jsdom** | Fake browser DOM in Node for tests. |
| **RLS** | Row Level Security (Supabase) — future when we sync to backend. |
| **Phase 1** | Current scope: capture + local session + popup. No backend sync yet. |

---

## Retailer nicknames in code

| Code key | Site |
|----------|------|
| `cos.com` | COS |
| `asos.com` | ASOS |
| `arket.com` | Arket |
| `stories.com` | & Other Stories |
| `hm.com` | H&M |
| `net-a-porter.com` | Net-a-Porter |
| `zara.com` | Zara |

H&M group sites (COS, Arket, Stories, H&M) often share similar DOM patterns for sizes and wishlist.

---

## File suffixes

| Pattern | Meaning |
|---------|---------|
| `*.tsx` | TypeScript + React (UI) |
| `*.ts` | TypeScript logic |
| `contents/*.ts` | Plasmo content scripts |
| `lib/*` | Shared libraries imported by entry points |
| `types/*` | Message and API contracts |
| `__tests__/*` | Unit tests |
