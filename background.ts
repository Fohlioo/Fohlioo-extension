import type {
  DwellMilestoneMessage,
  ExtensionMessage,
  GetTabCountResponse,
  ScrollMilestoneMessage,
  SectionEngagementMessage,
  WishlistAddMessage,
  WishlistRemoveMessage,
} from './types/messages'
import type { SessionEventType } from './interface'
import {
  applySessionUpdate,
  buildInitialSession,
  createSessionEvent,
  getShopperSession,
  setShopperSession,
} from './lib/session'
import { isFashionSite } from './lib/sites/registry'
import { mergeStickyProductFields } from './lib/product-merge'

const SECTION_EVENT_TYPE: Record<
  SectionEngagementMessage['section'],
  SessionEventType
> = {
  details: 'details_section_view',
  materials: 'material_section_view',
  size_guide: 'size_guide_view',
  reviews: 'review_section_view',
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'PRODUCT_CAPTURED') {
      getShopperSession()
        .then((existing) => {
          const sameProduct =
            existing?.product.url === message.data.url &&
            existing?.product.name === message.data.name

          if (sameProduct && existing) {
            return setShopperSession({
              ...existing,
              product: mergeStickyProductFields(
                existing.product,
                message.data
              ),
              updatedAt: new Date().toISOString(),
            })
          }

          return setShopperSession(buildInitialSession(message.data))
        })
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

    if (message.type === 'SECTION_ENGAGEMENT') {
      const msg = message as SectionEngagementMessage
      applySessionUpdate(
        msg.data,
        createSessionEvent(SECTION_EVENT_TYPE[msg.section], msg.label)
      ).catch(() => {})
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
