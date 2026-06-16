# Product extraction

How we turn a messy retailer web page into a clean `ProductData` object.

## The problem

Every fashion site structures product pages differently:

- Some embed rich **JSON-LD** (structured data for Google)
- Some only have **Open Graph** tags (`og:title`, `og:image`)
- Some hide **sizes** in React components with no structured data (Zara, ASOS dropdown)

We use a **waterfall**: try the best source first, then fill gaps with the next.

## The pipeline

```
1. extractFromJsonLd()     ← lib/extractor.ts
2. extractFromOG()         ← lib/extractor.ts
3. extractFromDom()        ← lib/dom-extractor.ts
4. mergeExtractedProductData(a, b, c)   ← only fills fields that are still empty
```

**Priority label** on the result (`extractionSource`):
- `json_ld` if JSON-LD contributed anything
- else `open_graph` if OG did
- else `dom`

Called from `capture.ts` → `captureProduct()`.

## JSON-LD — what is it?

Retailers put invisible JSON in the page for search engines:

```html
<script type="application/ld+json">
  { "@type": "Product", "name": "...", "offers": { "price": "55" } }
</script>
```

`extractFromJsonLd()` loops all such scripts, finds `Product` or `IndividualProduct`, and maps fields to our shape.

### Retailer-specific handling (in `extractor.ts`)

| Site pattern | Challenge | Approach |
|--------------|-----------|----------|
| Net-a-Porter / Mr Porter | `ProductGroup` with `hasVariant` | Pick variant matching URL or first variant |
| Zara | Array of `Product` (one per size) | Merge sizes from all products; price from first |
| Reebok | `offers[]` with `sizeSpecification` | Sizes from each offer |
| NAP pricing | `priceSpecification` array with Strikethrough type | Current vs original price |

See also `lib/site-patterns.ts` for quick notes.

## Open Graph — backup

Meta tags like:

```html
<meta property="og:title" content="Knit Polo" />
<meta property="product:price:amount" content="55" />
```

Used when JSON-LD is missing fields. Usually weaker on sizes.

## DOM fallback — last resort

`dom-extractor.ts` queries the live HTML:

- **Name:** `h1`, `[data-testid="product-title"]`, etc.
- **Price:** `[data-price]`, `[itemprop="price"]`, etc.
- **Sizes:** per-site config in `SITE_DOM_CONFIG`

### Examples

**COS / Arket / Stories / H&M (same group):**
```text
button[data-testid^="size-selector-button-"]
```

**ASOS:**
```text
select#variantSelector inside [data-testid="variant-selector"]
```
Options may look like `W28 L32` (waist/length).

**Generic:** radiogroups, size fieldsets, common class names — with noise filtering (ignore “Size guide”, “Add to bag”, etc.).

## Merge rules

`mergeExtractedProductData` does **not** overwrite non-empty values from a higher-priority source.

Example: JSON-LD has name and price but empty `sizes` → DOM pass adds sizes only.

## Late-loading sizes (SPA hydration)

React sites often render size pickers **after** first paint.

`capture.ts` → `watchForDomSizes()`:
- If first capture has `sizes.length === 0`, watch DOM mutations for 10 seconds
- When sizes appear, send another `PRODUCT_CAPTURED` to update session

## ProductData fields (see `interface.ts`)

| Field | Meaning |
|-------|---------|
| `url` | Page URL |
| `name`, `brand`, `price`, `originalPrice`, `currency` | Core catalog fields |
| `colour`, `category`, `material` | When available |
| `images` | String or array of URLs |
| `sizes` | e.g. `["XS", "S", "M"]` or `["W28 L32"]` |
| `availability` | `in_stock` / `out_of_stock` / `unknown` |
| `extractionSource` | Which layer “won” |
| `capturedAt` | ISO timestamp |

## Adding a new retailer

1. Add URL pattern to `contents/capture.ts`
2. Open a product page → DevTools → search for `application/ld+json`
3. If good JSON-LD → maybe only document in `site-patterns.ts`
4. If sizes missing → add `SITE_DOM_CONFIG` entry in `dom-extractor.ts`
5. Add a fixture + test in `lib/__tests__/`

## Tests

- `extractor.test.ts` — JSON parsing with saved fixtures
- `dom-extractor.test.ts` — DOM HTML snippets for COS/ASOS sizes and merge

Run: `yarn test --run`
