import type { PlasmoCSConfig } from 'plasmo'

import { fohliooLog } from '~lib/debug'
import { installCaptureMessageHandler } from '~lib/capture/message-handler'
import { ProductPageController } from '~lib/capture/page-controller'
import { captureProduct } from '~lib/capture/product-capture'

export { captureProduct }

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

installCaptureMessageHandler(controller)
controller.start()

let lastUrl = window.location.href
const navObserver = new MutationObserver(() => {
  if (window.location.href === lastUrl) return

  lastUrl = window.location.href
  fohliooLog('spa', 'Navigation detected — recapturing in 800ms', { url: lastUrl })
  window.setTimeout(() => controller.start(), 800)
})

navObserver.observe(document.body, {
  subtree: true,
  childList: true,
})
