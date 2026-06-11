import type { ProductData } from '../interface'

export function getPrimaryImage (
  images: ProductData['images']
): string | null {
  if (!images) return null
  return Array.isArray(images) ? images[0] ?? null : images
}

export function getImageList (images: ProductData['images']): string[] {
  if (!images) return []
  return Array.isArray(images) ? images : [images]
}

export function formatPrice (
  price: number | null,
  currency: string | null
): string | null {
  if (price == null) return null
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency ?? 'GBP',
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price)
  } catch {
    return `${currency ?? '£'}${price}`
  }
}

export function formatAvailability (
  availability: ProductData['availability']
): { label: string; tone: 'success' | 'danger' | 'muted' } {
  switch (availability) {
    case 'in_stock':
      return { label: 'In stock', tone: 'success' }
    case 'out_of_stock':
      return { label: 'Out of stock', tone: 'danger' }
    default:
      return { label: 'Availability unknown', tone: 'muted' }
  }
}

export function formatExtractionSource (
  source: ProductData['extractionSource']
): string {
  switch (source) {
    case 'json_ld':
      return 'JSON-LD'
    case 'open_graph':
      return 'Open Graph'
    default:
      return 'DOM'
  }
}
