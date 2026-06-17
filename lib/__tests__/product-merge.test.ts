import { describe, expect, test } from 'vitest'

import type { ProductData } from '../../interface'
import { mergeStickyProductFields } from '../product-merge'

const baseProduct = (): ProductData => ({
  url: 'https://www.cos.com/en-gb/product/test',
  name: 'Knitted Linen Polo',
  brand: 'COS',
  price: 65,
  originalPrice: null,
  currency: 'GBP',
  category: null,
  colour: 'Brown',
  material: null,
  images: null,
  availability: 'in_stock',
  sizes: [],
  capturedAt: '2026-06-11T12:00:00.000Z',
  extractionSource: 'dom',
})

describe('mergeStickyProductFields', () => {
  test('keeps material when live scrape returns null after drawer closes', () => {
    const previous = {
      ...baseProduct(),
      material: 'Shell: 72% Linen, 28% Cotton',
    }
    const incoming = { ...baseProduct(), material: null }

    expect(mergeStickyProductFields(previous, incoming).material).toBe(
      'Shell: 72% Linen, 28% Cotton'
    )
  })

  test('keeps sizes when live scrape returns empty after hydration', () => {
    const previous = {
      ...baseProduct(),
      sizes: ['S', 'M', 'L'],
    }
    const incoming = { ...baseProduct(), sizes: [] }

    expect(mergeStickyProductFields(previous, incoming).sizes).toEqual([
      'S',
      'M',
      'L',
    ])
  })

  test('accepts newer material when shopper reveals updated composition', () => {
    const previous = {
      ...baseProduct(),
      material: 'Shell: 72% Linen, 28% Cotton',
    }
    const incoming = {
      ...baseProduct(),
      material: 'Lining: 100% Cotton',
    }

    expect(mergeStickyProductFields(previous, incoming).material).toBe(
      'Lining: 100% Cotton'
    )
  })

  test('does not merge across different products', () => {
    const previous = {
      ...baseProduct(),
      material: 'Shell: 72% Linen, 28% Cotton',
    }
    const incoming = {
      ...baseProduct(),
      url: 'https://www.cos.com/en-gb/product/other',
      material: null,
    }

    expect(mergeStickyProductFields(previous, incoming).material).toBeNull()
  })
})
