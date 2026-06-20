export const VISIT_HISTORY_KEY = 'productVisitHistory'

/** Max product URLs to remember — evicts oldest by last visit */
export const MAX_VISIT_HISTORY_ENTRIES = 500

const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|gclsrc$|msclkid$|mc_cid$|mc_eid$|ref$|referrer$)/i

export type ProductVisitEntry = {
  visitCount: number
  lastVisitedAt: string
}

export type ProductVisitHistory = Record<string, ProductVisitEntry>

/** Stable key for the same PDP across sessions (strips hash + tracking params). */
export function normalizeProductUrl (rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    url.hash = ''

    const kept = new URLSearchParams()
    for (const [key, value] of url.searchParams.entries()) {
      if (!TRACKING_PARAM.test(key)) {
        kept.append(key, value)
      }
    }

    const sorted = [...kept.entries()].sort(([a], [b]) => a.localeCompare(b))
    url.search = sorted.length > 0 ? `?${new URLSearchParams(sorted).toString()}` : ''

    return url.toString()
  } catch {
    return rawUrl
  }
}

export function pageViewLabel (visitCount: number): string {
  return visitCount === 1 ? 'Product page opened' : `Return visit (${visitCount})`
}

/** Pure increment — used by storage layer and unit tests */
export function bumpVisitEntry (
  history: ProductVisitHistory,
  normalizedUrl: string,
  visitedAt: string,
  maxEntries = MAX_VISIT_HISTORY_ENTRIES
): { history: ProductVisitHistory; visitCount: number } {
  const existing = history[normalizedUrl]
  const visitCount = (existing?.visitCount ?? 0) + 1

  const next: ProductVisitHistory = {
    ...history,
    [normalizedUrl]: { visitCount, lastVisitedAt: visitedAt },
  }

  const keys = Object.keys(next)
  if (keys.length <= maxEntries) {
    return { history: next, visitCount }
  }

  const oldestKey = keys.reduce((oldest, key) => {
    const ts = next[key].lastVisitedAt
    const oldestTs = next[oldest].lastVisitedAt
    return ts < oldestTs ? key : oldest
  })

  const { [oldestKey]: _removed, ...trimmed } = next
  return { history: trimmed, visitCount }
}

export async function getProductVisitCount (productUrl: string): Promise<number> {
  const key = normalizeProductUrl(productUrl)
  const result = await chrome.storage.local.get(VISIT_HISTORY_KEY)
  const history = (result[VISIT_HISTORY_KEY] as ProductVisitHistory | undefined) ?? {}
  return history[key]?.visitCount ?? 0
}

/** Increment visit count for a product URL and persist to chrome.storage.local */
export async function recordProductVisit (productUrl: string): Promise<number> {
  const key = normalizeProductUrl(productUrl)
  const visitedAt = new Date().toISOString()
  const result = await chrome.storage.local.get(VISIT_HISTORY_KEY)
  const history = (result[VISIT_HISTORY_KEY] as ProductVisitHistory | undefined) ?? {}
  const { history: next, visitCount } = bumpVisitEntry(history, key, visitedAt)
  await chrome.storage.local.set({ [VISIT_HISTORY_KEY]: next })
  return visitCount
}
