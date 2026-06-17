import type { ProductData } from '../../interface'
import type { EngagementSection } from '../sites/engagement-section'
import { fohliooLog } from '../debug'

/** All extension → background payloads go through here */
export function sendProductCaptured (product: ProductData): void {
  chrome.runtime
    .sendMessage({ type: 'PRODUCT_CAPTURED', data: product })
    .catch(() => {
      // Background unavailable during extension reload
    })
}

export function sendWishlistAdd (product: ProductData): void {
  fohliooLog('message', 'WISHLIST_ADD → background', { name: product.name })
  chrome.runtime.sendMessage({ type: 'WISHLIST_ADD', data: product }).catch(() => {})
}

export function sendWishlistRemove (product: ProductData): void {
  fohliooLog('message', 'WISHLIST_REMOVE → background', { name: product.name })
  chrome.runtime.sendMessage({ type: 'WISHLIST_REMOVE', data: product }).catch(() => {})
}

export function sendDwellMilestone (
  product: ProductData,
  milestoneMs: number
): void {
  chrome.runtime
    .sendMessage({ type: 'DWELL_MILESTONE', data: product, milestoneMs })
    .catch(() => {})
}

export function sendScrollMilestone (
  product: ProductData,
  milestonePct: number
): void {
  chrome.runtime
    .sendMessage({ type: 'SCROLL_MILESTONE', data: product, milestonePct })
    .catch(() => {})
}

export function sendSectionEngagement (
  product: ProductData,
  section: EngagementSection,
  label: string
): void {
  fohliooLog('message', 'SECTION_ENGAGEMENT → background', { section, label })
  chrome.runtime
    .sendMessage({ type: 'SECTION_ENGAGEMENT', data: product, section, label })
    .catch(() => {})
}
