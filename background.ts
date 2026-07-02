import type {
  AddToCartMessage,
  DwellMilestoneMessage,
  ExtensionMessage,
  GetTabCountResponse,
  RemoveFromCartMessage,
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
import { FASHION_TAB_QUERY_URL_PATTERNS } from './lib/sites/content-script-matches'
import { mergeStickyProductFields } from './lib/product-merge'
import { recordProductVisit } from './lib/visit-history'

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
        .then(async (existing) => {
          const sameProduct =
            existing?.product.url === message.data.url &&
            existing?.product.name === message.data.name

          if (sameProduct && existing && !message.recordVisit) {
            return setShopperSession({
              ...existing,
              product: mergeStickyProductFields(
                existing.product,
                message.data
              ),
              updatedAt: new Date().toISOString(),
            })
          }

          if (message.recordVisit) {
            const returnVisitCount = await recordProductVisit(message.data.url)
            const mergedProduct =
              sameProduct && existing
                ? mergeStickyProductFields(existing.product, message.data)
                : message.data

            return setShopperSession({
              ...buildInitialSession(mergedProduct, { returnVisitCount }),
              wishlistStatus:
                sameProduct && existing
                  ? existing.wishlistStatus
                  : 'unknown',
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

    if (message.type === 'ADD_TO_CART') {
      const msg = message as AddToCartMessage
      applySessionUpdate(
        msg.data,
        createSessionEvent('add_to_cart', 'Added to bag')
      ).catch(() => {})
      return false
    }

    if (message.type === 'REMOVE_FROM_CART') {
      const msg = message as RemoveFromCartMessage
      applySessionUpdate(
        msg.data,
        createSessionEvent('remove_from_cart', 'Removed from bag')
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
      chrome.tabs.query({ url: [...FASHION_TAB_QUERY_URL_PATTERNS] }, (tabs) => {
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
