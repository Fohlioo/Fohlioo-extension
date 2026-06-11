import type { ProductData } from '../interface'
import type { GetProductResponse } from '../types/messages'
import { getLatestProduct } from './storage'

export async function fetchActiveTabProduct (): Promise<ProductData | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return getLatestProduct()

    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_PRODUCT',
    })) as GetProductResponse | undefined

    if (response?.success && response.data) return response.data
  } catch {
    // Content script may not be injected on this tab
  }

  return getLatestProduct()
}
