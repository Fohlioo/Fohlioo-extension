import { fohliooLog } from '../../debug'

const COS_COMPOSITION_ROW =
  '[data-testid="product-details-drawer-sustainability-materials"]'

const CAPTURE_RETRY_DELAYS_MS = [400, 900, 1500, 2500]

function textContent (el: Element | null): string | null {
  const text = el?.textContent?.trim()
  return text && text.length > 0 ? text : null
}

function isVisibleInDom (el: Element): boolean {
  if (!el.isConnected) return false

  let current: Element | null = el
  while (current && current !== document.body) {
    if (current instanceof HTMLElement) {
      if (current.hidden) return false
      if (current.getAttribute('aria-hidden') === 'true') return false

      const style = window.getComputedStyle(current)
      if (style.display === 'none' || style.visibility === 'hidden') return false
    }
    if (current.classList.contains('hidden')) return false
    current = current.parentElement
  }

  const panel = el.closest('[role="tabpanel"]')
  if (panel) {
    if (panel.hasAttribute('hidden')) return false
    if (panel.getAttribute('aria-hidden') === 'true') return false
    if (panel.classList.contains('hidden')) return false
  }

  return true
}

function parseCompositionFromRow (row: Element): string | null {
  const valueEl =
    row.querySelector('.flex-1 span') ??
    row.querySelector('span.body2_regular') ??
    row.querySelector('span:last-of-type')

  const value = textContent(valueEl)
  if (value && !/^composition$/i.test(value)) return value

  const full = row.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const stripped = full.replace(/^composition\s*/i, '').trim()
  return stripped.length > 0 ? stripped : null
}

/** Read composition when the shopper has opened the materials drawer themselves */
export function extractCosComposition (): string | null {
  for (const row of document.querySelectorAll(COS_COMPOSITION_ROW)) {
    if (!isVisibleInDom(row)) continue
    const value = parseCompositionFromRow(row)
    if (value) return value
  }
  return null
}

/**
 * Passively watches the DOM for composition to become visible.
 * Never clicks or opens UI — only reads after the shopper reveals it.
 */
export function startCosMaterialPassiveWatch (
  onCompositionCaptured: () => void
): () => void {
  let lastMaterial: string | null = null
  let cancelled = false
  const timeouts: number[] = []

  const tryPublish = (): boolean => {
    if (cancelled) return false

    const material = extractCosComposition()
    if (!material || material === lastMaterial) return false

    lastMaterial = material
    fohliooLog('sizes', 'COS composition captured (shopper revealed)', {
      material,
    })
    onCompositionCaptured()
    return true
  }

  const scheduleRetries = () => {
    for (const delay of CAPTURE_RETRY_DELAYS_MS) {
      const id = window.setTimeout(() => {
        if (!cancelled) tryPublish()
      }, delay)
      timeouts.push(id)
    }
  }

  const observer = new MutationObserver(() => {
    if (tryPublish()) return
    scheduleRetries()
  })

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'data-state', 'hidden', 'class', 'style'],
  })

  fohliooLog('sizes', 'COS material passive watch started (read-only)')

  return () => {
    cancelled = true
    observer.disconnect()
    timeouts.forEach((id) => window.clearTimeout(id))
  }
}
