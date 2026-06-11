import { afterEach, describe, expect, test } from 'vitest'
import { extractFromJsonLd } from '../extractor'
import napFixture from './fixtures/nap-product.json'
import zaraFixture from './fixtures/zara-product.json'

function mockPage (jsonLdData: object | object[]) {
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(jsonLdData)
  document.head.appendChild(script)
}

describe('extractFromJsonLd', () => {
  afterEach(() => {
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => s.remove())
  })

  test('Net-a-Porter — ProductGroup pattern', () => {
    mockPage(napFixture)
    const result = extractFromJsonLd()

    expect(result.name).toBe('Ennio scalloped pointelle-knit tank')
    expect(result.brand).toBe('KHAITE')
    expect(result.price).toBe(560)
    expect(result.originalPrice).toBe(1400)
    expect(result.currency).toBe('GBP')
    expect(result.colour).toBe('cream')
    expect(result.availability).toBe('out_of_stock')
    expect(result.sizes).toContain('small')
    expect(result.sizes).toContain('medium')
    expect(result.sizes).toContain('large')
    expect(result.colour).toContain('cream')
  })

  test('Zara — Array of Products by size', () => {
    mockPage(zaraFixture)
    const result = extractFromJsonLd()

    expect(result.name).toBe('VINTAGE LEATHER EFFECT JACKET')
    expect(result.brand).toBe('ZARA')
    expect(result.price).toBe(69.99)
    expect(result.currency).toBe('GBP')
    expect(result.sizes).toContain('S')
    expect(result.sizes).toContain('M')
    expect(result.sizes).toContain('L')
  })
})
