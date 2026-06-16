import type { PlasmoCSConfig } from 'plasmo'
import type { ProductData } from '../interface'
import { fohliooLog } from '~lib/debug'
import { extractFromDom } from '~lib/dom-extractor'
import {
  extractFromJsonLd,
  extractFromOG,
  mergeExtractedProductData
} from '~lib/extractor'
import type { GetProductMessage, GetProductResponse, GetSessionMessage, GetSessionResponse } from '~types/messages'
import {
  startDwellTracking,
  startScrollTracking,
  startWishlistTracking,
  getLiveMetrics,
  resetLiveMetrics,
} from '~lib/events'
import { buildInitialSession, getShopperSession } from '~lib/session'

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
    'https://*.underarmour.com/*',
    'https://*.puma.com/*',
    'https://*.underarmour.co.uk/*',
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
    capturedAt: new Date().toISOString()
  }
/* 
  if (!productData.name && !productData.brand) {
    fohliooLog('capture', 'Skipped — not a product page', { url: window.location.href })
    return null
  }

  fohliooLog('capture', 'Product captured', productData) */

  return productData
}

function publishCapture (productData: ProductData) {
  fohliooLog('message', 'PRODUCT_CAPTURED → background', {
    name: productData.name,
    sizes: productData.sizes,
    source: productData.extractionSource,
  })
  chrome.runtime
    .sendMessage({ type: 'PRODUCT_CAPTURED', data: productData })
    .catch(() => {
      // Background may be unavailable during extension reload
    })
}

let lastPublishedSizes = ''

const capturePageView = () => {
  fohliooLog('capture', 'Page view capture started', { url: window.location.href })
  resetLiveMetrics()

  const productData = captureProduct()
  if (!productData) return

  publishCapture(productData)
  lastPublishedSizes = productData.sizes.join('|')

  if (productData.sizes.length === 0) {
    fohliooLog('sizes', 'No sizes yet — watching DOM for hydration')
    watchForDomSizes()
  }

  startDwellTracking(productData, (ms, p) => {
    fohliooLog('dwell', 'Sending milestone to background', { ms })
    chrome.runtime.sendMessage({
      type: 'DWELL_MILESTONE',
      data: p,
      milestoneMs: ms,
    }).catch(() => {})
  })

  startScrollTracking(productData, (pct, p) => {
    fohliooLog('scroll', 'Sending milestone to background', { pct })
    chrome.runtime.sendMessage({
      type: 'SCROLL_MILESTONE',
      data: p,
      milestonePct: pct,
    }).catch(() => {})
  })

  startWishlistTracking(
    productData,
    p => {
      fohliooLog('message', 'WISHLIST_ADD → background', { name: p.name })
      chrome.runtime.sendMessage({ type: 'WISHLIST_ADD', data: p }).catch(() => {})
    },
    p => {
      fohliooLog('message', 'WISHLIST_REMOVE → background', { name: p.name })
      chrome.runtime.sendMessage({ type: 'WISHLIST_REMOVE', data: p }).catch(() => {})
    }
  )
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
    fohliooLog('sizes', 'Sizes hydrated from DOM', { sizes: productData.sizes })
    publishCapture(productData)
    observer.disconnect()
  })

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true
  })

  setTimeout(() => observer.disconnect(), 10_000)
}

chrome.runtime.onMessage.addListener(
  (message: GetProductMessage | GetSessionMessage, _sender, sendResponse) => {
    if (message.type === 'GET_PRODUCT') {
      const productData = captureProduct()
      if (productData) publishCapture(productData)

      const response: GetProductResponse = {
        success: true,
        data: productData,
      }
      sendResponse(response)
      return true
    }

    if (message.type === 'GET_SESSION') {
      const productData = captureProduct()
      if (productData) publishCapture(productData)

      getShopperSession().then((stored) => {
        const product = productData ?? stored?.product ?? null
        if (!product) {
          sendResponse({ success: true, session: null } satisfies GetSessionResponse)
          return
        }

        const live = getLiveMetrics()
        const session = stored ?? buildInitialSession(product)
        const response: GetSessionResponse = {
          success: true,
          session: {
            ...session,
            product,
            dwellMs: Math.max(session.dwellMs, live.dwellMs),
            scrollDepthPct: Math.max(session.scrollDepthPct, live.scrollDepthPct),
          },
          live,
        }
        sendResponse(response)
      })
      return true
    }
  }
)

capturePageView()

let lastUrl = window.location.href
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    fohliooLog('spa', 'Navigation detected — recapturing in 800ms', { url: lastUrl })
    setTimeout(capturePageView, 800)
  }
})

observer.observe(document.body, {
  subtree: true,
  childList: true
})
