import { describe, expect, test } from 'vitest'

import {
  findWishlistButton,
  getWishlistButtonSelector,
  inferAsosClickAction,
  inferWishlistAction,
  inferWishlistActionFromLabels,
  isWishlistActive,
  queryWishlistButtons,
} from '../wishlist'
import {
  applyCosWishlistToggle,
  clearCosLogicalWishlistState,
  getCosLogicalWishlistState,
  inferCosClickAction,
  inferCosWishlistActionFromHeartChange,
  inferCosWishlistActionFromHeartStates,
  isCosHeartFilled,
  resolveCosWasFilled,
  setCosLogicalWishlistState,
} from '../sites/cos/wishlist'

describe('ASOS wishlist detection', () => {
  test('selector prioritises saveForLater in primaryActions', () => {
    const selector = getWishlistButtonSelector('www.asos.com')
    expect(selector).toContain('saveForLater')
    expect(selector).toContain('primaryActions')
  })

  test('saveForLater button — inactive (Save for later)', () => {
    const btn = document.createElement('button')
    btn.setAttribute('type', 'button')
    btn.setAttribute('data-testid', 'saveForLater')
    btn.setAttribute('aria-label', 'Save for later')
    btn.innerHTML = '<span class="product-heartempty"></span>'
    expect(isWishlistActive(btn)).toBe(false)
  })

  test('saveForLater button — active via product-heartfilled class', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-testid', 'saveForLater')
    btn.setAttribute('aria-label', 'Save for later')
    btn.innerHTML = '<span class="product-heartfilled"></span>'
    expect(isWishlistActive(btn)).toBe(true)
  })

  test('saveForLater button — active (Saved for later)', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-testid', 'saveForLater')
    btn.setAttribute('aria-label', 'Saved for later')
    expect(isWishlistActive(btn)).toBe(true)
  })

  test('saveForLater button — active (Remove from saved items)', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-testid', 'saveForLater')
    btn.setAttribute('aria-label', 'Remove from saved items')
    expect(isWishlistActive(btn)).toBe(true)
  })

  test('click Save for later → Saved for later infers wishlist_add', () => {
    expect(
      inferWishlistActionFromLabels('Save for later', 'Saved for later')
    ).toBe('wishlist_add')
  })

  test('click Saved for later → Save for later infers wishlist_remove', () => {
    expect(
      inferWishlistActionFromLabels('Saved for later', 'Save for later')
    ).toBe('wishlist_remove')
  })

  test('click intent when heart class does not change aria-label', () => {
    expect(inferAsosClickAction(false)).toBe('wishlist_add')
    expect(inferAsosClickAction(true)).toBe('wishlist_remove')
  })

  test('findWishlistButton matches click on heart SVG inside saveForLater', () => {
    document.body.innerHTML = `
      <div data-testid="primaryActions">
        <button type="button" data-testid="saveForLater" aria-label="Save for later">
          <svg><path /></svg>
        </button>
      </div>
    `
    const svg = document.querySelector('svg path')!
    expect(findWishlistButton(svg, 'www.asos.com')).not.toBeNull()
    expect(findWishlistButton(svg, 'www.asos.com')?.getAttribute('data-testid')).toBe(
      'saveForLater'
    )
    document.body.innerHTML = ''
  })

  test('queryWishlistButtons scopes to primaryActions on ASOS', () => {
    document.body.innerHTML = `
      <div data-testid="primaryActions">
        <button data-testid="add-button">Add to bag</button>
        <button data-testid="saveForLater" aria-label="Save for later"></button>
      </div>
      <button data-testid="saveForLater" aria-label="Save for later"></button>
    `
    const buttons = queryWishlistButtons('www.asos.com')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.getAttribute('data-testid')).toBe('saveForLater')
    document.body.innerHTML = ''
  })

  test('legacy data-auto-id saved items buttons still supported', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-auto-id', 'btn-addToSavedItems')
    btn.setAttribute('aria-label', 'Add to saved items')
    expect(isWishlistActive(btn)).toBe(false)

    btn.setAttribute('aria-label', 'Remove from saved items')
    expect(isWishlistActive(btn)).toBe(true)
  })

  test('state toggle infers add and remove', () => {
    expect(inferWishlistAction(false, true)).toBe('wishlist_add')
    expect(inferWishlistAction(true, false)).toBe('wishlist_remove')
  })
})

