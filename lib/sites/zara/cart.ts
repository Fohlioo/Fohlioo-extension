import type { ProductData } from '../../../interface'
import { sendAddToCart } from '../../capture/messenger'
import { fohliooLog } from '../../debug'

/** Zara PDP primary add-to-cart control */
export const ZARA_ADD_TO_CART_SELECTOR =
  'button[data-qa-action="add-to-cart"], button.product-detail-cart-buttons__add-to-cart'

const CART_CLICK_COOLDOWN_MS = 1500

export function findZaraAddToCartButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(ZARA_ADD_TO_CART_SELECTOR)
  return btn instanceof HTMLButtonElement ? btn : null
}

export function isZaraAddToCartButton (el: Element): boolean {
  return findZaraAddToCartButton(el) !== null
}

/**
 * Observes shopper clicks on Zara "ADD" — read-only, never triggers the button.
 */
export function startZaraCartTracking (
  getProduct: () => ProductData
): () => void {
  let lastFiredAt = 0

  const onClick = (event: MouseEvent) => {
    const btn = findZaraAddToCartButton(event.target)
    if (!btn) return

    const now = Date.now()
    if (now - lastFiredAt < CART_CLICK_COOLDOWN_MS) return
    lastFiredAt = now

    const product = getProduct()
    fohliooLog('cart', 'Zara add to cart clicked', {
      product: product.name,
      qaAction: btn.getAttribute('data-qa-action'),
      ariaLabel: btn.getAttribute('aria-label'),
    })
    sendAddToCart(product)
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
