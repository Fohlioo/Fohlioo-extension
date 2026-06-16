import type { ProductData } from '../interface'
import { LATEST_PRODUCT_KEY } from './session'

export { LATEST_PRODUCT_KEY }

export async function getLatestProduct (): Promise<ProductData | null> {
  const result = await chrome.storage.local.get(LATEST_PRODUCT_KEY)
  return (result[LATEST_PRODUCT_KEY] as ProductData | undefined) ?? null
}

export async function setLatestProduct (product: ProductData): Promise<void> {
  await chrome.storage.local.set({ [LATEST_PRODUCT_KEY]: product })
}
