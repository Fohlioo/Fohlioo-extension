import { describe, expect, test } from 'vitest'

import {
  extractNapLineItemProduct,
  findNapAddToBagButton,
  findNapRemoveFromBagButton,
  isNapAddToBagButton,
  isNapRemoveFromBagButton,
  NAP_ADD_TO_BAG_SELECTOR,
} from '../sites/net-a-porter/cart'
import type { ProductData } from '../../interface'

const fallbackProduct: ProductData = {
  url: 'https://www.net-a-porter.com/en-gb/checkout',
  name: null,
  brand: null,
  price: null,
  originalPrice: null,
  currency: null,
  category: null,
  colour: null,
  material: null,
  images: null,
  availability: 'unknown',
  sizes: [],
  capturedAt: '2026-06-24T00:00:00.000Z',
  extractionSource: 'dom',
}

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

describe('Net-a-Porter remove from bag detection', () => {
  test('detects checkout remove button', () => {
    const btn = clickTarget(
      `
      <li class="LineItem15 Checkout-Basket1__lineItem">
        <meta itemprop="productID" content="46376663162912976" />
        <a href="https://www.net-a-porter.com/en-gb/shop/product/khaite-jacket">KHAITE jacket</a>
        <span class="LineItem15__brand">KHAITE</span>
        <span class="LineItem15__price">£3,350</span>
        <button type="button" class="Button10 Button10--tertiary Checkout-Basket1__remove">
          Remove from Bag
        </button>
      </li>
    `,
      'button.Checkout-Basket1__remove'
    )

    expect(isNapRemoveFromBagButton(btn)).toBe(true)
    expect(findNapRemoveFromBagButton(btn)).toBe(btn)
    document.body.innerHTML = ''
  })

  test('extracts product from checkout line item', () => {
    const btn = clickTarget(
      `
      <li class="LineItem15 Checkout-Basket1__lineItem">
        <meta itemprop="productID" content="46376663162912976" />
        <span class="LineItem15__brand">KHAITE</span>
        <a href="https://www.net-a-porter.com/en-gb/shop/product/khaite-jacket">
          Catalina distressed leather biker jacket
        </a>
        <span class="LineItem15__price">£3,350</span>
        <button class="Checkout-Basket1__remove">Remove from Bag</button>
      </li>
    `,
      'button'
    )

    const product = extractNapLineItemProduct(btn, fallbackProduct)
    expect(product.brand).toBe('KHAITE')
    expect(product.name).toContain('Catalina')
    expect(product.price).toBe(3350)
    expect(product.currency).toBe('GBP')
    expect(product.url).toContain('/shop/product/khaite-jacket')
    document.body.innerHTML = ''
  })
})
