# Fohlioo Browser Extension

The Fohlioo extension is the **data capture engine** for the Fohlioo platform. It runs passively on supported fashion retailer sites, extracts structured product data from each product page, and surfaces it in the extension popup.

**Slogan:** Better choices. Smarter collections.  
**Domain:** [fohlioo.com](https://fohlioo.com)

This repo is a [Plasmo](https://docs.plasmo.com/) project (Manifest V3, React, TypeScript).

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project structure](#project-structure)
- [Setup](#setup)
- [Running the extension (development)](#running-the-extension-development)
- [Building for production](#building-for-production)
- [Testing](#testing)
- [Architecture](#architecture)
- [Product extraction pipeline](#product-extraction-pipeline)
- [Adding support for a new retailer](#adding-support-for-a-new-retailer)
- [Debugging tips](#debugging-tips)
- [Contributing](#contributing)
- [Scripts reference](#scripts-reference)
- [Further reading](#further-reading)

---

## What it does

On supported fashion sites, the extension:

1. Detects product detail pages (PDPs)
2. Extracts product metadata (name, brand, price, images, sizes, etc.)
3. Stores the latest capture in `chrome.storage.local`
4. Displays the captured product in the popup UI

Supported sites are listed in `contents/capture.ts` under `config.matches`. Current targets include COS, Net-a-Porter, ASOS, Zara, Toteme, Reiss, Stories, Arket, H&M, and Reebok.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Extension framework | [Plasmo](https://docs.plasmo.com/) 0.90 |
| Language | TypeScript (strict) |
| Popup UI | React 18 |
| Manifest | MV3 |
| Storage | `chrome.storage.local` |
| Tests | [Vitest](https://vitest.dev/) + jsdom |
| Package manager | Yarn |

---

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **Yarn** 1.x (project uses `yarn.lock`)
- **Google Chrome** (or Chromium-based browser) for loading the unpacked extension

---

## Project structure

```
fohlioo-extension/
├── assets/                  # Icons, logo (SVG/PNG)
├── components/
│   └── product-preview.tsx  # Popup product card UI
├── contents/
│   └── capture.ts           # Content script — runs on fashion PDPs
├── lib/
│   ├── __tests__/           # Vitest unit tests + JSON-LD fixtures
│   │   └── fixtures/        # Real retailer JSON-LD samples
│   ├── dom-extractor.ts     # DOM fallback extraction (sizes, price, etc.)
│   ├── extractor.ts         # JSON-LD + OG extraction + merge logic
│   ├── format.ts            # Price/image formatting helpers
│   ├── popup-product.ts     # Popup ↔ active tab communication
│   ├── site-patterns.ts     # Documented JSON-LD patterns per retailer
│   └── storage.ts           # chrome.storage.local helpers
├── types/
│   └── messages.ts          # Extension message types
├── background.ts              # Service worker — persists captures
├── interface.ts               # ProductData type (shared contract)
├── popup.tsx                  # Extension popup entry
├── popup.css                  # Popup styles
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

### Key files to know

| File | Responsibility |
|------|----------------|
| `contents/capture.ts` | Orchestrates capture on page load + SPA navigation |
| `lib/extractor.ts` | JSON-LD parsing (NAP, Zara, single Product, etc.) |
| `lib/dom-extractor.ts` | Fills gaps JSON-LD/OG cannot provide (e.g. COS sizes) |
| `background.ts` | Receives `PRODUCT_CAPTURED` messages, writes to storage |
| `popup.tsx` | Reads latest product and renders `ProductPreview` |

---

## Setup

```bash
# Clone the repo (if you haven't already)
git clone <repository-url>
cd fohlioo-extension

# Install dependencies
yarn install
```

No `.env` file is required for local development at this stage. When the backend API is wired up, env vars will use the Plasmo convention:

```
PLASMO_PUBLIC_API_URL=http://localhost:3000
```

---

## Running the extension (development)

### 1. Start the dev server

```bash
yarn dev
```

Plasmo watches for file changes and rebuilds into `build/chrome-mv3-dev/`.

### 2. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the folder: `fohlioo-extension/build/chrome-mv3-dev`

You should see **DEV | Fohlioo extension** in your extensions list.

### 3. Test on a product page

1. Visit a supported retailer product page, e.g.  
   `https://www.cos.com/en-gb/...` (any PDP)
2. Click the Fohlioo extension icon in the toolbar
3. The popup should show the captured product (name, price, image, sizes, etc.)

### 4. Hot reload behaviour

- **Popup / background changes** — Plasmo usually hot-reloads automatically
- **Content script changes** — refresh the product tab, or click the reload icon on `chrome://extensions` for the extension
- If capture looks stale after code changes, hard-reload the product page (`Cmd+Shift+R`)

---

## Building for production

```bash
yarn build
```

Output: `build/chrome-mv3-prod/`

To create a zip for distribution:

```bash
yarn package
```

Load `build/chrome-mv3-prod` the same way as the dev build to smoke-test production output before publishing.

---

## Testing

Tests use **Vitest** with a **jsdom** environment (simulates `document` for extractor tests).

### Run all tests once

```bash
yarn test
```

### Watch mode (re-runs on file changes)

```bash
yarn test:watch
```

### Type-check without emitting

```bash
yarn tsc --noEmit
```

### What is covered

| Test file | What it validates |
|-----------|-------------------|
| `lib/__tests__/extractor.test.ts` | JSON-LD patterns (Net-a-Porter ProductGroup, Zara multi-Product) |
| `lib/__tests__/dom-extractor.test.ts` | DOM size/price parsing, COS `size-selector-button-*` buttons, merge pipeline |

### Fixtures

Real JSON-LD snapshots live in `lib/__tests__/fixtures/`:

- `nap-product.json` — Net-a-Porter ProductGroup
- `zara-product.json` — Zara array-of-Products pattern
- `cos-product.json` — COS single Product (no sizes in JSON-LD)
- `rebook-product.json` — Reebok offers with `sizeSpecification`

When you fix a retailer-specific bug, **add or update a fixture** and a test. This prevents regressions.

### Writing a new extractor test

```typescript
import { afterEach, describe, expect, test } from 'vitest'
import { extractFromJsonLd } from '../extractor'

function mockPage(jsonLdData: object) {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(jsonLdData)
  document.head.appendChild(script)
}

describe('My retailer', () => {
  afterEach(() => {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => s.remove())
  })

  test('extracts product name', () => {
    mockPage({ /* fixture */ })
    const result = extractFromJsonLd()
    expect(result.name).toBe('Expected name')
  })
})
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Fashion PDP (cos.com, zara.com, …)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  contents/capture.ts (content script)                │   │
│  │                                                      │   │
│  │  extractFromJsonLd() ──┐                            │   │
│  │  extractFromOG()     ──┼──► mergeExtractedProductData│   │
│  │  extractFromDom()    ──┘         │                   │   │
│  │                                  ▼                   │   │
│  │                         ProductData | null           │   │
│  │                                  │                   │   │
│  │                    chrome.runtime.sendMessage        │   │
│  └──────────────────────────────────┼───────────────────┘   │
└─────────────────────────────────────┼───────────────────────┘
                                      │ PRODUCT_CAPTURED
                                      ▼
                         ┌────────────────────────┐
                         │  background.ts           │
                         │  chrome.storage.local    │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  popup.tsx             │
                         │  ProductPreview UI     │
                         └────────────────────────┘
```

### Message types

Defined in `types/messages.ts`:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `PRODUCT_CAPTURED` | Content → Background | Persist latest `ProductData` |
| `GET_PRODUCT` | Popup → Content | Request fresh capture from active tab |

---

## Product extraction pipeline

Data is merged in strict priority order. Each layer only fills **fields that are still missing**.

```
1. JSON-LD   (richest — schema.org Product / ProductGroup)
2. Open Graph (og:title, og:image, product:price:amount, …)
3. DOM       (visible UI — size buttons, h1, price elements, …)
```

### JSON-LD patterns handled

| Pattern | Retailers | Notes |
|---------|-----------|-------|
| `ProductGroup` + `hasVariant[]` | Net-a-Porter, MR Porter | Sizes on variant nodes; NAP uses array `priceSpecification` |
| Array of `Product` nodes | Zara | One node per size |
| Single `Product` + `offers[]` | COS, Reebok/Shopify | Reebok sizes in `offers[].sizeSpecification.size` |
| Single `Product` | Toteme, Arket, ASOS | Standard `offers.price` |

See `lib/site-patterns.ts` for a living reference.

### DOM fallback highlights

Used when JSON-LD/OG lack data (common for **COS sizes**):

- H&M group sites use `data-testid="size-selector-button-XS"` etc.
- Generic size picker selectors for other retailers
- SPA hydration: if sizes are empty on first capture, a `MutationObserver` re-captures for up to 10 seconds

### ProductData shape

```typescript
interface ProductData {
  url: string
  name: string | null
  brand: string | null
  price: number | null
  originalPrice: number | null
  currency: string | null
  category: string | null
  colour: string | null
  material: string | null
  images: string | string[] | null   // string for one image, array for gallery
  availability: 'in_stock' | 'out_of_stock' | 'unknown'
  sizes: string[]
  capturedAt: string
  extractionSource: 'json_ld' | 'open_graph' | 'dom'
}
```

---

## Adding support for a new retailer

### 1. Allow the content script to run

Add the domain to `contents/capture.ts`:

```typescript
export const config: PlasmoCSConfig = {
  matches: [
    // …existing sites
    'https://*.newbrand.com/*',
  ]
}
```

Rebuild / reload the extension.

### 2. Inspect JSON-LD on a real PDP

In Chrome DevTools → Elements, search for:

```html
<script type="application/ld+json">
```

Copy the JSON into `lib/__tests__/fixtures/newbrand-product.json` and write a test.

### 3. Document the pattern

Add an entry to `lib/site-patterns.ts`:

```typescript
"newbrand.com": "Single Product — offers.price",
```

### 4. Add DOM overrides if needed

If sizes/prices are not in JSON-LD, add selectors in `lib/dom-extractor.ts` under `SITE_DOM_CONFIG`:

```typescript
'newbrand.com': {
  sizes: {
    container: '[data-testid="size-picker"]',
    option: 'button[data-testid^="size-"]',
  },
},
```

### 5. Verify end-to-end

1. `yarn test`
2. `yarn dev` → reload extension
3. Open a PDP → open popup → confirm all fields

---

## Debugging tips

### Popup shows "No product detected"

- Confirm you are on a **product detail page**, not a category or home page
- Check the domain is in `config.matches`
- Hard-refresh the tab after reloading the extension

### Sizes missing (SPA sites like COS, Zara)

- Open DevTools on the PDP → inspect size buttons
- Check for `data-testid` attributes (COS uses `size-selector-button-{SIZE}`)
- Wait a few seconds — the content script re-captures when the size grid hydrates
- Add/update selectors in `lib/dom-extractor.ts`

### Inspect stored capture

In DevTools on the extension service worker (`chrome://extensions` → Fohlioo → "Service worker"):

```javascript
chrome.storage.local.get('latestProduct', console.log)
```

### Content script console

On the product page, DevTools → Console. Filter by the content script context (top-left context dropdown in DevTools).

### Common reload checklist

1. `yarn dev` is running
2. Extension reloaded on `chrome://extensions`
3. Product tab hard-refreshed
4. Popup closed and reopened

---

## Contributing

### Branch workflow

1. Create a feature branch from `main`
2. Make focused changes (one retailer or one concern per PR when possible)
3. Add or update tests for extraction logic
4. Run `yarn test` and `yarn tsc --noEmit` before opening a PR
5. Include in the PR description:
   - Retailer(s) affected
   - Screenshot of popup on a real PDP (if UI changed)
   - Sample JSON-LD or DOM notes for new sites

### Code conventions

- **TypeScript strict** — no `any`; shared types in `interface.ts` and `types/`
- **No `localStorage`** — use `chrome.storage.local` only
- **No direct API calls from content scripts** — route through `background.ts`
- **Path alias** — `~lib/...`, `~types/...` maps to project root (`tsconfig.json`)
- **File naming** — kebab-case for files, PascalCase for React components
- **Comments** — only for non-obvious retailer-specific behaviour

### What not to do

- Do not capture data on non-fashion sites outside the match list
- Do not intercept unrelated network requests
- Do not use MV2 patterns
- Do not commit secrets or `.env` files with API keys

### Questions?

Contact: hello@fohlioo.co

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Plasmo dev server → `build/chrome-mv3-dev/` |
| `yarn build` | Production build → `build/chrome-mv3-prod/` |
| `yarn package` | Zip production build for store submission |
| `yarn test` | Run Vitest once |
| `yarn test:watch` | Run Vitest in watch mode |
| `yarn tsc --noEmit` | Type-check without building |

---

## Further reading

- [Plasmo documentation](https://docs.plasmo.com/)
- [Chrome Extension MV3 overview](https://developer.chrome.com/docs/extensions/mv3/)
- [schema.org Product](https://schema.org/Product)
- Fohlioo project rules (full platform context): `../.cursor/rules/fohlioo.mdc` in the monorepo root
