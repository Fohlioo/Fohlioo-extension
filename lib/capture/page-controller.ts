import type { ProductData } from '../../interface'
import { mergeStickyProductFields } from '../product-merge'
import {
  getLiveMetrics,
  resetLiveMetrics,
  startDwellTracking,
  startScrollTracking,
  startWishlistTracking,
} from '../events'
import {
  sendDwellMilestone,
  sendProductCaptured,
  sendScrollMilestone,
  sendWishlistAdd,
  sendWishlistRemove,
} from './messenger'
import { startProductHydrationWatch } from './hydration'
import { captureProduct } from './product-capture'
import { getSiteAdapter } from '../sites/adapters'

type Cleanup = () => void

/**
 * Orchestrates one product-page session: capture, hydration watches,
 * and behavioural trackers. Call `stop()` before starting a new page (SPA nav).
 */
export class ProductPageController {
  private cleanups: Cleanup[] = []
  private siteCleanups: Cleanup[] = []
  private lastPublished = { sizes: '', material: '' }
  private currentProduct: ProductData | null = null

  stop (): void {
    this.cleanups.forEach((c) => c())
    this.cleanups = []
    this.currentProduct = null
    resetLiveMetrics()
  }

  stopAll (): void {
    this.stop()
    this.siteCleanups.forEach((c) => c())
    this.siteCleanups = []
  }

  /** Site-wide listeners (cart, engagement) — survives product capture retries */
  attachSiteTrackers (): void {
    this.siteCleanups.forEach((c) => c())
    this.siteCleanups = []
    this.startEngagementTracking()
    this.startCartTracking()
  }

  start (): ProductData | null {
    this.stop()

    const product = captureProduct()
    if (!product) return null

    this.currentProduct = product
    this.publishProduct(product, { recordVisit: true })
    this.lastPublished = {
      sizes: product.sizes.join('|'),
      material: product.material ?? '',
    }

    this.startHydration(product)
    this.startBehaviourTrackers(product)

    return product
  }

  /** Minimal product when the page has not yet hydrated a full capture */
  private resolveProduct (): ProductData {
    if (this.currentProduct) return this.currentProduct

    const fresh = captureProduct()
    if (fresh) {
      this.currentProduct = fresh
      return fresh
    }

    return {
      name: document.title || null,
      brand: null,
      price: null,
      originalPrice: null,
      currency: null,
      category: null,
      colour: null,
      material: null,
      images: null,
      availability: 'unknown',
      sizes: [],
      extractionSource: 'dom',
      url: window.location.href,
      capturedAt: new Date().toISOString(),
    }
  }

  private publishProduct (
    product: ProductData,
    options: { recordVisit?: boolean } = {}
  ): void {
    sendProductCaptured(product, options)
  }

  private onProductUpdated (product: ProductData): void {
    const sizeKey = product.sizes.join('|')
    const materialKey = product.material ?? ''
    const sizesChanged =
      product.sizes.length > 0 && sizeKey !== this.lastPublished.sizes
    const materialChanged =
      materialKey.length > 0 && materialKey !== this.lastPublished.material

    if (!sizesChanged && !materialChanged) return

    if (sizesChanged) this.lastPublished.sizes = sizeKey
    if (materialChanged) this.lastPublished.material = materialKey

    this.currentProduct = product
    this.publishProduct(product)
  }

  private captureProductSticky (): ProductData | null {
    const fresh = captureProduct()
    if (!fresh) return null

    const latched = {
      ...fresh,
      material: this.lastPublished.material || fresh.material,
      sizes: this.lastPublished.sizes
        ? this.lastPublished.sizes.split('|').filter(Boolean)
        : fresh.sizes,
    }

    return mergeStickyProductFields(latched, fresh)
  }

  private startHydration (product: ProductData): void {
    const hostname = window.location.hostname

    this.cleanups.push(
      startProductHydrationWatch({
        hostname,
        needsSizes: product.sizes.length === 0,
        needsMaterial: !product.material,
        ctx: {
          captureProduct: () => this.captureProductSticky(),
          onProductUpdated: (p) => this.onProductUpdated(p),
          getLastMaterial: () => this.lastPublished.material,
          setLastMaterial: (m) => {
            this.lastPublished.material = m
          },
        },
      })
    )
  }

  private startBehaviourTrackers (product: ProductData): void {
    this.cleanups.push(
      startDwellTracking(product, (ms, p) => sendDwellMilestone(p, ms))
    )
    this.cleanups.push(
      startScrollTracking(product, (pct, p) => sendScrollMilestone(p, pct))
    )
    this.cleanups.push(
      startWishlistTracking(
        product,
        (p) => sendWishlistAdd(p),
        (p) => sendWishlistRemove(p)
      )
    )
  }

  private startEngagementTracking (): void {
    const adapter = getSiteAdapter(window.location.hostname)
    if (adapter?.startEngagementTracking) {
      this.siteCleanups.push(
        adapter.startEngagementTracking(() => this.resolveProduct())
      )
    }
  }

  private startCartTracking (): void {
    const adapter = getSiteAdapter(window.location.hostname)
    if (adapter?.startCartTracking) {
      this.siteCleanups.push(
        adapter.startCartTracking(() => this.resolveProduct())
      )
    }
  }

  /** For popup GET_SESSION — merge stored session with live in-page metrics */
  getLiveMetrics () {
    return getLiveMetrics()
  }
}
