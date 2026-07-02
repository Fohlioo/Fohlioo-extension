import { describe, expect, test } from 'vitest'

import {
  findAsosAddToBagButton,
  isAsosAddToBagButton,
  ASOS_ADD_TO_BAG_SELECTOR,
} from '../sites/asos/cart'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

describe('ASOS add to bag detection', () => {
  test('selector targets add-button in primaryActions', () => {
    expect(ASOS_ADD_TO_BAG_SELECTOR).toContain('add-button')
    expect(ASOS_ADD_TO_BAG_SELECTOR).toContain('primaryActions')
  })

  test('detects add to bag button from DOM snapshot', () => {
    const btn = clickTarget(
      `
      <div data-testid="primaryActions">
        <button
          class="jAEfQ LLfrW Tyz1C"
          aria-label="Add to bag"
          data-testid="add-button"
          role="button"
        >
          ADD TO BAG
        </button>
        <button aria-label="Save for later" data-testid="saveForLater">♡</button>
      </div>
    `,
      'button[data-testid="add-button"]'
    )

    expect(isAsosAddToBagButton(btn)).toBe(true)
    expect(findAsosAddToBagButton(btn)).toBe(btn)
    document.body.innerHTML = ''
  })

  test('detects click on inner text inside add button', () => {
    const inner = clickTarget(
      `
      <div data-testid="primaryActions">
        <button data-testid="add-button" aria-label="Add to bag">
          <span>ADD TO BAG</span>
        </button>
      </div>
    `,
      'span'
    )

    const btn = findAsosAddToBagButton(inner)
    expect(btn?.getAttribute('data-testid')).toBe('add-button')
    document.body.innerHTML = ''
  })

  test('ignores save for later button', () => {
    const btn = clickTarget(
      `
      <div data-testid="primaryActions">
        <button data-testid="saveForLater" aria-label="Save for later">♡</button>
      </div>
    `,
      'button[data-testid="saveForLater"]'
    )

    expect(isAsosAddToBagButton(btn)).toBe(false)
    document.body.innerHTML = ''
  })
})
