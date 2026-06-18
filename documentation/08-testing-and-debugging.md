# Testing & debugging

How to verify changes work and how to diagnose issues.

---

## Daily dev workflow

```bash
cd fohlioo-extension
yarn install
yarn dev          # watch build → build/chrome-mv3-dev
```

**Load in Chrome:**
1. `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `build/chrome-mv3-dev`
4. Open a supported product page (e.g. COS, ASOS)
5. Click Fohlioo icon to open popup

After code changes, click **Reload** on the extension card. Refresh the retailer tab if you see “Context invalidated”.

---

## Running tests

```bash
yarn test          # watch mode
yarn test --run    # single run (CI-style)
yarn tsc --noEmit  # typecheck only
yarn build         # production bundle
```

**Stack:** Vitest + jsdom (`vitest.config.ts`).

Tests live in `lib/__tests__/`. They do **not** load the full Chrome extension — they import pure functions and feed them HTML/JSON fixtures.

| Test file | Covers |
|-----------|--------|
| `extractor.test.ts` | JSON-LD parsing |
| `dom-extractor.test.ts` | DOM sizes, merge |
| `wishlist.test.ts` | ASOS, COS, Zara wishlist |
| `*-engagement.test.ts` | ASOS, NAP, Zara section clicks |
| `product-merge.test.ts` | Sticky product fields |

**Current count:** 78 tests (`yarn test --run`).

**Fixtures:** `lib/__tests__/fixtures/` — paste real retailer snippets when adding sites.

---

## Extension reload (important)

If `yarn dev` shows **`Build failed`** or **`Expression expected`**, Chrome may be running a **stale bundle**. Fixes:

1. Run `yarn build` to confirm clean compile
2. **Reload** extension at `chrome://extensions`
3. **Hard refresh** the retailer tab (Cmd+Shift+R)

Content scripts do not always hot-swap after a failed build — symptoms look like “tracking never works”.

---

## Debug logging

**Where:** DevTools on the **retailer product page** (F12 on asos.com, not on popup).

**Filter console:** `Fohlioo`

**Source:** `lib/debug.ts` — only logs when `NODE_ENV !== 'production'`.

| Tag | Meaning |
|-----|---------|
| `[Fohlioo:capture]` | Product extracted or skipped |
| `[Fohlioo:sizes]` | Size hydration, DOM watch |
| `[Fohlioo:dwell]` | Dwell tracking start/stop/milestones |
| `[Fohlioo:scroll]` | Scroll milestones |
| `[Fohlioo:wishlist]` | Button found, clicked, add/remove |
| `[Fohlioo:spa]` | URL changed, recapture scheduled |
| `[Fohlioo:message]` | Outbound message to background |

---

## Common issues

### Popup says “No product detected”

- Tab is not a **product detail page** (needs name or brand from extractors)
- Site URL not in `config.matches` in `capture.ts`
- Content script failed — check page console for errors
- Extension not reloaded after build

### Sizes empty in popup

- JSON-LD often has no sizes — DOM must fill them
- SPA: sizes load late — wait a few seconds or check `[Fohlioo:sizes]` logs
- Add/fix selectors in `dom-extractor.ts` for that retailer

### Wishlist not updating

- Check `[Fohlioo:wishlist]` — “buttonsFound: 0” means selector mismatch
- ASOS: verify click on `saveForLater` logs “WISHLIST_ADD → background”
- Open popup — wishlist status should show in Engagement panel

### Dwell/scroll stuck at 0 in popup

- Milestones only **store** at 15s, 25%, etc. — between milestones, live values still update via GET_SESSION poll
- If always 0: content script not running or GET_SESSION failing (popup falls back to stale storage)

### “Context invalidated. Press to Reload.”

Normal during `yarn dev` when extension rebuilds. **Refresh the product tab.**

### Messages not reaching background

- Service worker asleep — interact with extension or check `chrome://extensions` → “Service worker” link for background console
- Wrong tab — popup queries **active** tab in **current window**

---

## Inspecting storage

**Chrome DevTools → Application → Storage → Extension storage → Local**

Look for keys:
- `shopperSession`
- `latestProduct`

Or in background service worker console:

```javascript
chrome.storage.local.get(['shopperSession'], console.log)
```

---

## Adding a test for a new site

1. Save minimal HTML or JSON-LD to `lib/__tests__/fixtures/your-site.json`
2. In test, set `document.body.innerHTML` or parse JSON in extractor test
3. Assert expected `sizes`, `price`, or wishlist state
4. Run `yarn test --run`

---

## Production build

```bash
yarn build   # → build/chrome-mv3-prod
```

Debug logs are stripped/disabled via `NODE_ENV === 'production'` in `debug.ts`.

---

## What is not tested yet

- Full `capture.ts` integration in real Chrome
- `background.ts` message handler end-to-end
- Popup React components (no component tests yet)

Manual QA on 2–3 retailers after behavioural changes is still recommended.
