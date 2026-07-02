interface ProductData {
  url: string
  name: string | null
  brand: string | null
  price: number | null
  originalPrice: number | null
  currency: string | null
  category: string | null
  colour: string | null
  material: string | null
  /** Single image URL, or multiple when the product has a gallery */
  images: string | string[] | null
  availability: 'in_stock' | 'out_of_stock' | 'unknown'
  sizes: string[]
  capturedAt: string
  extractionSource: 'json_ld' | 'open_graph' | 'dom'
}

type SessionEventType =
  | 'page_view'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'dwell_milestone'
  | 'scroll_milestone'
  | 'details_section_view'
  | 'material_section_view'
  | 'size_guide_view'
  | 'review_section_view'

interface SessionEvent {
  type: SessionEventType
  label: string
  timestamp: string
  value?: number
}

interface ShopperSession {
  product: ProductData
  /** Total visits to this product URL (including the current one) */
  returnVisitCount: number
  /** Highest dwell milestone reached (ms) */
  dwellMs: number
  /** Max scroll depth reached (%) */
  scrollDepthPct: number
  wishlistStatus: 'saved' | 'not_saved' | 'unknown'
  recentEvents: SessionEvent[]
  updatedAt: string
}

export type {
  ProductData,
  SessionEvent,
  SessionEventType,
  ShopperSession,
}
