import type {
  DwellMilestoneMessage,
  ExtensionMessage,
  GetTabCountResponse,
  ScrollMilestoneMessage,
  WishlistAddMessage,
  WishlistRemoveMessage,
} from './types/messages'
import {
  applySessionUpdate,
  buildInitialSession,
  createSessionEvent,
  getShopperSession,
  setShopperSession,
} from './lib/session'

const FASHION_DOMAINS = [
  'cos.com',
  'net-a-porter.com',
  'mrporter.com',
  'asos.com',
  'zara.com',
  'toteme-studio.com',
  'reiss.com',
  'stories.com',
  'arket.com',
  'hm.com',
  'reebok.eu',
  'reebok.com',
]

function isFashionSite (url: string): boolean {
  return FASHION_DOMAINS.some((domain) => url.includes(domain))
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'PRODUCT_CAPTURED') {
      const session = buildInitialSession(message.data)
      setShopperSession(session)
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) =>
          sendResponse({ success: false, error: err.message })
        )
      return true
    }

    if (message.type === 'WISHLIST_ADD') {
      const msg = message as WishlistAddMessage
      applySessionUpdate(
        msg.data,
        createSessionEvent('wishlist_add', 'Added to wishlist'),
        { wishlistStatus: 'saved' }
      ).catch(() => {})
      return false
    }

    if (message.type === 'WISHLIST_REMOVE') {
      const msg = message as WishlistRemoveMessage
      applySessionUpdate(
        msg.data,
        createSessionEvent('wishlist_remove', 'Removed from wishlist'),
        { wishlistStatus: 'not_saved' }
      ).catch(() => {})
      return false
    }

    if (message.type === 'DWELL_MILESTONE') {
      const msg = message as DwellMilestoneMessage
      getShopperSession().then((session) => {
        const dwellMs = Math.max(session?.dwellMs ?? 0, msg.milestoneMs)
        applySessionUpdate(
          msg.data,
          createSessionEvent(
            'dwell_milestone',
            `Viewed for ${msg.milestoneMs / 1000}s`,
            msg.milestoneMs
          ),
          { dwellMs }
        )
      })
      return false
    }

    if (message.type === 'SCROLL_MILESTONE') {
      const msg = message as ScrollMilestoneMessage
      getShopperSession().then((session) => {
        const scrollDepthPct = Math.max(
          session?.scrollDepthPct ?? 0,
          msg.milestonePct
        )
        applySessionUpdate(
          msg.data,
          createSessionEvent(
            'scroll_milestone',
            `Scrolled to ${msg.milestonePct}%`,
            msg.milestonePct
          ),
          { scrollDepthPct }
        )
      })
      return false
    }

    if (message.type === 'GET_TAB_COUNT') {
      chrome.tabs.query({}, (tabs) => {
        const count = tabs.filter(
          (tab) => tab.url && isFashionSite(tab.url)
        ).length
        const response: GetTabCountResponse = { count }
        sendResponse(response)
      })
      return true
    }
  }
)
