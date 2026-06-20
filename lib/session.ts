import type {
  ProductData,
  SessionEvent,
  SessionEventType,
  ShopperSession,
} from '../interface'
import { mergeStickyProductFields } from './product-merge'
import { pageViewLabel } from './visit-history'

export const SESSION_KEY = 'shopperSession'
export const LATEST_PRODUCT_KEY = 'latestProduct'

const MAX_EVENTS = 10

export function createSessionEvent (
  type: SessionEventType,
  label: string,
  value?: number
): SessionEvent {
  return {
    type,
    label,
    value,
    timestamp: new Date().toISOString(),
  }
}

export function buildInitialSession (
  product: ProductData,
  options: { returnVisitCount?: number } = {}
): ShopperSession {
  const returnVisitCount = options.returnVisitCount ?? 1

  return {
    product,
    returnVisitCount,
    dwellMs: 0,
    scrollDepthPct: 0,
    wishlistStatus: 'unknown',
    recentEvents: [
      createSessionEvent(
        'page_view',
        pageViewLabel(returnVisitCount),
        returnVisitCount
      ),
    ],
    updatedAt: new Date().toISOString(),
  }
}

export function mergeSessionEvent (
  session: ShopperSession,
  event: SessionEvent,
  patch: Partial<ShopperSession> = {}
): ShopperSession {
  return {
    ...session,
    ...patch,
    product: patch.product ?? session.product,
    recentEvents: [...session.recentEvents, event].slice(-MAX_EVENTS),
    updatedAt: new Date().toISOString(),
  }
}

export async function getShopperSession (): Promise<ShopperSession | null> {
  const result = await chrome.storage.local.get(SESSION_KEY)
  return (result[SESSION_KEY] as ShopperSession | undefined) ?? null
}

export async function setShopperSession (session: ShopperSession): Promise<void> {
  await chrome.storage.local.set({
    [SESSION_KEY]: session,
    [LATEST_PRODUCT_KEY]: session.product,
  })
}

export async function applySessionUpdate (
  product: ProductData,
  event: SessionEvent,
  patch: Partial<ShopperSession> = {}
): Promise<ShopperSession> {
  const existing = await getShopperSession()
  const sameProduct =
    existing?.product.url === product.url &&
    existing?.product.name === product.name

  const mergedProduct =
    sameProduct && existing
      ? mergeStickyProductFields(existing.product, product)
      : product

  const base = sameProduct && existing
    ? existing
    : buildInitialSession(mergedProduct)

  const next = mergeSessionEvent(
    { ...base, product: mergedProduct },
    event,
    patch
  )
  await setShopperSession(next)
  return next
}
