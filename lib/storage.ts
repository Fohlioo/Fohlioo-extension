import type { ProductData } from '../interface'

const LATEST_PRODUCT_KEY = 'latestProduct'

export async function getLatestProduct (): Promise<ProductData | null> {
  const result = await chrome.storage.local.get(LATEST_PRODUCT_KEY)
  return (result[LATEST_PRODUCT_KEY] as ProductData | undefined) ?? null
}

export async function setLatestProduct (product: ProductData): Promise<void> {
  await chrome.storage.local.set({ [LATEST_PRODUCT_KEY]: product })
}
