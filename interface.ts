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
export type { ProductData }
