import type { ProductData } from '../../interface'
import { fohliooLog } from '../debug'
import { getSiteAdapter } from '../sites/adapters'
import type { HydrationContext } from '../sites/types'

type HydrationOptions = {
  hostname: string
  needsSizes: boolean
  needsMaterial: boolean
  ctx: HydrationContext
}

function watchForDomSizes (ctx: HydrationContext): () => void {
  const root = document.body
  if (!root) return () => {}

  let lastSizes = ''

  const observer = new MutationObserver(() => {
    const product = ctx.captureProduct()
    if (!product || product.sizes.length === 0) return

    const sizeKey = product.sizes.join('|')
    if (sizeKey === lastSizes) return

    lastSizes = sizeKey
    fohliooLog('sizes', 'Sizes hydrated from DOM', { sizes: product.sizes })
    ctx.onProductUpdated(product)
    observer.disconnect()
  })

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
  })

  const timeout = window.setTimeout(() => observer.disconnect(), 10_000)
  return () => {
    observer.disconnect()
    window.clearTimeout(timeout)
  }
}

function watchForDomMaterial (ctx: HydrationContext): () => void {
  const root = document.body
  if (!root) return () => {}

  const observer = new MutationObserver(() => {
    const product = ctx.captureProduct()
    if (!product?.material || product.material === ctx.getLastMaterial()) {
      return
    }

    ctx.setLastMaterial(product.material)
    fohliooLog('sizes', 'Material hydrated from DOM', {
      material: product.material,
    })
    ctx.onProductUpdated(product)
    observer.disconnect()
  })

  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
  })

  const timeout = window.setTimeout(() => observer.disconnect(), 60_000)
  return () => {
    observer.disconnect()
    window.clearTimeout(timeout)
  }
}

/**
 * Watches for product fields that hydrate after React render or user interaction.
 * Site-specific flows (e.g. COS material drawer) delegate to `SiteAdapter`.
 */
export function startProductHydrationWatch (
  options: HydrationOptions
): () => void {
  const cleanups: Array<() => void> = []
  const { hostname, needsSizes, needsMaterial, ctx } = options
  const adapter = getSiteAdapter(hostname)

  if (needsSizes) {
    cleanups.push(watchForDomSizes(ctx))
  }

  if (needsMaterial) {
    if (adapter?.watchMaterialReveal) {
      cleanups.push(
        adapter.watchMaterialReveal(() => {
          const updated = ctx.captureProduct()
          if (!updated?.material || updated.material === ctx.getLastMaterial()) {
            return
          }
          ctx.setLastMaterial(updated.material)
          fohliooLog('sizes', 'Material captured after shopper revealed section', {
            site: adapter.key,
            material: updated.material,
          })
          ctx.onProductUpdated(updated)
        })
      )
    } else {
      cleanups.push(watchForDomMaterial(ctx))
    }
  }

  return () => cleanups.forEach((c) => c())
}
