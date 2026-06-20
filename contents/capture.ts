import type { PlasmoCSConfig } from 'plasmo'

import { fohliooLog } from '~lib/debug'
import { installCaptureMessageHandler } from '~lib/capture/message-handler'
import { ProductPageController } from '~lib/capture/page-controller'
import { captureProduct } from '~lib/capture/product-capture'

export { captureProduct }

// Plasmo requires a literal `matches` array here (static analysis at build time).
// Keep in sync with `lib/sites/content-script-matches.ts`.
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
  ],
}

const controller = new ProductPageController()

const CAPTURE_RETRY_MS = 500
const CAPTURE_RETRY_MAX = 40

/** ASOS and other React PDPs often hydrate after document_idle */
function startCaptureWithRetry (): void {
  try {
    if (controller.start()) return
  } catch (err) {
    fohliooLog('capture', 'controller.start threw on first pass', err)
  }

  fohliooLog('capture', 'Product not ready on first pass — scheduling retries')
  let attempts = 0
  const timer = window.setInterval(() => {
    attempts++
    try {
      if (controller.start()) {
        window.clearInterval(timer)
        return
      }
    } catch (err) {
      fohliooLog('capture', 'controller.start threw during retry', err)
    }
    if (attempts >= CAPTURE_RETRY_MAX) {
      window.clearInterval(timer)
      fohliooLog('capture', 'Product capture stopped retrying')
    }
  }, CAPTURE_RETRY_MS)
}

try {
  fohliooLog('capture', 'Fohlioo content script loaded', {
    url: window.location.href,
  })
  installCaptureMessageHandler(controller)
  startCaptureWithRetry()

  let lastUrl = window.location.href
  const navObserver = new MutationObserver(() => {
    if (window.location.href === lastUrl) return

    lastUrl = window.location.href
    fohliooLog('spa', 'Navigation detected — recapturing in 800ms', {
      url: lastUrl,
    })
    window.setTimeout(() => startCaptureWithRetry(), 800)
  })

  navObserver.observe(document.body, {
    subtree: true,
    childList: true,
  })
} catch (err) {
  fohliooLog('capture', 'Fatal error initialising content script', err)
}
