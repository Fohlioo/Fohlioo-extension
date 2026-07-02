/**
 * Event taxonomy — aligned with backend `events` table and
 * Extension Data Capture / Segmentation Engine (Notion spec).
 *
 * Phase 1 (live in extension): product, dwell, scroll, wishlist, section engagement, COS + NAP + Zara + ASOS cart add
 * Phase 1 (not yet): API sync, size/colour selection, tab/return counts, cart on other retailers
 * Phase 2: cart on all retailers, purchase, cart abandon, return initiated
 */

/** Stored in Supabase `events.event_type` — extend as features ship */
export type BackendEventType =
  | 'page_view'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'dwell_milestone'
  | 'scroll_milestone'
  | 'size_selected'
  | 'colour_selected'
  | 'review_section_view'
  | 'size_guide_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_abandon'
  | 'purchase_confirmed'
  | 'return_initiated'

/** Messages content script → background (subset of backend types today) */
export type BehaviourMessageType =
  | 'PRODUCT_CAPTURED'
  | 'WISHLIST_ADD'
  | 'WISHLIST_REMOVE'
  | 'DWELL_MILESTONE'
  | 'SCROLL_MILESTONE'
  | 'SECTION_ENGAGEMENT'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'

/** Popup session feed — mirrors shopper-facing labels */
export type SessionFeedEventType =
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
