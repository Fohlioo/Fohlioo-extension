// lib/events.ts
// Dwell time, scroll depth, wishlist, cart detection
// These are the behavioural signals — not yet captured at all

import type { ProductData } from '../interface'
import { fohliooLog } from './debug'
import {
  findWishlistButton,
  inferAsosClickAction,
  inferWishlistAction,
  inferWishlistActionFromLabels,
  isAsosSite,
  isWishlistActive,
  queryWishlistButtons,
  waitForWishlistButton,
} from './wishlist'

// ── Dwell time ─────────────────────────────────────────────────────
// Uses Page Visibility API — accumulates across tab switches
const DWELL_MILESTONES_MS = [15_000, 30_000, 60_000, 90_000, 120_000, 180_000]

let liveDwellMs = 0
let liveScrollDepthPct = 0

export function getLiveMetrics (): {
  dwellMs: number
  scrollDepthPct: number
} {
  return {
    dwellMs: liveDwellMs,
    scrollDepthPct: liveScrollDepthPct,
  }
}

export function resetLiveMetrics (): void {
  liveDwellMs = 0
  liveScrollDepthPct = 0
}

export const startDwellTracking = (
  product: ProductData,
  onMilestone: (ms: number, product: ProductData) => void
) => {
  let accumulated = 0
  let visibleSince: number | null = document.hidden ? null : performance.now()
  let firedMilestones = new Set<number>()

  const tick = () => {
    const now = performance.now()
    if (visibleSince !== null) {
      accumulated += now - visibleSince
    }
    visibleSince = document.hidden ? null : now
    liveDwellMs = Math.round(accumulated)
    for (const milestone of DWELL_MILESTONES_MS) {
      if (!firedMilestones.has(milestone) && accumulated >= milestone) {
        firedMilestones.add(milestone)
        fohliooLog('dwell', `Milestone ${milestone / 1000}s`, {
          product: product.name,
          accumulatedMs: Math.round(accumulated),
        })
        onMilestone(milestone, product)
      }
    }
  }

  document.addEventListener('visibilitychange', tick)
  const interval = setInterval(tick, 5_000)

  fohliooLog('dwell', 'Tracking started', {
    product: product.name,
    milestonesSec: DWELL_MILESTONES_MS.map((ms) => ms / 1000),
  })

  return () => {
    document.removeEventListener('visibilitychange', tick)
    clearInterval(interval)
    tick()
    fohliooLog('dwell', 'Tracking stopped', { product: product.name })
  }
}

// ── Scroll depth ────────────────────────────────────────────────────
const SCROLL_MILESTONES_PCT = [25, 50, 75, 90]

export const startScrollTracking = (
  product: ProductData,
  onMilestone: (pct: number, product: ProductData) => void
) => {
  let maxDepth = 0
  let firedMilestones = new Set<number>()

  const onScroll = () => {
    const scrolled = window.scrollY + window.innerHeight
    const total = document.documentElement.scrollHeight
    if (total === 0) return
    const pct = Math.round((scrolled / total) * 100)

    if (pct > maxDepth) {
      maxDepth = pct
      liveScrollDepthPct = pct
      for (const milestone of SCROLL_MILESTONES_PCT) {
        if (!firedMilestones.has(milestone) && pct >= milestone) {
          firedMilestones.add(milestone)
          fohliooLog('scroll', `Milestone ${milestone}%`, {
            product: product.name,
            maxDepthPct: pct,
          })
          onMilestone(milestone, product)
        }
      }
    }
  }

  // Throttle to every 250ms
  let ticking = false
  const throttled = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll()
        ticking = false
      })
      ticking = true
    }
  }

  window.addEventListener('scroll', throttled, { passive: true })
  fohliooLog('scroll', 'Tracking started', {
    product: product.name,
    milestonesPct: SCROLL_MILESTONES_PCT,
  })
  return () => {
    window.removeEventListener('scroll', throttled)
    fohliooLog('scroll', 'Tracking stopped', { product: product.name })
  }
}

