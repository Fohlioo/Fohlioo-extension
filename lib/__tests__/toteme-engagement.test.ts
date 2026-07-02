import { describe, expect, test } from 'vitest'

import {
  TOTEME_DRAWERS,
  classifyTotemeEngagementClick,
  classifyTotemeEngagementFromEvent,
} from '../sites/toteme/engagement'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

const TABS_SHELL = (inner: string) => `
  <product-tabs class="prd-Detail_Tabs fz-14_150" data-product-content-el="tabs">
    ${inner}
  </product-tabs>
`

describe('Toteme PDP tab engagement', () => {
  test('Details tab via data-value', () => {
    const el = clickTarget(
      TABS_SHELL(`
        <button
          class="prd-Detail_Tab"
          type="button"
          data-drawers-trigger="${TOTEME_DRAWERS.productDetails}"
          data-product-tabs-el="trigger"
          data-value="Details"
        >
          Details
        </button>
      `),
      'button'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('details')
    expect(match?.section).toBe('details')
    document.body.innerHTML = ''
  })

  test('Size & fit tab via data-drawers-trigger', () => {
    const el = clickTarget(
      TABS_SHELL(`
        <button
          class="prd-Detail_Tab"
          type="button"
          data-drawers-trigger="${TOTEME_DRAWERS.sizeGuide}"
          data-product-tabs-el="trigger"
        >
          Size &amp; fit
        </button>
      `),
      'button'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('sizeGuide')
    expect(match?.section).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('Certificates & Traceability maps to materials', () => {
    const el = clickTarget(
      TABS_SHELL(`
        <button
          class="prd-Detail_Tab"
          type="button"
          data-drawers-trigger="${TOTEME_DRAWERS.productDetails}"
          data-product-tabs-el="trigger"
          data-value="Certificates &amp; Traceability"
        >
          Certificates &amp; Traceability
        </button>
      `),
      'button'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('certificates')
    expect(match?.section).toBe('materials')
    document.body.innerHTML = ''
  })

  test('Returns & Exchanges maps to details', () => {
    const el = clickTarget(
      TABS_SHELL(`
        <button
          class="prd-Detail_Tab"
          type="button"
          data-drawers-trigger="${TOTEME_DRAWERS.productDetails}"
          data-product-tabs-el="trigger"
          data-value="Returns &amp; Exchanges"
        >
          Returns &amp; Exchanges
        </button>
      `),
      'button'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('returns')
    expect(match?.section).toBe('details')
    document.body.innerHTML = ''
  })

  test('click inside open size guide drawer', () => {
    const el = clickTarget(
      `
      <div id="${TOTEME_DRAWERS.sizeGuide}">
        <p>Fits true to size</p>
      </div>
    `,
      'p'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('sizeGuide')
    document.body.innerHTML = ''
  })

  test('click inside open product details drawer', () => {
    const el = clickTarget(
      `
      <div id="${TOTEME_DRAWERS.productDetails}">
        <p>100% nappa leather</p>
      </div>
    `,
      'p'
    )
    const match = classifyTotemeEngagementClick(el)
    expect(match?.action).toBe('details')
    document.body.innerHTML = ''
  })

  test('ignores matching buttons outside product tabs', () => {
    const el = clickTarget(
      `
      <button
        class="prd-Detail_Tab"
        data-drawers-trigger="${TOTEME_DRAWERS.sizeGuide}"
        data-product-tabs-el="trigger"
      >
        Size &amp; fit
      </button>
    `,
      'button'
    )
    expect(classifyTotemeEngagementClick(el)).toBeNull()
    document.body.innerHTML = ''
  })

  test('classifyTotemeEngagementFromEvent walks composedPath', () => {
    document.body.innerHTML = TABS_SHELL(`
      <button
        class="prd-Detail_Tab"
        data-drawers-trigger="${TOTEME_DRAWERS.sizeGuide}"
        data-product-tabs-el="trigger"
      >
        <span id="toteme-size-label">Size &amp; fit</span>
      </button>
    `)

    const span = document.querySelector('#toteme-size-label')
    if (!span) throw new Error('Missing span')

    const event = new MouseEvent('click', { bubbles: true, composed: true })
    Object.defineProperty(event, 'composedPath', {
      value: () => [span, span.parentElement, document.body],
    })
    Object.defineProperty(event, 'target', { value: span })

    expect(classifyTotemeEngagementFromEvent(event)?.action).toBe('sizeGuide')
    document.body.innerHTML = ''
  })

  test('unrelated PDP click returns null', () => {
    const el = clickTarget(`<button>Add to bag</button>`, 'button')
    expect(classifyTotemeEngagementClick(el)).toBeNull()
    document.body.innerHTML = ''
  })
})
