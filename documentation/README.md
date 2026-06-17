# Fohlioo Extension — Documentation

Plain-English guides to how this codebase works. Start here if the repo feels confusing.

## Who this is for

- New developers joining the project
- You, coming back after a break and forgetting where things live
- Anyone who wants to understand **what runs where** without reading every file

## Read in this order

| # | Document | What you'll learn |
|---|----------|-------------------|
| 1 | [Overview](./01-overview.md) | What the extension does and why it exists |
| 2 | [How everything connects](./02-how-it-connects.md) | The full journey from a product page to the popup |
| 3 | [File reference](./03-file-reference.md) | What every file and folder is responsible for |
| 4 | [Product extraction](./04-product-extraction.md) | How we read name, price, sizes from retailer sites |
| 5 | [Behaviour tracking](./05-behaviour-tracking.md) | Dwell time, scroll depth, wishlist — how we watch the shopper |
| 6 | [Popup & session state](./06-popup-and-session.md) | The UI you see when you click the extension icon |
| 7 | [Messages & storage](./07-messages-and-storage.md) | How the content script, background, and popup talk |
| 8 | [Testing & debugging](./08-testing-and-debugging.md) | Running tests, reading logs, common gotchas |
| 9 | [Glossary](./09-glossary.md) | Jargon explained simply |
| 10 | [Architecture](./10-architecture.md) | How to scale new sites and events — folder layout, class vs modules |

## One-sentence summary

**The extension quietly watches you browse fashion product pages, extracts product details from the page, tracks how you engage (time, scroll, wishlist), stores that in Chrome storage, and shows it live in the popup.**

## Quick map

```
Fashion product page (COS, ASOS, Zara, …)
        │
        ▼
  contents/capture.ts     ← runs inside the page
        │
        ├── lib/extractor.ts      (read structured data)
        ├── lib/dom-extractor.ts  (read HTML when needed)
        ├── lib/events.ts         (dwell, scroll, wishlist)
        │
        ▼  chrome.runtime.sendMessage
  background.ts           ← extension “brain” (no UI)
        │
        ▼  chrome.storage.local
  popup.tsx               ← what you see when you click the icon
        └── components/session-dashboard.tsx
```

For setup commands (`yarn dev`, loading in Chrome), see the root [README.md](../README.md).