// ── Wishlist detection ──────────────────────────────────────────────
// Click-first + MutationObserver; ASOS uses click-intent (heart class, not aria-label)
const WISHLIST_STATE_POLL_MS = 150
const WISHLIST_ASOS_CONFIRM_MS = [150, 500, 1000]

export function startWishlistTracking (
  product: ProductData,
  onWishlistAdd: (product: ProductData) => void,
  onWishlistRemove: (product: ProductData) => void
) {
  const hostname = window.location.hostname
  const lastStates = new Map<Element, boolean>()
  let attached = false
  let cleanupReadyWait: (() => void) | null = null
  let clickCleanup: (() => void) | null = null
  let observer: MutationObserver | null = null

  const seedStates = () => {
    for (const btn of queryWishlistButtons(hostname)) {
      lastStates.set(btn, isWishlistActive(btn))
    }
  }

  const dispatchAction = (action: 'wishlist_add' | 'wishlist_remove') => {
    fohliooLog('wishlist', action, {
      product: product.name,
      brand: product.brand,
    })
    if (action === 'wishlist_add') onWishlistAdd(product)
    else onWishlistRemove(product)
  }

  const confirmAsosToggle = (btn: Element) => {
    for (const delay of WISHLIST_ASOS_CONFIRM_MS) {
      window.setTimeout(() => {
        lastStates.set(btn, isWishlistActive(btn))
      }, delay)
    }
  }

  const attachListeners = () => {
    if (attached) return
    attached = true
    cleanupReadyWait?.()
    cleanupReadyWait = null

    const clickCooldown = new WeakMap<Element, number>()
    seedStates()

    const onClick = (event: MouseEvent) => {
      const btn = findWishlistButton(event.target, hostname)
      if (!btn) return

      const wasActive = lastStates.get(btn) ?? isWishlistActive(btn)
      fohliooLog('wishlist', 'Button clicked', {
        testId: btn.getAttribute('data-testid'),
        wasActive,
      })

      if (isAsosSite(hostname)) {
        const action = inferAsosClickAction(wasActive)
        clickCooldown.set(btn, Date.now())
        dispatchAction(action)
        lastStates.set(btn, action === 'wishlist_add')
        confirmAsosToggle(btn)
        return
      }

      const labelBefore = btn.getAttribute('aria-label') ?? ''
      window.setTimeout(() => {
        const action =
          inferWishlistAction(wasActive, isWishlistActive(btn)) ??
          inferWishlistActionFromLabels(
            labelBefore,
            btn.getAttribute('aria-label') ?? ''
          )

        if (action) {
          dispatchAction(action)
          lastStates.set(btn, isWishlistActive(btn))
        }
      }, WISHLIST_STATE_POLL_MS)
    }

    observer = new MutationObserver(() => {
      seedStates()
      for (const btn of queryWishlistButtons(hostname)) {
        const isActive = isWishlistActive(btn)
        const wasActive = lastStates.get(btn)
        if (wasActive === undefined) {
          lastStates.set(btn, isActive)
          continue
        }

        const cooledDown =
          Date.now() - (clickCooldown.get(btn) ?? 0) > 1200
        if (!cooledDown) {
          lastStates.set(btn, isActive)
          continue
        }

        if (isActive !== wasActive) {
          const action = inferWishlistAction(wasActive, isActive)
          if (action) dispatchAction(action)
          lastStates.set(btn, isActive)
        }
      }
    })

    document.addEventListener('click', onClick, true)
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-pressed', 'aria-checked', 'class', 'data-auto-id'],
      childList: true,
    })

    clickCleanup = () => {
      document.removeEventListener('click', onClick, true)
      observer?.disconnect()
    }

    fohliooLog('wishlist', 'Tracking started', {
      product: product.name,
      buttonsFound: queryWishlistButtons(hostname).length,
    })
  }

  if (queryWishlistButtons(hostname).length > 0) {
    attachListeners()
  } else {
    fohliooLog('wishlist', 'Waiting for wishlist button to hydrate')
    cleanupReadyWait = waitForWishlistButton(hostname, () => attachListeners())
    window.setTimeout(() => {
      if (!attached) attachListeners()
    }, 3_000)
  }

  return () => {
    cleanupReadyWait?.()
    clickCleanup?.()
  }
}
