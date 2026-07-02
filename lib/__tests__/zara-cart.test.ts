import { describe, expect, test } from 'vitest'

import {
  findZaraAddToCartButton,
  isZaraAddToCartButton,
  ZARA_ADD_TO_CART_SELECTOR,
} from '../sites/zara/cart'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

describe('Zara add to cart detection', () => {
  test('selector targets data-qa-action and class', () => {
    expect(ZARA_ADD_TO_CART_SELECTOR).toContain('data-qa-action="add-to-cart"')
    expect(ZARA_ADD_TO_CART_SELECTOR).toContain(
      'product-detail-cart-buttons__add-to-cart'
    )
  })

  test('detects primary add button from DOM snapshot', () => {
    const btn = clickTarget(
      `
      <div class="product-detail-cart-buttons__main-action">
        <button
          class="zds-button product-detail-cart-buttons__button product-detail-cart-buttons__add-to-cart zds-button--secondary zds-button--large"
          role="button"
          aria-label="Add REGULAR FIT SHIRT"
          data-qa-action="add-to-cart"
        >
          ADD
        </button>
      </div>
    `,
      'button[data-qa-action="add-to-cart"]'
    )

    expect(isZaraAddToCartButton(btn)).toBe(true)
    expect(findZaraAddToCartButton(btn)).toBe(btn)
    document.body.innerHTML = ''
  })

  test('detects click on inner text inside add button', () => {
    const span = clickTarget(
      `
      <button class="product-detail-cart-buttons__add-to-cart" data-qa-action="add-to-cart">
        <span>ADD</span>
      </button>
    `,
      'span'
    )

    const btn = findZaraAddToCartButton(span)
    expect(btn?.getAttribute('data-qa-action')).toBe('add-to-cart')
    document.body.innerHTML = ''
  })

  test('ignores wishlist button', () => {
    const btn = clickTarget(
      `
      <button class="product-detail-cart-buttons__add-to-wishlist" data-qa-action="add-to-wishlist">
        Save
      </button>
    `,
      'button'
    )

    expect(isZaraAddToCartButton(btn)).toBe(false)
    document.body.innerHTML = ''
  })
})
