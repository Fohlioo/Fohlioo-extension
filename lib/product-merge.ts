import type { ProductData } from '../interface'

export function isSameProduct (
  a: ProductData,
  b: ProductData
): boolean {
  return a.url === b.url && a.name === b.name
}

/**
 * Lazy DOM fields (material, sizes) may disappear when the shopper closes a drawer.
 * Once captured for this product, never regress to empty on a later live scrape.
 */
export function mergeStickyProductFields (
  previous: ProductData | null | undefined,
  incoming: ProductData
): ProductData {
  if (!previous || !isSameProduct(previous, incoming)) {
    return incoming
  }

  return {
    ...incoming,
    material: incoming.material ?? previous.material,
    sizes: incoming.sizes.length > 0 ? incoming.sizes : previous.sizes,
  }
}
