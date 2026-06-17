import { getSiteKey } from '../registry'

export const COS_WISHLIST_SELECTOR = 'button[data-testid="wishlist-button"]'

export type CosWishlistAction = 'wishlist_add' | 'wishlist_remove'

/** Survives React re-mounting the wishlist button between toggles */
const cosLogicalStateByUrl = new Map<string, boolean>()
const cosFilledPathByUrl = new Map<string, string>()
const cosOutlinePathByUrl = new Map<string, string>()

export function isCosSite (hostname: string): boolean {
  return getSiteKey(hostname) === 'cos.com'
}

export function getCosLogicalWishlistState (url: string): boolean {
  return cosLogicalStateByUrl.get(url) ?? false
}

export function setCosLogicalWishlistState (url: string, saved: boolean): void {
  cosLogicalStateByUrl.set(url, saved)
}

export function clearCosLogicalWishlistState (url: string): void {
  cosLogicalStateByUrl.delete(url)
  cosFilledPathByUrl.delete(url)
  cosOutlinePathByUrl.delete(url)
}

export function learnCosHeartPathVariant (
  url: string,
  pathSig: string,
  saved: boolean
): void {
  if (!pathSig) return
  if (saved) cosFilledPathByUrl.set(url, pathSig)
  else cosOutlinePathByUrl.set(url, pathSig)
}

export function isCosPathFilled (
  url: string,
  pathSig: string
): boolean | undefined {
  if (!pathSig) return undefined
  if (cosFilledPathByUrl.get(url) === pathSig) return true
  if (cosOutlinePathByUrl.get(url) === pathSig) return false
  return undefined
}

export function isCosWishlistButton (el: Element): boolean {
  return (el.getAttribute('data-testid') ?? '').toLowerCase() === 'wishlist-button'
}

/** COS keeps `title="Wishlist active"` in both states — only for logging */
export function readCosWishlistLabel (el: Element): string {
  return (el.getAttribute('title') ?? el.getAttribute('aria-label') ?? '').trim()
}

function parseOpacity (value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 1
}

function isVisiblePaint (
  color: string,
  opacity: string
): boolean {
  if (!color || color === 'none' || color === 'transparent') return false
  return parseOpacity(opacity) > 0
}

/**
 * COS toggles a filled vs outline heart SVG.
 * `title` stays "Wishlist active" in both states — do not use it for state.
 */
export function isCosHeartFilled (el: Element): boolean {
  const path = el.querySelector('svg path')
  if (!path) return false

  const attrFill = (path.getAttribute('fill') ?? '').toLowerCase()
  const attrStroke = (path.getAttribute('stroke') ?? '').toLowerCase()

  if (attrFill === 'none' && attrStroke && attrStroke !== 'none') return false
  if (attrFill === 'currentcolor' && (!attrStroke || attrStroke === 'none')) {
    return true
  }

  if (typeof window === 'undefined' || !('getComputedStyle' in window)) {
    return false
  }

  const style = window.getComputedStyle(path)
  const strokeWidth = Number.parseFloat(style.strokeWidth)
  const hasStroke =
    strokeWidth > 0 && isVisiblePaint(style.stroke, style.strokeOpacity)
  const hasFill = isVisiblePaint(style.fill, style.fillOpacity)

  if (hasStroke && !hasFill) return false
  if (hasFill && !hasStroke) return true

  return hasFill
}

export function isCosWishlistActive (el: Element): boolean {
  if (!isCosWishlistButton(el)) return false
  return isCosHeartFilled(el)
}

export function inferCosClickAction (wasActive: boolean): CosWishlistAction {
  return wasActive ? 'wishlist_remove' : 'wishlist_add'
}

export function getCosHeartPathSignature (el: Element): string {
  const path = el.querySelector('svg path')
  return path?.getAttribute('d')?.trim() ?? ''
}

export function inferCosWishlistActionFromHeartChange (
  pathBefore: string,
  pathAfter: string,
  wasFilled: boolean
): CosWishlistAction | null {
  if (!pathBefore || !pathAfter || pathBefore === pathAfter) return null
  return inferCosClickAction(wasFilled)
}

/** Resolve pre-click saved state — DOM detection is unreliable on COS */
export function resolveCosWasFilled (
  productUrl: string,
  pathBefore: string,
  el: Element
): boolean {
  const fromPath = isCosPathFilled(productUrl, pathBefore)
  if (fromPath !== undefined) return fromPath

  const fromDom = isCosHeartFilled(el)
  if (fromDom) return true

  return getCosLogicalWishlistState(productUrl)
}

export function applyCosWishlistToggle (
  productUrl: string,
  action: CosWishlistAction,
  pathBefore: string,
  pathAfter: string
): void {
  const saved = action === 'wishlist_add'
  setCosLogicalWishlistState(productUrl, saved)

  if (pathAfter) learnCosHeartPathVariant(productUrl, pathAfter, saved)
  if (pathBefore && pathBefore !== pathAfter) {
    learnCosHeartPathVariant(productUrl, pathBefore, !saved)
  }
}

export function inferCosWishlistActionFromHeartStates (
  wasFilled: boolean,
  isFilled: boolean
): CosWishlistAction | null {
  if (!wasFilled && isFilled) return 'wishlist_add'
  if (wasFilled && !isFilled) return 'wishlist_remove'
  return null
}

/** @deprecated COS title does not reflect saved state */
export function isCosWishlistTitleActive (_title: string): boolean {
  return false
}

/** @deprecated COS title does not change on toggle */
export function inferCosWishlistActionFromTitles (
  _titleBefore: string,
  _titleAfter: string
): CosWishlistAction | null {
  return null
}
