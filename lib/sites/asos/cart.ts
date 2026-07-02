import type { ProductData } from '../../../interface'
import { sendAddToCart } from '../../capture/messenger'
import { fohliooLog } from '../../debug'

/** ASOS PDP add-to-bag control inside primary actions */
export const ASOS_ADD_TO_BAG_SELECTOR =
  '[data-testid="primaryActions"] button[data-testid="add-button"], button[data-testid="add-button"]'

const CART_CLICK_COOLDOWN_MS = 1500

export function findAsosAddToBagButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(ASOS_ADD_TO_BAG_SELECTOR)
  if (!(btn instanceof HTMLButtonElement)) return null

  if ((btn.getAttribute('data-testid') ?? '').toLowerCase() === 'saveforlater') {
    return null
  }

  return btn
}

export function isAsosAddToBagButton (el: Element): boolean {
  return findAsosAddToBagButton(el) !== null
}

/**
 * Observes shopper clicks on ASOS "ADD TO BAG" — read-only, never triggers the button.
 */
export function startAsosCartTracking (
  getProduct: () => ProductData
): () => void {
  let lastFiredAt = 0

  const onClick = (event: MouseEvent) => {
    const btn = findAsosAddToBagButton(event.target)
    if (!btn) return

    const now = Date.now()
    if (now - lastFiredAt < CART_CLICK_COOLDOWN_MS) return
    lastFiredAt = now

    const product = getProduct()
    fohliooLog('cart', 'ASOS add to bag clicked', {
      product: product.name,
      testId: btn.getAttribute('data-testid'),
      ariaLabel: btn.getAttribute('aria-label'),
    })
    sendAddToCart(product)
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
