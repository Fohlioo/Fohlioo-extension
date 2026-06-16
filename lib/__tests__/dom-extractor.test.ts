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
