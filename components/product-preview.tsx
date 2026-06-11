import React from 'react'

import type { ProductData } from '../interface'
import {
  formatAvailability,
  formatExtractionSource,
  formatPrice,
  getImageList,
  getPrimaryImage,
} from '../lib/format'

type ProductPreviewProps = {
  product: ProductData
}

export function ProductPreview ({ product }: ProductPreviewProps) {
  const images = getImageList(product.images)
  const primaryImage = getPrimaryImage(product.images)
  const price = formatPrice(product.price, product.currency)
  const originalPrice =
    product.originalPrice != null &&
    product.price != null &&
    product.originalPrice > product.price
      ? formatPrice(product.originalPrice, product.currency)
      : null
  const availability = formatAvailability(product.availability)
  const onSale = originalPrice != null

  return (
    <article className="product">
      <header className="product__header">
        <div className="product__brand-row">
          <span className="product__brand">{product.brand ?? 'Unknown brand'}</span>
          <span className={`product__badge product__badge--${availability.tone}`}>
            {availability.label}
          </span>
        </div>
        <h1 className="product__name">{product.name}</h1>
      </header>

      <div className="product__media">
        {primaryImage ? (
          <>
            <img
              className="product__image"
              src={primaryImage}
              alt={product.name ?? 'Product image'}
            />
            {images.length > 1 && (
              <div className="product__image-count" aria-hidden>
                {images.length} images
              </div>
            )}
          </>
        ) : (
          <div className="product__image-placeholder">
            <span>No image</span>
          </div>
        )}
      </div>

      <div className="product__price-row">
        {price ? (
          <>
            <span className={`product__price${onSale ? ' product__price--sale' : ''}`}>
              {price}
            </span>
            {originalPrice && (
              <span className="product__price-original">{originalPrice}</span>
            )}
          </>
        ) : (
          <span className="product__price product__price--muted">Price unavailable</span>
        )}
      </div>

      {(product.colour || product.material) && (
        <dl className="product__meta">
          {product.colour && (
            <div className="product__meta-item">
              <dt>Colour</dt>
              <dd>{product.colour}</dd>
            </div>
          )}
          {product.material && (
            <div className="product__meta-item">
              <dt>Material</dt>
              <dd>{product.material}</dd>
            </div>
          )}
        </dl>
      )}

      {product.sizes.length > 0 && (
        <section className="product__sizes">
          <p className="product__section-label">Sizes</p>
          <div className="product__size-list">
            {product.sizes.map((size) => (
              <span key={size} className="product__size-chip">
                {size}
              </span>
            ))}
          </div>
        </section>
      )}

      <footer className="product__footer">
        <span className="product__source">
          via {formatExtractionSource(product.extractionSource)}
        </span>
        <a
          className="product__link"
          href={product.url}
          target="_blank"
          rel="noreferrer">
          View product
        </a>
      </footer>
    </article>
  )
}
