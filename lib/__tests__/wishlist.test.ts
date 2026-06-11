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
