import type { ProductData } from '../../../interface'
import { sendAddToCart, sendRemoveFromCart } from '../../capture/messenger'
import { parsePriceText } from '../../dom-extractor'
import { fohliooLog } from '../../debug'

/** NAP / Mr Porter primary add-to-bag control (class names are stable across PDP layouts) */
export const NAP_ADD_TO_BAG_SELECTOR =
  'button.CTAButtons89__addToBag, button[aria-label="Add to Bag" i]'

/** NAP checkout bag — remove line item */
export const NAP_REMOVE_FROM_BAG_SELECTOR =
  'button.Checkout-Basket1__remove, button[aria-label="Remove from Bag" i]'

const NAP_LINE_ITEM_SELECTOR =
  'li.Checkout-Basket1__lineItem, li.LineItem15, [class*="LineItem15"]'

const CART_CLICK_COOLDOWN_MS = 1500

export function findNapAddToBagButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(NAP_ADD_TO_BAG_SELECTOR)
  return btn instanceof HTMLButtonElement ? btn : null
}

export function findNapRemoveFromBagButton (
  target: EventTarget | null
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null

  const btn = target.closest(NAP_REMOVE_FROM_BAG_SELECTOR)
  return btn instanceof HTMLButtonElement ? btn : null
}

export function isNapAddToBagButton (el: Element): boolean {
  return findNapAddToBagButton(el) !== null
}

export function isNapRemoveFromBagButton (el: Element): boolean {
  return findNapRemoveFromBagButton(el) !== null
}

/** Read product context from a checkout line item row */
export function extractNapLineItemProduct (
  btn: Element,
  fallback: ProductData
): ProductData {
  const lineItem = btn.closest(NAP_LINE_ITEM_SELECTOR)
  if (!lineItem) return fallback

  const productId = lineItem
    .querySelector('meta[itemprop="productID"]')
    ?.getAttribute('content')

  const productLink = lineItem.querySelector(
    'a[href*="/product/"]'
  ) as HTMLAnchorElement | null

  const brand =
    lineItem
      .querySelector('[class*="brand" i], [data-testid*="brand" i]')
      ?.textContent?.trim() ?? fallback.brand

  const name =
    lineItem
      .querySelector(
        '[class*="productName" i], [class*="name" i], [class*="title" i], a[href*="/product/"]'
      )
      ?.textContent?.trim() ?? fallback.name

  const priceNode =
    lineItem.querySelector(
      '[class*="price" i]:not([class*="original" i]), [itemprop="price"], [data-testid*="price" i]'
    ) ?? lineItem.querySelector('[class*="price" i]')

  const parsedPrice = parsePriceText(priceNode?.textContent ?? '')

  const colour =
    lineItem
      .querySelector('[class*="colour" i], [class*="color" i]')
      ?.textContent?.trim() ?? fallback.colour

  const size =
    lineItem
      .querySelector('[class*="size" i]')
      ?.textContent?.trim() ?? null

  return {
    ...fallback,
    url: productLink?.href
      ?? (productId
        ? `${window.location.origin}/shop/product/${productId}`
        : fallback.url),
    name: name ?? fallback.name,
    brand: brand ?? fallback.brand,
    price: parsedPrice.price ?? fallback.price,
    currency: parsedPrice.currency ?? fallback.currency,
    colour: colour ?? fallback.colour,
    sizes: size ? [size.replace(/^size\s*/i, '').trim()] : fallback.sizes,
    capturedAt: new Date().toISOString(),
    extractionSource: 'dom',
  }
}

/**
 * Observes shopper cart actions on NAP — read-only, never triggers buttons.
 */
export function startNapCartTracking (
  getProduct: () => ProductData
): () => void {
  const lastFiredAt = { add: 0, remove: 0 }

  const onClick = (event: MouseEvent) => {
    const addBtn = findNapAddToBagButton(event.target)
    if (addBtn) {
      const now = Date.now()
      if (now - lastFiredAt.add < CART_CLICK_COOLDOWN_MS) return
      lastFiredAt.add = now

      const product = getProduct()
      fohliooLog('cart', 'NAP add to bag clicked', {
        product: product.name,
        ariaLabel: addBtn.getAttribute('aria-label'),
      })
      sendAddToCart(product)
      return
    }

    const removeBtn = findNapRemoveFromBagButton(event.target)
    if (!removeBtn) return

    const now = Date.now()
    if (now - lastFiredAt.remove < CART_CLICK_COOLDOWN_MS) return
    lastFiredAt.remove = now

    const product = extractNapLineItemProduct(removeBtn, getProduct())
    fohliooLog('cart', 'NAP remove from bag clicked', {
      product: product.name,
      productId: removeBtn
        .closest(NAP_LINE_ITEM_SELECTOR)
        ?.querySelector('meta[itemprop="productID"]')
        ?.getAttribute('content'),
    })
    sendRemoveFromCart(product)
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
