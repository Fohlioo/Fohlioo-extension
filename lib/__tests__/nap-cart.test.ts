import { describe, expect, test } from 'vitest'

import {
  findNapAddToBagButton,
  isNapAddToBagButton,
  NAP_ADD_TO_BAG_SELECTOR,
} from '../sites/net-a-porter/cart'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

describe('Net-a-Porter add to bag detection', () => {
  test('selector targets CTAButtons89 addToBag class', () => {
    expect(NAP_ADD_TO_BAG_SELECTOR).toContain('CTAButtons89__addToBag')
  })

  test('detects primary add to bag button from DOM snapshot', () => {
    const btn = clickTarget(
      `
      <button
        type="button"
        class="Button10 Button10--primary AsyncButton10 CTAButtons89__addToBag CTAButtons89__addToBag--stickyCta primaryButton"
        aria-label="Add to Bag"
      >
        Add to Bag
      </button>
    `,
      'button'
    )

    expect(isNapAddToBagButton(btn)).toBe(true)
    expect(findNapAddToBagButton(btn)).toBe(btn)
    document.body.innerHTML = ''
  })

  test('detects click on inner span inside add to bag button', () => {
    const span = clickTarget(
      `
      <button class="CTAButtons89__addToBag" aria-label="Add to Bag">
        <span>Add to Bag</span>
      </button>
    `,
      'span'
    )

    const btn = findNapAddToBagButton(span)
    expect(btn?.classList.contains('CTAButtons89__addToBag')).toBe(true)
    document.body.innerHTML = ''
  })

  test('ignores wishlist button', () => {
    const btn = clickTarget(
      `
      <button class="CTAButtons89__addToWishlist" aria-label="Add to Wish List">
        Add to Wish List
      </button>
    `,
      'button'
    )

    expect(isNapAddToBagButton(btn)).toBe(false)
    document.body.innerHTML = ''
  })
})
