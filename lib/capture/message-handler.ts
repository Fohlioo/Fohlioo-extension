import type { GetProductMessage, GetProductResponse, GetSessionMessage, GetSessionResponse } from '../../types/messages'
import { buildInitialSession, getShopperSession } from '../session'
import { mergeStickyProductFields } from '../product-merge'
import type { ProductPageController } from './page-controller'
import { captureProduct } from './product-capture'
import { sendProductCaptured } from './messenger'

async function resolveLiveProduct () {
  const [stored, live] = await Promise.all([
    getShopperSession(),
    Promise.resolve(captureProduct()),
  ])

  if (!live) return stored?.product ?? null

  return mergeStickyProductFields(stored?.product ?? null, live)
}

export function installCaptureMessageHandler (
  controller: ProductPageController
): void {
  chrome.runtime.onMessage.addListener(
    (message: GetProductMessage | GetSessionMessage, _sender, sendResponse) => {
      if (message.type === 'GET_PRODUCT') {
        void resolveLiveProduct().then((product) => {
          if (product) sendProductCaptured(product)

          const response: GetProductResponse = {
            success: true,
            data: product,
          }
          sendResponse(response)
        })
        return true
      }

      if (message.type === 'GET_SESSION') {
        void resolveLiveProduct().then((product) => {
          if (product) sendProductCaptured(product)

          getShopperSession().then((stored) => {
            const resolved = product ?? stored?.product ?? null
            if (!resolved) {
              sendResponse({ success: true, session: null } satisfies GetSessionResponse)
              return
            }

            const live = controller.getLiveMetrics()
            const session = stored ?? buildInitialSession(resolved)
            const response: GetSessionResponse = {
              success: true,
              session: {
                ...session,
                product: resolved,
                dwellMs: Math.max(session.dwellMs, live.dwellMs),
                scrollDepthPct: Math.max(session.scrollDepthPct, live.scrollDepthPct),
              },
              live,
            }
            sendResponse(response)
          })
        })
        return true
      }
    }
  )
}
