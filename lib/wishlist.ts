import { getSiteKey } from './dom-extractor'

/** ASOS PDP — heart in [data-testid="primaryActions"], toggles saveForLater */
const ASOS_WISHLIST_SELECTORS = [
  '[data-testid="primaryActions"] button[data-testid="saveForLater"]',
  'button[data-testid="saveForLater"]',
  'button[data-auto-id="btn-addToSavedItems"]',
  'button[data-auto-id="btn-removeFromSavedItems"]',
  'button[data-auto-id*="savedItems" i]',
]

/** Site-first selectors, then generic fallbacks (comma-separated for querySelector) */
const WISHLIST_SITE_SELECTORS: Record<string, string[]> = {
  'asos.com': ASOS_WISHLIST_SELECTORS,
  'cos.com': ['button[data-testid="pdp-addToWishlist"]'],
  'arket.com': ['button[data-testid="pdp-addToWishlist"]'],
  'stories.com': ['button[data-testid="pdp-addToWishlist"]'],
  'hm.com': ['button[data-testid="pdp-addToWishlist"]'],
}

const GENERIC_WISHLIST_SELECTORS = [
  'button[data-testid="saveForLater"]',
  'button[data-testid="pdp-addToWishlist"]',
  'button[data-action="wishlist"]',
  '[data-wishlist] button',
  'button[aria-label*="wishlist" i]',
  'button[aria-label*="saved items" i]',
  'button[aria-label*="favourite" i]',
  'button[aria-label*="save for later" i]',
  '[class*="wishlist" i] button',
  '[class*="favourite" i] button',
]

export function getWishlistButtonSelector (hostname: string): string {
  const siteKey = getSiteKey(hostname)
  const siteSelectors = siteKey ? WISHLIST_SITE_SELECTORS[siteKey] ?? [] : []
  return [...new Set([...siteSelectors, ...GENERIC_WISHLIST_SELECTORS])].join(', ')
}

function isAsosSaveForLaterButton (el: Element): boolean {
  return (el.getAttribute('data-testid') ?? '').toLowerCase() === 'saveforlater'
}

export function isAsosSite (hostname: string): boolean {
  return getSiteKey(hostname) === 'asos.com'
}

/** ASOS toggles heart icon class inside the button, not always aria-label */
function isAsosHeartFilled (el: Element): boolean | null {
  if (!isAsosSaveForLaterButton(el)) return null

  const classBlob = el.innerHTML.toLowerCase()
  if (/product-heartfilled|product-heartsaved|heartfilled|heartsaved/.test(classBlob)) {
    return true
  }
  if (/product-heartempty|heartempty/.test(classBlob)) {
    return false
  }

  for (const child of el.querySelectorAll('[class*="heart" i]')) {
    const cls = child.className.toString().toLowerCase()
    if (/filled|saved|active/.test(cls) && !/empty/.test(cls)) return true
    if (/empty/.test(cls)) return false
  }

  return null
}

/** ASOS saveForLater — heart class + aria-label */
function isAsosWishlistActive (el: Element): boolean {
  const heartState = isAsosHeartFilled(el)
  if (heartState !== null) return heartState

  const label = (el.getAttribute('aria-label') ?? '').toLowerCase().trim()
  if (!label) return false

  if (/^save for later$/i.test(label)) return false
  if (/^saved for later$/i.test(label)) return true
  if (/^saved$/i.test(label)) return true
  if (/remove from saved/i.test(label)) return true

  return false
}

/** On click, ASOS intent is the inverse of current saved state */
export function inferAsosClickAction (wasActive: boolean): WishlistAction {
  return wasActive ? 'wishlist_remove' : 'wishlist_add'
}

