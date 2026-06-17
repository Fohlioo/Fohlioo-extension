/**
 * Event taxonomy — aligned with backend `events` table and
 * Extension Data Capture / Segmentation Engine (Notion spec).
 *
 * Phase 1 (live): product + dwell / scroll / wishlist
 * Phase 2 (next): engagement sections, cart, purchase
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

/** Popup session feed — mirrors shopper-facing labels */
export type SessionFeedEventType =
  | 'page_view'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'dwell_milestone'
  | 'scroll_milestone'
  | 'review_section_view'
  | 'size_guide_view'
  | 'material_section_view'
