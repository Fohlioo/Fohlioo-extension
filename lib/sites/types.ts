import type { ProductData } from '../../interface'

/** Context passed to site-specific lazy-field watchers (sizes, material, etc.) */
export type HydrationContext = {
  captureProduct: () => ProductData | null
  onProductUpdated: (product: ProductData) => void
  getLastMaterial: () => string
  setLastMaterial: (material: string) => void
}

/**
 * Per-retailer hooks — add a new file under `lib/sites/<retailer>/` and
 * register in `lib/sites/adapters/index.ts`.
 */
export type SiteAdapter = {
  /** Registry key, e.g. `cos.com` */
  key: string
  matches: (hostname: string) => boolean
  /** Override DOM material extraction when generic scan is insufficient */
  extractMaterial?: () => string | null
  /** Passive DOM watch when material is hidden until shopper opens a section */
  watchMaterialReveal?: (onCaptured: () => void) => () => void
  /**
   * Track intentional shopper clicks on PDP sections — segmentation only.
   * Receives a getter so the listener attaches immediately and resolves the
   * freshest product at click time (PDPs hydrate after the script runs).
   */
  startEngagementTracking?: (getProduct: () => ProductData) => () => void
  /** Track shopper add-to-cart / add-to-bag clicks — site-specific selectors */
  startCartTracking?: (getProduct: () => ProductData) => () => void
}
