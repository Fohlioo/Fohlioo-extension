import type { ProductData } from '../../../interface'
import { sendAddToCart } from '../../capture/messenger'
import { fohliooLog } from '../../debug'

/** COS PDP add-to-bag controls (desktop + mobile test ids) */
export const COS_ADD_TO_BAG_SELECTOR =
  'button[data-testid="desktop-atb-button"], button[data-testid="mobile-atb-button"], button[data-testid*="atb-button" i]'

const CART_CLICK_COOLDOWN_MS = 1500

export function findCosAddToBagButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(COS_ADD_TO_BAG_SELECTOR)
  return btn instanceof HTMLButtonElement ? btn : null
}

export function isCosAddToBagButton (el: Element): boolean {
  return findCosAddToBagButton(el) !== null
}

/**
 * Observes shopper clicks on COS "ADD TO BAG" — read-only, never triggers the button.
 */
export function startCosCartTracking (
  getProduct: () => ProductData
): () => void {
  let lastFiredAt = 0

  const onClick = (event: MouseEvent) => {
    const btn = findCosAddToBagButton(event.target)
    if (!btn) return

    const now = Date.now()
    if (now - lastFiredAt < CART_CLICK_COOLDOWN_MS) return
    lastFiredAt = now

    const product = getProduct()
    fohliooLog('cart', 'COS add to bag clicked', {
      product: product.name,
      testId: btn.getAttribute('data-testid'),
      ariaLabel: btn.getAttribute('aria-label'),
    })
    sendAddToCart(product)
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
