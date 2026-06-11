import type { ExtensionMessage } from './types/messages'
import { setLatestProduct } from './lib/storage'

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'PRODUCT_CAPTURED') {
      setLatestProduct(message.data)
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) =>
          sendResponse({ success: false, error: err.message })
        )
      return true
    }
  }
)
