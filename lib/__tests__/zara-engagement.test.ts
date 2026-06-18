import { describe, expect, test } from 'vitest'

import {
  ZARA_QA_ACTIONS,
  classifyZaraEngagementClick,
  classifyZaraEngagementFromEvent,
} from '../sites/zara/engagement'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

const ACTIONS_SHELL = (inner: string) => `
  <ul class="product-detail-actions">
    ${inner}
  </ul>
`

describe('Zara PDP action engagement', () => {
  test('composition, care & origin via data-qa-action', () => {
    const el = clickTarget(
      ACTIONS_SHELL(`
        <li class="product-detail-actions__action product-detail-actions__clevercare">
          <button
            class="product-detail-actions__action-button"
            data-qa-action="show-extra-detail"
          >
            Composition, care &amp; origin
          </button>
        </li>
      `),
      'button'
    )
    const match = classifyZaraEngagementClick(el)
    expect(match?.action).toBe('compositionCare')
    expect(match?.section).toBe('materials')
    document.body.innerHTML = ''
  })

  test('check in-store availability via data-qa-action', () => {
    const el = clickTarget(
      ACTIONS_SHELL(`
        <li class="product-detail-actions__action">
          <button
            class="product-detail-actions__action-button"
            data-qa-action="store-stock"
          >
            <span>Check in-store availability</span>
          </button>
        </li>
      `),
      'span'
    )
    const match = classifyZaraEngagementClick(el)
    expect(match?.action).toBe('storeAvailability')
    expect(match?.section).toBe('details')
    document.body.innerHTML = ''
  })

  test('shipping & returns via data-qa-action', () => {
    const el = clickTarget(
      ACTIONS_SHELL(`
        <li class="product-detail-actions__action">
          <button
            class="product-detail-actions__action-button product-detail-actions-return-conditions__button"
            data-qa-action="show-return-conditions"
          >
            <span>Shipping, exchanges and returns</span>
          </button>
        </li>
      `),
      'span'
    )
    const match = classifyZaraEngagementClick(el)
    expect(match?.action).toBe('shippingReturns')
    expect(match?.section).toBe('details')
    document.body.innerHTML = ''
  })

  test('text fallback when data-qa-action is missing', () => {
    const el = clickTarget(
      ACTIONS_SHELL(`
        <button class="product-detail-actions__action-button">
          Shipping, exchanges and returns
        </button>
      `),
      'button'
    )
    expect(classifyZaraEngagementClick(el)?.action).toBe('shippingReturns')
    document.body.innerHTML = ''
  })

  test('ignores matching buttons outside product-detail-actions', () => {
    const el = clickTarget(
      `
      <button data-qa-action="store-stock">Check in-store availability</button>
    `,
      'button'
    )
    expect(classifyZaraEngagementClick(el)).toBeNull()
    document.body.innerHTML = ''
  })

  test('classifyZaraEngagementFromEvent walks composedPath', () => {
    document.body.innerHTML = ACTIONS_SHELL(`
      <button
        class="product-detail-actions__action-button"
        data-qa-action="show-extra-detail"
      >
        <span id="zara-label">Composition, care &amp; origin</span>
      </button>
    `)

    const span = document.querySelector('#zara-label')
    if (!span) throw new Error('Missing span')

    const event = new MouseEvent('click', { bubbles: true, composed: true })
    Object.defineProperty(event, 'composedPath', {
      value: () => [span, span.parentElement, document.body],
    })
    Object.defineProperty(event, 'target', { value: span })

    expect(classifyZaraEngagementFromEvent(event)?.action).toBe('compositionCare')
    document.body.innerHTML = ''
  })

  test('exports stable Zara QA action ids from screenshot', () => {
    expect(ZARA_QA_ACTIONS.compositionCare).toBe('show-extra-detail')
    expect(ZARA_QA_ACTIONS.storeAvailability).toBe('store-stock')
    expect(ZARA_QA_ACTIONS.shippingReturns).toBe('show-return-conditions')
  })
})
