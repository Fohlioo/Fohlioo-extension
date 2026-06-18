import { getSiteKey } from '../registry'

export type ZaraWishlistAction = 'wishlist_add' | 'wishlist_remove'

/** Zara PDP bookmark — header next to product title */
export const ZARA_WISHLIST_SELECTOR =
  'button[data-qa-action="add-to-wishlist"], button.add-item-to-wishlist-button'

/** Survives React re-mounting the bookmark between toggles */
const zaraLogicalStateByUrl = new Map<string, boolean>()
const zaraFilledSigByUrl = new Map<string, string>()
const zaraOutlineSigByUrl = new Map<string, string>()

export function isZaraSite (hostname: string): boolean {
  return getSiteKey(hostname) === 'zara.com'
}

export function getZaraLogicalWishlistState (url: string): boolean {
  return zaraLogicalStateByUrl.get(url) ?? false
}

export function setZaraLogicalWishlistState (url: string, saved: boolean): void {
  zaraLogicalStateByUrl.set(url, saved)
}

export function clearZaraLogicalWishlistState (url: string): void {
  zaraLogicalStateByUrl.delete(url)
  zaraFilledSigByUrl.delete(url)
  zaraOutlineSigByUrl.delete(url)
}

function learnZaraBookmarkVariant (
  url: string,
  signature: string,
  saved: boolean
): void {
  if (!signature) return
  if (saved) zaraFilledSigByUrl.set(url, signature)
  else zaraOutlineSigByUrl.set(url, signature)
}

function isZaraSignatureSaved (
  url: string,
  signature: string
): boolean | undefined {
  if (!signature) return undefined
  if (zaraFilledSigByUrl.get(url) === signature) return true
  if (zaraOutlineSigByUrl.get(url) === signature) return false
  return undefined
}

export function isZaraWishlistButton (el: Element): boolean {
  const qaAction = (el.getAttribute('data-qa-action') ?? '').toLowerCase()
  if (qaAction === 'add-to-wishlist' || qaAction === 'remove-from-wishlist') {
    return true
  }
  return el.classList.contains('add-item-to-wishlist-button')
}

function readZaraWishlistLabel (el: Element): string {
  return (el.getAttribute('aria-label') ?? '').toLowerCase().trim()
}

/** Bookmark SVG fingerprint — class + path shape */
export function getZaraBookmarkSignature (el: Element): string {
  const svg = el.querySelector('svg')
  if (!svg) return ''

  const path = svg.querySelector('path')
  return [
    svg.className.toString().trim(),
    path?.getAttribute('d')?.trim() ?? '',
    path?.getAttribute('fill')?.trim() ?? '',
  ].join('|')
}

/**
 * DOM-only saved detection. Zara often keeps aria-label unchanged on toggle,
 * so never rely on this alone for click inference.
 */
export function isZaraBookmarkFilled (el: Element): boolean {
  if (!isZaraWishlistButton(el)) return false

  const qaAction = (el.getAttribute('data-qa-action') ?? '').toLowerCase()
  if (qaAction === 'remove-from-wishlist') return true

  const label = readZaraWishlistLabel(el)
  if (/remove.*wish\s*list/i.test(label)) return true
  if (/remove from.*wish/i.test(label)) return true

  if (el.getAttribute('aria-pressed') === 'true') return true

  const className = el.className.toString().toLowerCase()
  if (/\bis-saved\b/.test(className)) return true
  if (/\bwishlist-bookmark--saved\b/.test(className)) return true

  const svg = el.querySelector('svg')
  if (svg) {
    const svgClass = svg.className.toString().toLowerCase()
    if (
      /wishlist-icon--saved|wishlist-icon--filled|bookmark-filled/.test(svgClass)
    ) {
      return true
    }
    if (/wishlist-icon--empty|bookmark-empty/.test(svgClass)) return false
  }

  return false
}

export function isZaraWishlistActive (el: Element): boolean {
  return isZaraBookmarkFilled(el)
}

/** Resolve pre-click saved state — DOM detection is unreliable on Zara */
export function resolveZaraWasSaved (
  productUrl: string,
  signatureBefore: string,
  el: Element
): boolean {
  const fromSig = isZaraSignatureSaved(productUrl, signatureBefore)
  if (fromSig !== undefined) return fromSig

  if (getZaraLogicalWishlistState(productUrl)) return true

  return isZaraBookmarkFilled(el)
}

export function applyZaraWishlistToggle (
  productUrl: string,
  action: ZaraWishlistAction,
  signatureBefore: string,
  signatureAfter: string
): void {
  const saved = action === 'wishlist_add'
  setZaraLogicalWishlistState(productUrl, saved)

  if (signatureAfter) learnZaraBookmarkVariant(productUrl, signatureAfter, saved)
  if (signatureBefore && signatureBefore !== signatureAfter) {
    learnZaraBookmarkVariant(productUrl, signatureBefore, !saved)
  }
}

export function inferZaraClickAction (wasSaved: boolean): ZaraWishlistAction {
  return wasSaved ? 'wishlist_remove' : 'wishlist_add'
}

export function inferZaraWishlistActionFromBookmarkChange (
  signatureBefore: string,
  signatureAfter: string,
  wasSaved: boolean
): ZaraWishlistAction | null {
  if (!signatureBefore || !signatureAfter || signatureBefore === signatureAfter) {
    return null
  }
  return inferZaraClickAction(wasSaved)
}

export function inferZaraWishlistActionFromBookmarkStates (
  wasSaved: boolean,
  isSaved: boolean
): ZaraWishlistAction | null {
  if (!wasSaved && isSaved) return 'wishlist_add'
  if (wasSaved && !isSaved) return 'wishlist_remove'
  return null
}

export function readZaraWishlistAriaLabel (el: Element): string {
  return el.getAttribute('aria-label') ?? ''
}
