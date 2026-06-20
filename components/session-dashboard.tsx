import React from 'react'

import type { ShopperSession } from '../interface'
import {
  formatAvailability,
  formatExtractionSource,
  formatPrice,
  getImageList,
  getPrimaryImage,
} from '../lib/format'
import {
  dwellProgress,
  formatDwell,
  formatRelativeTime,
  scrollProgress,
} from '../lib/session-format'

type SessionDashboardProps = {
  session: ShopperSession
}

function MetricRing ({
  label,
  value,
  progress,
  accent,
}: {
  label: string
  value: string
  progress: number
  accent: string
}) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="metric">
      <div className="metric__ring-wrap">
        <svg className="metric__ring" viewBox="0 0 64 64" aria-hidden>
          <circle className="metric__ring-bg" cx="32" cy="32" r={radius} />
          <circle
            className="metric__ring-fill"
            cx="32"
            cy="32"
            r={radius}
            stroke={accent}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="metric__value">{value}</span>
      </div>
      <span className="metric__label">{label}</span>
    </div>
  )
}

function WishlistStatus ({ status }: { status: ShopperSession['wishlistStatus'] }) {
  const map = {
    saved: { label: 'Saved', tone: 'saved' as const },
    not_saved: { label: 'Not saved', tone: 'neutral' as const },
    unknown: { label: 'Not yet saved', tone: 'neutral' as const },
  }
  const { label, tone } = map[status]
  return (
    <div className={`wishlist-pill wishlist-pill--${tone}`}>
      <span className="wishlist-pill__icon" aria-hidden>
        {status === 'saved' ? '♥' : '♡'}
      </span>
      {label}
    </div>
  )
}

export function SessionDashboard ({ session }: SessionDashboardProps) {
  const { product } = session
  const primaryImage = getPrimaryImage(product.images)
  const imageCount = getImageList(product.images).length
  const price = formatPrice(product.price, product.currency)
  const availability = formatAvailability(product.availability)

  return (
    <div className="dashboard">
      <section className="hero-card">
        <div className="hero-card__thumb">
          {primaryImage ? (
            <img src={primaryImage} alt={product.name ?? 'Product'} />
          ) : (
            <div className="hero-card__thumb-placeholder">No image</div>
          )}
        </div>
        <div className="hero-card__body">
          <div className="hero-card__top">
            <span className="hero-card__brand">{product.brand ?? 'Brand'}</span>
            <span className={`status-dot status-dot--${availability.tone}`} />
          </div>
          <h1 className="hero-card__name">{product.name}</h1>
          <p className="hero-card__price">{price ?? '—'}</p>
          {imageCount > 1 && (
            <span className="hero-card__meta">{imageCount} images captured</span>
          )}
        </div>
      </section>

      <section className="insight-bar">
        <span className="insight-bar__dot insight-bar__dot--live" />
        <span className="insight-bar__text">
          Live session on this product
        </span>
        <span className="insight-bar__source">
          {formatExtractionSource(product.extractionSource)}
        </span>
      </section>

      <section className="metrics-row">
        <MetricRing
          label="Dwell time"
          value={formatDwell(session.dwellMs)}
          progress={dwellProgress(session.dwellMs)}
          accent="#6366f1"
        />
        <MetricRing
          label="Scroll depth"
          value={`${session.scrollDepthPct}%`}
          progress={scrollProgress(session.scrollDepthPct)}
          accent="#0891b2"
        />
      </section>

      <section className="panel">
        <div className="panel__header">
          <h2 className="panel__title">Engagement</h2>
          <WishlistStatus status={session.wishlistStatus} />
        </div>

        <dl className="detail-grid">
          {product.colour && (
            <div className="detail-grid__item">
              <dt>Colour</dt>
              <dd>{product.colour}</dd>
            </div>
          )}
          {product.material && (
            <div className="detail-grid__item">
              <dt>Material</dt>
              <dd>{product.material}</dd>
            </div>
          )}
          {product.category && (
            <div className="detail-grid__item">
              <dt>Category</dt>
              <dd>{product.category}</dd>
            </div>
          )}
          <div className="detail-grid__item">
            <dt>Visit count</dt>
            <dd>
              {session.returnVisitCount === 1
                ? 'First visit'
                : `${session.returnVisitCount} visits`}
            </dd>
          </div>
          <div className="detail-grid__item">
            <dt>Availability</dt>
            <dd>{availability.label}</dd>
          </div>
        </dl>
      </section>

      {product.sizes.length > 0 && (
        <section className="panel">
          <h2 className="panel__title">Sizes available</h2>
          <div className="chip-row">
            {product.sizes.map((size) => (
              <span key={size} className="chip">
                {size}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="panel panel--activity">
        <h2 className="panel__title">Activity</h2>
        <ul className="activity-list">
          {[...session.recentEvents].reverse().map((event, i) => (
            <li key={`${event.timestamp}-${i}`} className="activity-list__item">
              <span className={`activity-list__dot activity-list__dot--${event.type}`} />
              <div className="activity-list__content">
                <span className="activity-list__label">{event.label}</span>
                <span className="activity-list__time">
                  {formatRelativeTime(event.timestamp)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="dashboard__footer">
        <a className="dashboard__link" href={product.url} target="_blank" rel="noreferrer">
          View on site →
        </a>
      </footer>
    </div>
  )
}
