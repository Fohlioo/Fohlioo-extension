import { describe, expect, test } from 'vitest'

import {
  findCosAddToBagButton,
  isCosAddToBagButton,
  COS_ADD_TO_BAG_SELECTOR,
} from '../sites/cos/cart'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

describe('COS add to bag detection', () => {
  test('selector targets desktop and mobile atb test ids', () => {
    expect(COS_ADD_TO_BAG_SELECTOR).toContain('desktop-atb-button')
    expect(COS_ADD_TO_BAG_SELECTOR).toContain('mobile-atb-button')
  })

  test('detects desktop add to bag button from DOM snapshot', () => {
    const btn = clickTarget(
      `
      <button
        type="button"
        data-testid="desktop-atb-button"
        aria-label="Select size and add to bag"
      >
        <div>ADD TO BAG</div>
      </button>
    `,
      'button[data-testid="desktop-atb-button"]'
    )

    expect(isCosAddToBagButton(btn)).toBe(true)
    expect(findCosAddToBagButton(btn)).toBe(btn)
    document.body.innerHTML = ''
  })

  test('detects click on inner div inside add to bag button', () => {
    const inner = clickTarget(
      `
      <button data-testid="desktop-atb-button" aria-label="Select size and add to bag">
        <div>ADD TO BAG</div>
      </button>
    `,
      'div'
    )

    const btn = findCosAddToBagButton(inner)
    expect(btn?.getAttribute('data-testid')).toBe('desktop-atb-button')
    document.body.innerHTML = ''
  })

  test('detects mobile atb button', () => {
    const btn = clickTarget(
      `<button data-testid="mobile-atb-button">ADD TO BAG</button>`,
      'button'
    )

    expect(isCosAddToBagButton(btn)).toBe(true)
    document.body.innerHTML = ''
  })

  test('ignores wishlist button', () => {
    const btn = clickTarget(
      `<button data-testid="pdp-addToWishlist">Save</button>`,
      'button'
    )

    expect(isCosAddToBagButton(btn)).toBe(false)
    document.body.innerHTML = ''
  })
})
