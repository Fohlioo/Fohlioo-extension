import type { PlasmoCSConfig } from 'plasmo'
import type { ProductData } from '../interface'
import { extractFromDom } from '~lib/dom-extractor'
import {
  extractFromJsonLd,
  extractFromOG,
  mergeExtractedProductData
} from '~lib/extractor'
import type { GetProductMessage, GetProductResponse } from '~types/messages'

export const config: PlasmoCSConfig = {
  matches: [
    'https://*.cos.com/*',
    'https://*.net-a-porter.com/*',
    'https://*.asos.com/*',
    'https://*.zara.com/*',
    'https://*.toteme-studio.com/*',
    'https://*.reiss.com/*',
    'https://*.stories.com/*',
    'https://*.arket.com/*',
    'https://*.hm.com/*',
    'https://*.reebok.eu/*',
    'https://*.reebok.com/*',
  ]
}

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
    images: null,
    material: null,
    availability: 'unknown',
    sizes: [],
    extractionSource: 'dom',
    ...merged,
    url: merged.url ?? window.location.href,
    capturedAt: new Date().toISOString(),
  }

  if (!productData.name && !productData.brand) return null

  console.log('[Fohlioo] Product data:', productData)

  return productData
}

function publishCapture (productData: ProductData) {
  chrome.runtime
    .sendMessage({ type: 'PRODUCT_CAPTURED', data: productData })
    .catch(() => {
      // Background may be unavailable during extension reload
    })
}

let lastPublishedSizes = ''

const capturePageView = () => {
  const productData = captureProduct()
  if (!productData) return

  publishCapture(productData)
  lastPublishedSizes = productData.sizes.join('|')

  if (productData.sizes.length === 0) {
    watchForDomSizes()
  }
}

/** COS and similar SPAs hydrate size pickers after JSON-LD is available */
function watchForDomSizes () {
  const root = document.body
  if (!root) return

  const observer = new MutationObserver(() => {
    const productData = captureProduct()
    if (!productData || productData.sizes.length === 0) return

    const sizeKey = productData.sizes.join('|')
    if (sizeKey === lastPublishedSizes) return

    lastPublishedSizes = sizeKey
    publishCapture(productData)
    observer.disconnect()
  })

  observer.observe(root, { subtree: true, childList: true, characterData: true })

  setTimeout(() => observer.disconnect(), 10_000)
}

chrome.runtime.onMessage.addListener(
  (message: GetProductMessage, _sender, sendResponse) => {
    if (message.type !== 'GET_PRODUCT') return

    const productData = captureProduct()
    if (productData) publishCapture(productData)

    const response: GetProductResponse = {
      success: true,
      data: productData,
    }
    sendResponse(response)
    return true
  }
)

capturePageView()

let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    setTimeout(capturePageView, 800)
  }
})

observer.observe(document.body, {
  subtree: true,
  childList: true
})
