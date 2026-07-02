import { afterEach, describe, expect, test } from 'vitest'

import { extractFromDom, parsePriceText } from '../dom-extractor'
import { mergeExtractedProductData } from '../extractor'
import cosFixture from './fixtures/cos-product.json'

function mockDom (html: string, hostname = 'www.cos.com') {
  document.body.innerHTML = html
  Object.defineProperty(window, 'location', {
    value: {
      href: `https://${hostname}/product/test`,
      hostname,
    },
    writable: true,
  })
}

describe('parsePriceText', () => {
  test('parses pound symbol', () => {
    expect(parsePriceText('£55')).toEqual({ price: 55, currency: 'GBP' })
  })

  test('parses amount with currency code', () => {
    expect(parsePriceText('69.99 GBP')).toEqual({
      price: 69.99,
      currency: 'GBP',
    })
  })
})

describe('extractFromDom', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('extracts size buttons from a size selector', () => {
    mockDom(`
      <div class="size-selector" aria-label="Size">
        <button type="button">XS</button>
        <button type="button">S</button>
        <button type="button">M</button>
        <button type="button">L</button>
        <button type="button">XL</button>
      </div>
    `)

    const result = extractFromDom()
    expect(result.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL'])
  })

  test('extracts COS size-selector-button test ids (H&M group DOM)', () => {
    mockDom(`
      <div class="grid grid-cols-auto-4 gap-px border-t border-t-main">
        <button
          type="button"
          aria-label="Select Size"
          data-testid="size-selector-button-XS"
          value="23875-82686">
          <span class="relative z-10 block min-w-0 truncate">XS</span>
        </button>
        <button
          type="button"
          aria-label="Select Size"
          data-testid="size-selector-button-S">
          <span class="relative z-10 block min-w-0 truncate">S</span>
        </button>
        <button
          type="button"
          aria-label="Select Size"
          data-testid="size-selector-button-M">
          <span class="relative z-10 block min-w-0 truncate">M</span>
        </button>
        <button
          type="button"
          aria-label="Select Size"
          data-testid="size-selector-button-L">
          <span class="relative z-10 block min-w-0 truncate">L</span>
        </button>
        <button
          type="button"
          aria-label="Select Size"
          data-testid="size-selector-button-XL">
          <span class="relative z-10 block min-w-0 truncate">XL</span>
        </button>
      </div>
    `)

    const result = extractFromDom()
    expect(result.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL'])
  })

  test('extracts ASOS variantSelector dropdown sizes', () => {
    mockDom(
      `
      <div data-testid="variant-selector">
        <div class="C09ug">
          <select id="variantSelector">
            <option value="">Please select</option>
            <option value="200009832" data-testid="size-0" aria-label="W28 L32">W28 L32</option>
            <option value="200009830" data-testid="size-1" aria-label="W29 L32">W29 L32</option>
            <option value="200009826" data-testid="size-7" aria-label="W33 L32 - Out of stock">W33 L32 - Out of stock</option>
          </select>
        </div>
      </div>
    `,
      'www.asos.com'
    )

    const result = extractFromDom()
    expect(result.sizes).toEqual(['W28 L32', 'W29 L32', 'W33 L32'])
  })

  test('ignores country/currency market selector options (Toteme-style)', () => {
    mockDom(
      `
      <div class="size-selector" aria-label="Size">
        <button type="button">35</button>
        <button type="button">36</button>
        <button type="button">37</button>
        <button type="button">38</button>
        <button type="button">39</button>
        <button type="button">40</button>
        <button type="button">41</button>
        <button type="button">42</button>
      </div>
      <select id="country-selector" name="country" aria-label="Country">
        <option value="AF">Afghanistan (EUR)</option>
        <option value="AL">Albania (EUR)</option>
        <option value="AU">Australia (AUD)</option>
        <option value="BE">Belgium (EUR)</option>
      </select>
    `,
      'www.toteme.com'
    )

    const result = extractFromDom()
    expect(result.sizes).toEqual(['35', '36', '37', '38', '39', '40', '41', '42'])
  })

  test('extracts product name and price from DOM', () => {
    mockDom(`
      <h1 class="product-name">BOUCLÉ-KNIT HENLEY T-SHIRT</h1>
      <span class="current-price">£55</span>
    `)

    const result = extractFromDom()
    expect(result.name).toBe('BOUCLÉ-KNIT HENLEY T-SHIRT')
    expect(result.price).toBe(55)
    expect(result.currency).toBe('GBP')
  })

  test('extracts COS composition when materials tab is active', () => {
    mockDom(`
      <div role="tablist">
        <button role="tab" aria-selected="true" data-state="active">
          Materials and Suppliers
        </button>
      </div>
      <div role="tabpanel" data-testid="product-details-drawer-materials-supplier-tab">
        <div data-testid="product-details-drawer-materials">
          <div
            data-testid="product-details-drawer-sustainability-materials"
            class="flex items-baseline text-main-primary">
            <span class="w-[9.625rem] shrink-0 body2_semibold">Composition</span>
            <div class="flex-1">
              <span class="body2_regular">Shell: 72% Linen, 28% Cotton</span>
            </div>
          </div>
        </div>
      </div>
    `)

    const result = extractFromDom()
    expect(result.material).toBe('Shell: 72% Linen, 28% Cotton')
  })

  test('does not extract COS composition when row is hidden', () => {
    mockDom(`
      <button role="tab" aria-selected="true">Clothing</button>
      <div role="tabpanel" hidden>
        <div data-testid="product-details-drawer-sustainability-materials">
          <span>Composition</span>
          <div class="flex-1">
            <span>Shell: 72% Linen, 28% Cotton</span>
          </div>
        </div>
      </div>
    `)

    const result = extractFromDom()
    expect(result.material).toBeNull()
  })

  test('extracts COS composition when row is visible despite nav tabs', () => {
    mockDom(`
      <button role="tab" aria-selected="true" data-state="active">Clothing</button>
      <button role="tab" aria-selected="true" data-state="active">Materials and Suppliers</button>
      <div role="tabpanel">
        <div data-testid="product-details-drawer-sustainability-materials">
          <span class="body2_semibold">Composition</span>
          <div class="flex-1">
            <span class="body2_regular">Shell: 72% Linen, 28% Cotton</span>
          </div>
        </div>
      </div>
    `)

    const result = extractFromDom()
    expect(result.material).toBe('Shell: 72% Linen, 28% Cotton')
  })

  test('fills missing COS material from DOM after JSON-LD', () => {
    const jsonLd = {
      name: cosFixture.name,
      brand: 'COS',
      price: 55,
      currency: 'GBP',
      material: null as string | null,
      sizes: ['XS', 'S', 'M'],
    }

    const dom = {
      material: 'Shell: 72% Linen, 28% Cotton',
    }

    const merged = mergeExtractedProductData(jsonLd, {}, dom)
    expect(merged.material).toBe('Shell: 72% Linen, 28% Cotton')
    expect(merged.extractionSource).toBe('json_ld')
  })
})

describe('mergeExtractedProductData with DOM', () => {
  test('fills missing COS sizes from DOM after JSON-LD', () => {
    const jsonLd = {
      name: cosFixture.name,
      brand: 'COS',
      price: 55,
      currency: 'GBP',
      sizes: [] as string[],
    }

    const dom = {
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
    }

    const merged = mergeExtractedProductData(jsonLd, {}, dom)

    expect(merged.name).toBe(cosFixture.name)
    expect(merged.price).toBe(55)
    expect(merged.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL'])
    expect(merged.extractionSource).toBe('json_ld')
  })
})
