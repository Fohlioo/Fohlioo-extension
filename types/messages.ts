import type { ProductData } from '../interface'

export type ProductCapturedMessage = {
  type: 'PRODUCT_CAPTURED'
  data: ProductData
}

export type GetProductMessage = {
  type: 'GET_PRODUCT'
}

export type WishlistAddMessage = {
  type: 'WISHLIST_ADD'
  data: ProductData
}

export type WishlistRemoveMessage = {
  type: 'WISHLIST_REMOVE'
  data: ProductData
}

export type DwellMilestoneMessage = {
  type: 'DWELL_MILESTONE'
  data: ProductData
  milestoneMs: number
}

export type ScrollMilestoneMessage = {
  type: 'SCROLL_MILESTONE'
  data: ProductData
  milestonePct: number
}

export type GetTabCountMessage = {
  type: 'GET_TAB_COUNT'
}

export type GetSessionMessage = {
  type: 'GET_SESSION'
}

export type GetSessionResponse = {
  success: boolean
  session: import('../interface').ShopperSession | null
  live?: {
    dwellMs: number
    scrollDepthPct: number
  }
}

export type ExtensionMessage =
  | ProductCapturedMessage
  | GetProductMessage
  | GetSessionMessage
  | WishlistAddMessage
  | WishlistRemoveMessage
  | DwellMilestoneMessage
  | ScrollMilestoneMessage
  | GetTabCountMessage

export type GetProductResponse = {
  success: boolean
  data: ProductData | null
}

export type GetTabCountResponse = {
  count: number
}