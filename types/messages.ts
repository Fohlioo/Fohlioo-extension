import type { ProductData } from '../interface'

export type ProductCapturedMessage = {
  type: 'PRODUCT_CAPTURED'
  data: ProductData
}

export type GetProductMessage = {
  type: 'GET_PRODUCT'
}

export type ExtensionMessage = ProductCapturedMessage | GetProductMessage

export type GetProductResponse = {
  success: boolean
  data: ProductData | null
}
