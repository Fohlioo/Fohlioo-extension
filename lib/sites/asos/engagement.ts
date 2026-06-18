import type { ProductData } from '../../../interface'
import { fohliooLog } from '../../debug'
import { sendSectionEngagement } from '../../capture/messenger'
import type { EngagementSection } from '../engagement-section'

export const ASOS_PRODUCT_DESCRIPTION_ROOT =
  '#productDescription, [data-testid="product-description-section"]'

export const ASOS_SIZE_FIT_CONTROLS_ID = 'productDescriptionSizeAndFit'

export const ASOS_DETAILS_CONTROLS_ID = 'productDescriptionDetails'

const SIZE_FIT_LABEL = /size\s*&\s*fit/i
const DETAILS_LABEL = /product details/i
const SIZE_GUIDE_LINK = /sizing help|view size guide/i

const INTERACTIVE_CONTROL = 'button, [role="button"], a'

function isInProductDescription (el: Element): boolean {
  return Boolean(
    el.closest('#productDescription') ||
      el.closest('[data-testid="product-description-section"]')
  )
}

function readControlLabel (control: Element): string {
  return [
    control.getAttribute('aria-label') ?? '',
    control.textContent ?? '',
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAriaControls (
  el: Element,
  controlsId: string
): boolean {
  const control = el.closest(INTERACTIVE_CONTROL)
  return control?.getAttribute('aria-controls') === controlsId
}

function matchesPanel (el: Element, panelId: string): boolean {
  return Boolean(
    el.closest(`#${panelId}, [data-testid="${panelId}"]`)
  )
}

/**
 * Size & Fit — COS-style click capture.
 * aria-controls / panel IDs are unique on ASOS PDPs and matched globally
 * (accordion controls may not sit under #productDescription in the live DOM).
 */
export function isAsosSizeFitClick (el: Element): boolean {
  if (matchesAriaControls(el, ASOS_SIZE_FIT_CONTROLS_ID)) return true
  if (matchesPanel(el, ASOS_SIZE_FIT_CONTROLS_ID)) return true

  const link = el.closest('a')
  if (link && SIZE_GUIDE_LINK.test(readControlLabel(link))) return true

  if (!isInProductDescription(el)) return false

  const control = el.closest(INTERACTIVE_CONTROL)
  if (!control) return false

  if (SIZE_FIT_LABEL.test(control.getAttribute('aria-label') ?? '')) return true
  return SIZE_FIT_LABEL.test(control.textContent ?? '')
}

export function isAsosProductDetailsClick (el: Element): boolean {
  if (matchesAriaControls(el, ASOS_DETAILS_CONTROLS_ID)) return true
  if (matchesPanel(el, ASOS_DETAILS_CONTROLS_ID)) return true

  if (!isInProductDescription(el)) return false

  const control = el.closest(INTERACTIVE_CONTROL)
  if (!control) return false

  if (DETAILS_LABEL.test(control.getAttribute('aria-label') ?? '')) return true
  return DETAILS_LABEL.test(control.textContent ?? '')
}

export function classifyAsosEngagementClick (
  el: Element
): EngagementSection | null {
  if (isAsosSizeFitClick(el)) return 'size_guide'
  if (isAsosProductDetailsClick(el)) return 'details'
  return null
}

function clickPathElements (event: MouseEvent): Element[] {
  const path =
    typeof event.composedPath === 'function'
      ? event.composedPath()
      : [event.target]

  return path.filter((node): node is Element => node instanceof Element)
}

export function classifyAsosEngagementFromEvent (
  event: MouseEvent
): EngagementSection | null {
  for (const el of clickPathElements(event)) {
    const section = classifyAsosEngagementClick(el)
    if (section) return section
  }
  return null
}

const SECTION_LABELS: Record<'size_guide' | 'details', string> = {
  size_guide: 'Opened size & fit',
  details: 'Opened product details',
}

/**
 * Observes shopper clicks on ASOS PDP accordions — read-only, COS-style.
 * Attaches immediately; resolves the product lazily at click time because
 * ASOS hydrates the PDP after the content script runs. Never triggers UI.
 */
export function startAsosEngagementTracking (
  getProduct: () => ProductData
): () => void {
  const fired = new Set<EngagementSection>()

  const onClick = (event: MouseEvent) => {
    const section = classifyAsosEngagementFromEvent(event)
    if (!section || fired.has(section)) return

    fired.add(section)
    const product = getProduct()
    const pathControls = clickPathElements(event).find(
      (node) => node.getAttribute('aria-controls') != null
    )
    fohliooLog('capture', `ASOS shopper engagement: ${section}`, {
      product: product.name,
      ariaControls: pathControls?.getAttribute('aria-controls'),
    })
    sendSectionEngagement(product, section, SECTION_LABELS[section])
  }

  document.addEventListener('click', onClick, true)
  fohliooLog('capture', 'ASOS engagement tracking started', {
    hasProductDescription: Boolean(
      document.querySelector(ASOS_PRODUCT_DESCRIPTION_ROOT)
    ),
    hasSizeFitControl: Boolean(
      document.querySelector(`[aria-controls="${ASOS_SIZE_FIT_CONTROLS_ID}"]`)
    ),
  })

  return () => document.removeEventListener('click', onClick, true)
}