describe('H&M group wishlist detection', () => {
  test('selector includes pdp-addToWishlist', () => {
    const selector = getWishlistButtonSelector('www.arket.com')
    expect(selector).toContain('pdp-addToWishlist')
  })

  test('Add to wishlist aria-label is inactive', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-testid', 'pdp-addToWishlist')
    btn.setAttribute('aria-label', 'Add to wishlist')
    expect(isWishlistActive(btn)).toBe(false)
  })

  test('Remove from wishlist aria-label is active', () => {
    const btn = document.createElement('button')
    btn.setAttribute('data-testid', 'pdp-addToWishlist')
    btn.setAttribute('aria-label', 'Remove from wishlist')
    expect(isWishlistActive(btn)).toBe(true)
  })
})

function cosWishlistButton (html: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.setAttribute('data-testid', 'wishlist-button')
  btn.setAttribute('title', 'Wishlist active')
  btn.innerHTML = html
  return btn
}

describe('COS wishlist detection', () => {
  test('selector uses wishlist-button not pdp-addToWishlist', () => {
    const selector = getWishlistButtonSelector('www.cos.com')
    expect(selector).toContain('wishlist-button')
    expect(selector.indexOf('pdp-addToWishlist')).toBeGreaterThan(-1)
  })

  test('COS selector is site-first before generic fallbacks', () => {
    const selector = getWishlistButtonSelector('www.cos.com')
    expect(selector.startsWith('button[data-testid="wishlist-button"]')).toBe(true)
  })

  test('outline heart is inactive even when title is Wishlist active', () => {
    const btn = cosWishlistButton(`
      <svg><path fill="none" stroke="currentColor" stroke-width="1.5" /></svg>
    `)
    expect(isWishlistActive(btn)).toBe(false)
    expect(isCosHeartFilled(btn)).toBe(false)
  })

  test('filled heart is active', () => {
    const btn = cosWishlistButton(`
      <svg><path fill="currentColor" /></svg>
    `)
    expect(isWishlistActive(btn)).toBe(true)
    expect(isCosHeartFilled(btn)).toBe(true)
  })

  test('logical state survives when DOM heart detection always returns false', () => {
    const url = 'https://www.cos.com/en-gb/product/test-shirt'
    clearCosLogicalWishlistState(url)

    const outlineBtn = cosWishlistButton(`
      <svg><path fill="none" stroke="currentColor" d="outline-path" /></svg>
    `)

    expect(resolveCosWasFilled(url, 'outline-path', outlineBtn)).toBe(false)

    applyCosWishlistToggle(url, 'wishlist_add', 'outline-path', 'filled-path')
    expect(getCosLogicalWishlistState(url)).toBe(true)
    expect(resolveCosWasFilled(url, 'filled-path', outlineBtn)).toBe(true)

    applyCosWishlistToggle(url, 'wishlist_remove', 'filled-path', 'outline-path')
    expect(getCosLogicalWishlistState(url)).toBe(false)
    expect(resolveCosWasFilled(url, 'outline-path', outlineBtn)).toBe(false)

    clearCosLogicalWishlistState(url)
  })

  test('path change infers toggle from pre-click state, not post-click SVG', () => {
    expect(
      inferCosWishlistActionFromHeartChange('outline-path', 'filled-path', false)
    ).toBe('wishlist_add')
    expect(
      inferCosWishlistActionFromHeartChange('filled-path', 'outline-path', true)
    ).toBe('wishlist_remove')
  })

  test('heart outline → filled infers wishlist_add', () => {
    expect(inferCosWishlistActionFromHeartStates(false, true)).toBe('wishlist_add')
  })

  test('heart filled → outline infers wishlist_remove', () => {
    expect(inferCosWishlistActionFromHeartStates(true, false)).toBe('wishlist_remove')
  })

  test('click intent when heart state is stable', () => {
    expect(inferCosClickAction(false)).toBe('wishlist_add')
    expect(inferCosClickAction(true)).toBe('wishlist_remove')
  })

  test('findWishlistButton matches click on heart SVG inside wishlist-button', () => {
    document.body.innerHTML = `
      <button type="button" data-testid="wishlist-button" title="Wishlist">
        <svg class="inline h-4 w-4"><path /></svg>
      </button>
    `
    const svg = document.querySelector('svg path')!
    expect(findWishlistButton(svg, 'www.cos.com')).not.toBeNull()
    expect(findWishlistButton(svg, 'www.cos.com')?.getAttribute('data-testid')).toBe(
      'wishlist-button'
    )
    document.body.innerHTML = ''
  })

  test('queryWishlistButtons finds COS wishlist-button', () => {
    document.body.innerHTML = `
      <button data-testid="wishlist-button" title="Wishlist"></button>
      <button data-testid="pdp-addToWishlist" aria-label="Add to wishlist"></button>
    `
    const buttons = queryWishlistButtons('www.cos.com')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.getAttribute('data-testid')).toBe('wishlist-button')
    document.body.innerHTML = ''
  })
})
