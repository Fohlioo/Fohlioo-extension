import type { ProductData } from '../../../interface'
import { sendAddToCart } from '../../capture/messenger'
import { fohliooLog } from '../../debug'

/** NAP / Mr Porter primary add-to-bag control (class names are stable across PDP layouts) */
export const NAP_ADD_TO_BAG_SELECTOR =
  'button.CTAButtons89__addToBag, button[aria-label="Add to Bag" i]'

const ADD_TO_BAG_CLICK_COOLDOWN_MS = 1500

export function findNapAddToBagButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(NAP_ADD_TO_BAG_SELECTOR)
  return btn instanceof HTMLButtonElement ? btn : null
}

export function isNapAddToBagButton (el: Element): boolean {
  return findNapAddToBagButton(el) !== null
}

/**
 * Observes shopper clicks on NAP "Add to Bag" — read-only, never triggers the button.
 */
export function startNapCartTracking (
  getProduct: () => ProductData
): () => void {
  let lastFiredAt = 0

  const onClick = (event: MouseEvent) => {
    const btn = findNapAddToBagButton(event.target)
    if (!btn) return

    const now = Date.now()
    if (now - lastFiredAt < ADD_TO_BAG_CLICK_COOLDOWN_MS) return
    lastFiredAt = now

    const product = getProduct()
    fohliooLog('cart', 'NAP add to bag clicked', {
      product: product.name,
      ariaLabel: btn.getAttribute('aria-label'),
    })
    sendAddToCart(product)
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
