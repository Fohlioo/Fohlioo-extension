import { describe, expect, test } from 'vitest'

import {
  ASOS_PRODUCT_DESCRIPTION_ROOT,
  classifyAsosEngagementClick,
  classifyAsosEngagementFromEvent,
  isAsosProductDetailsClick,
  isAsosSizeFitClick,
} from '../sites/asos/engagement'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

const PRODUCT_DESCRIPTION_SHELL = (inner: string) => `
  <div id="productDescription" data-testid="product-description-section">
    ${inner}
  </div>
`

describe('ASOS size & fit engagement', () => {
  test('matches product description root from live ASOS DOM', () => {
    document.body.innerHTML = `
      <div id="productDescription" data-testid="product-description-section"></div>
    `
    const root = document.querySelector(ASOS_PRODUCT_DESCRIPTION_ROOT)
    expect(root?.id).toBe('productDescription')
    document.body.innerHTML = ''
  })

  test('Size & Fit accordion button click via aria-controls', () => {
    const el = clickTarget(
      PRODUCT_DESCRIPTION_SHELL(`
        <li class="accordion-module_item__toBXw">
          <button
            class="accordion-item-module_titleBtn__w1ijl"
            aria-expanded="false"
            aria-controls="productDescriptionSizeAndFit"
            aria-label="Size & Fit"
          >
            <span class="accordion-item-module_titleText__rWfj1">Size & Fit</span>
          </button>
          <div
            id="productDescriptionSizeAndFit"
            data-testid="productDescriptionSizeAndFit"
            style="height: 0px; visibility: hidden;"
          ></div>
        </li>
      `),
      'span'
    )
    expect(isAsosSizeFitClick(el)).toBe(true)
    expect(classifyAsosEngagementClick(el)).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('Size & Fit fires even when accordion is already expanded', () => {
    const el = clickTarget(
      PRODUCT_DESCRIPTION_SHELL(`
        <button
          aria-expanded="true"
          aria-controls="productDescriptionSizeAndFit"
          aria-label="Size & Fit"
        >
          Size & Fit
        </button>
      `),
      'button'
    )
    expect(isAsosSizeFitClick(el)).toBe(true)
    document.body.innerHTML = ''
  })

  test('Sizing Help link inside Size & Fit panel', () => {
    const el = clickTarget(
      PRODUCT_DESCRIPTION_SHELL(`
        <div id="productDescriptionSizeAndFit" data-testid="productDescriptionSizeAndFit">
          <a href="#">Sizing Help</a>
        </div>
      `),
      'a'
    )
    expect(isAsosSizeFitClick(el)).toBe(true)
    document.body.innerHTML = ''
  })

  test('click inside open Size & Fit panel content', () => {
    const el = clickTarget(
      PRODUCT_DESCRIPTION_SHELL(`
        <div
          id="productDescriptionSizeAndFit"
          data-testid="productDescriptionSizeAndFit"
          style="visibility: visible;"
        >
          <p>Model is 188cm/ 6'2" and is wearing size M</p>
        </div>
      `),
      'p'
    )
    expect(isAsosSizeFitClick(el)).toBe(true)
    document.body.innerHTML = ''
  })

  test('matches Size & Fit via aria-controls even outside #productDescription', () => {
    const el = clickTarget(
      `
      <button aria-controls="productDescriptionSizeAndFit" aria-label="Size & Fit">
        Size & Fit
      </button>
    `,
      'button'
    )
    expect(isAsosSizeFitClick(el)).toBe(true)
    document.body.innerHTML = ''
  })

  test('classifyAsosEngagementFromEvent walks composedPath', () => {
    document.body.innerHTML = PRODUCT_DESCRIPTION_SHELL(`
      <button
        aria-controls="productDescriptionSizeAndFit"
        aria-label="Size & Fit"
      >
        <span id="size-fit-label">Size & Fit</span>
      </button>
    `)

    const span = document.querySelector('#size-fit-label')
    if (!span) throw new Error('Missing span')

    const event = new MouseEvent('click', { bubbles: true, composed: true })
    Object.defineProperty(event, 'composedPath', {
      value: () => [span, span.parentElement, document.body],
    })
    Object.defineProperty(event, 'target', { value: span })

    expect(classifyAsosEngagementFromEvent(event)).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('Product Details accordion button click', () => {
    const el = clickTarget(
      PRODUCT_DESCRIPTION_SHELL(`
        <button
          aria-expanded="false"
          aria-controls="productDescriptionDetails"
          aria-label="Product Details"
        >
          Product Details
        </button>
      `),
      'button'
    )
    expect(isAsosProductDetailsClick(el)).toBe(true)
    expect(classifyAsosEngagementClick(el)).toBe('details')
    document.body.innerHTML = ''
  })

  test('unrelated PDP click returns null', () => {
    const el = clickTarget(`<button>Add to bag</button>`, 'button')
    expect(classifyAsosEngagementClick(el)).toBeNull()
    document.body.innerHTML = ''
  })
})
