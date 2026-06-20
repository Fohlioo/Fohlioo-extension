import { describe, expect, test } from 'vitest'

import {
  bumpVisitEntry,
  normalizeProductUrl,
  pageViewLabel,
} from '../visit-history'

describe('normalizeProductUrl', () => {
  test('strips hash and utm params', () => {
    expect(
      normalizeProductUrl(
        'https://www.cos.com/en/product/jacket?utm_source=ig#reviews'
      )
    ).toBe('https://www.cos.com/en/product/jacket')
  })

  test('preserves meaningful query params', () => {
    expect(
      normalizeProductUrl(
        'https://www.zara.com/uk/en/product.html?v1=111&color=440'
      )
    ).toBe('https://www.zara.com/uk/en/product.html?color=440&v1=111')
  })

  test('returns raw string when URL is invalid', () => {
    expect(normalizeProductUrl('not-a-url')).toBe('not-a-url')
  })
})

describe('bumpVisitEntry', () => {
  test('increments visit count per normalized URL', () => {
    const url = 'https://www.asos.com/product/123'
    const first = bumpVisitEntry({}, url, '2026-06-01T10:00:00.000Z')
    expect(first.visitCount).toBe(1)

    const second = bumpVisitEntry(first.history, url, '2026-06-02T10:00:00.000Z')
    expect(second.visitCount).toBe(2)
    expect(second.history[url]?.visitCount).toBe(2)
  })

  test('evicts oldest entry when max size exceeded', () => {
    const history = {
      old: { visitCount: 1, lastVisitedAt: '2026-01-01T00:00:00.000Z' },
      mid: { visitCount: 2, lastVisitedAt: '2026-06-01T00:00:00.000Z' },
    }

    const { history: next } = bumpVisitEntry(
      history,
      'https://www.cos.com/new',
      '2026-06-10T00:00:00.000Z',
      2
    )

    expect(Object.keys(next)).toHaveLength(2)
    expect(next.old).toBeUndefined()
    expect(next.mid).toBeDefined()
    expect(next['https://www.cos.com/new']?.visitCount).toBe(1)
  })
})

describe('pageViewLabel', () => {
  test('labels first and return visits', () => {
    expect(pageViewLabel(1)).toBe('Product page opened')
    expect(pageViewLabel(3)).toBe('Return visit (3)')
  })
})