/** Whether the control currently reflects a saved / wishlisted item */
export function isWishlistActive (el: Element): boolean {
  if (isAsosSaveForLaterButton(el)) {
    return isAsosWishlistActive(el)
  }

  const ariaLabel = (el.getAttribute('aria-label') ?? '').toLowerCase().trim()
  const testId = (el.getAttribute('data-testid') ?? '').toLowerCase()
  const autoId = (el.getAttribute('data-auto-id') ?? '').toLowerCase()

  if (ariaLabel.includes('remove from')) return true
  if (
    ariaLabel.includes('remove') &&
    (ariaLabel.includes('saved') || ariaLabel.includes('wishlist'))
  ) {
    return true
  }
  if (ariaLabel.startsWith('saved') && !ariaLabel.includes('add')) return true

  if (testId.includes('remove') && testId.includes('wishlist')) return true
  if (autoId.includes('removefromsaved') || autoId.includes('removefromsaveditems')) {
    return true
  }

  if (el.getAttribute('aria-pressed') === 'true') return true
  if (el.getAttribute('aria-checked') === 'true') return true

  const className = el.className.toString().toLowerCase()
  if (/\bis-saved\b/.test(className) || /\bsaved\b/.test(className)) return true
  if (
    className.includes('active') &&
    (className.includes('wishlist') || className.includes('saved'))
  ) {
    return true
  }

  return false
}

export type WishlistAction = 'wishlist_add' | 'wishlist_remove'

export function inferWishlistAction (
  wasActive: boolean,
  isActive: boolean
): WishlistAction | null {
  if (!wasActive && isActive) return 'wishlist_add'
  if (wasActive && !isActive) return 'wishlist_remove'
  return null
}

function isWishlistActiveLabel (label: string): boolean {
  const normalized = label.toLowerCase().trim()
  if (/^save for later$/i.test(normalized)) return false
  if (/^saved for later$/i.test(normalized)) return true
  if (/^saved$/i.test(normalized)) return true
  if (normalized.includes('remove from')) return true
  if (
    normalized.includes('remove') &&
    (normalized.includes('saved') || normalized.includes('wishlist'))
  ) {
    return true
  }
  return false
}

/** Infer toggle when aria-label updates after click (ASOS saveForLater pattern) */
export function inferWishlistActionFromLabels (
  labelBefore: string,
  labelAfter: string
): WishlistAction | null {
  const before = labelBefore.toLowerCase().trim()
  const after = labelAfter.toLowerCase().trim()
  if (!before || !after || before === after) return null

  const beforeActive = isWishlistActiveLabel(before)
  const afterActive = isWishlistActiveLabel(after)

  if (!beforeActive && afterActive) return 'wishlist_add'
  if (beforeActive && !afterActive) return 'wishlist_remove'
  return null
}

export function findWishlistButton (
  target: EventTarget | null,
  hostname: string
): Element | null {
  if (!(target instanceof Element)) return null

  if (isAsosSite(hostname)) {
    const btn = target.closest('button[data-testid="saveForLater"]')
    if (btn) return btn
  }

  const selector = getWishlistButtonSelector(hostname)
  return target.closest(selector)
}

const ASOS_SAVE_BUTTON_SELECTOR =
  '[data-testid="primaryActions"] button[data-testid="saveForLater"], button[data-testid="saveForLater"]'

export function queryWishlistButtons (hostname: string): Element[] {
  if (isAsosSite(hostname)) {
    const inPrimary = [
      ...document.querySelectorAll(
        '[data-testid="primaryActions"] button[data-testid="saveForLater"]'
      ),
    ]
    if (inPrimary.length > 0) return inPrimary
    return [...document.querySelectorAll('button[data-testid="saveForLater"]')]
  }

  const selector = getWishlistButtonSelector(hostname)
  return [...document.querySelectorAll(selector)]
}

export function waitForWishlistButton (
  hostname: string,
  onReady: (button: Element) => void,
  timeoutMs = 15_000
): () => void {
  const existing = queryWishlistButtons(hostname)
  if (existing.length > 0) {
    onReady(existing[0])
    return () => {}
  }

  const observer = new MutationObserver(() => {
    const buttons = queryWishlistButtons(hostname)
    if (buttons.length > 0) {
      onReady(buttons[0])
      observer.disconnect()
    }
  })

  observer.observe(document.body, { subtree: true, childList: true })
  const timer = window.setTimeout(() => observer.disconnect(), timeoutMs)

  return () => {
    observer.disconnect()
    window.clearTimeout(timer)
  }
}
