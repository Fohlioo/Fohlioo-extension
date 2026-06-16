import type { ShopperSession } from '../interface'
import type { GetSessionResponse } from '../types/messages'
import { getShopperSession, SESSION_KEY } from './session'
import { getLatestProduct } from './storage'

export async function fetchShopperSession (): Promise<ShopperSession | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      const response = (await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_SESSION',
      })) as GetSessionResponse | undefined

      if (response?.success && response.session) {
        return {
          ...response.session,
          dwellMs: Math.max(
            response.session.dwellMs,
            response.live?.dwellMs ?? 0
          ),
          scrollDepthPct: Math.max(
            response.session.scrollDepthPct,
            response.live?.scrollDepthPct ?? 0
          ),
        }
      }
    }
  } catch {
    // Content script unavailable
  }

  return getShopperSession()
}

export function watchSession (
  onChange: (session: ShopperSession | null) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ) => {
    if (area !== 'local') return
    if (changes[SESSION_KEY]?.newValue) {
      onChange(changes[SESSION_KEY].newValue as ShopperSession)
      return
    }
    if (changes.latestProduct?.newValue) {
      getShopperSession().then(onChange)
    }
  }

  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}

export async function fetchActiveTabProduct () {
  const session = await fetchShopperSession()
  if (session) return session.product
  return getLatestProduct()
}
