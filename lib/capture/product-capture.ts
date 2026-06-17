import type { ProductData } from '../../interface'
import { extractFromDom } from '../dom-extractor'
import { fohliooLog } from '../debug'
import {
  extractFromJsonLd,
  extractFromOG,
  mergeExtractedProductData,
} from '../extractor'

export function captureProduct (): ProductData | null {
  const merged = mergeExtractedProductData(
    extractFromJsonLd(),
    extractFromOG(),
    extractFromDom()
  )

  const productData: ProductData = {
    name: null,
    brand: null,
    price: null,
    originalPrice: null,
    currency: null,
    category: null,
    colour: null,
    material: null,
    images: null,
    availability: 'unknown',
    sizes: [],
    extractionSource: 'dom',
    ...merged,
    url: merged.url ?? window.location.href,
    capturedAt: new Date().toISOString(),
  }

  if (!productData.name && !productData.brand) {
    return null
  }

  fohliooLog('capture', 'Product captured', productData)
  return productData
}
