import type { ProductData } from '../../../interface'
import { fohliooLog } from '../../debug'
import { sendSectionEngagement } from '../../capture/messenger'
import type { EngagementSection } from '../engagement-section'

/** Toteme PDP tab row — below price on product detail pages */
export const TOTEME_TABS_ROOT =
  'product-tabs[data-product-content-el="tabs"], .prd-Detail_Tabs'

export const TOTEME_TAB_TRIGGER =
  'button.prd-Detail_Tab[data-product-tabs-el="trigger"]'

export const TOTEME_DRAWERS = {
  sizeGuide: 'drawer-size-guide',
  productDetails: 'drawer-product-details',
} as const

export type TotemeEngagementAction =
  | 'details'
  | 'sizeGuide'
  | 'certificates'
  | 'returns'

type TotemeEngagementMatch = {
  action: TotemeEngagementAction
  section: EngagementSection
  label: string
}

const TOTEME_ACTION_CONFIG: Record<
  TotemeEngagementAction,
  TotemeEngagementMatch
> = {
  details: {
    action: 'details',
    section: 'details',
    label: 'Opened product details',
  },
  sizeGuide: {
    action: 'sizeGuide',
    section: 'size_guide',
    label: 'Opened size & fit',
  },
  certificates: {
    action: 'certificates',
    section: 'materials',
    label: 'Viewed certificates & traceability',
  },
  returns: {
    action: 'returns',
    section: 'details',
    label: 'Viewed returns & exchanges',
  },
}

const DETAILS_LABEL = /^details$/i
const SIZE_FIT_LABEL = /size\s*&\s*fit/i
const CERTIFICATES_LABEL = /certificates?\s*&\s*traceability/i
const RETURNS_LABEL = /returns?\s*&\s*exchanges?/i

function readTabLabel (tab: Element): string {
  return [
    tab.getAttribute('data-value') ?? '',
    tab.textContent ?? '',
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isInTotemeTabs (el: Element): boolean {
  return Boolean(el.closest(TOTEME_TABS_ROOT))
}

function isInTotemeDrawer (el: Element, drawerId: string): boolean {
  return Boolean(
    el.closest(`#${drawerId}`) ||
      el.closest(`[data-drawers-panel="${drawerId}"]`) ||
      el.closest(`[data-drawer-id="${drawerId}"]`)
  )
}

function matchActionFromTab (tab: Element): TotemeEngagementAction | null {
  const drawer = tab.getAttribute('data-drawers-trigger') ?? ''
  if (drawer === TOTEME_DRAWERS.sizeGuide) return 'sizeGuide'

  if (drawer === TOTEME_DRAWERS.productDetails) {
    const label = readTabLabel(tab)
    if (CERTIFICATES_LABEL.test(label)) return 'certificates'
    if (RETURNS_LABEL.test(label)) return 'returns'
    if (DETAILS_LABEL.test(label)) return 'details'
    return 'details'
  }

  const label = readTabLabel(tab)
  if (SIZE_FIT_LABEL.test(label)) return 'sizeGuide'
  if (CERTIFICATES_LABEL.test(label)) return 'certificates'
  if (RETURNS_LABEL.test(label)) return 'returns'
  if (DETAILS_LABEL.test(label)) return 'details'

  return null
}

/** Classify a shopper click on Toteme PDP detail tabs or open drawers */
export function classifyTotemeEngagementClick (
  el: Element
): TotemeEngagementMatch | null {
  const tab = el.closest(TOTEME_TAB_TRIGGER)
  if (tab && isInTotemeTabs(tab)) {
    const action = matchActionFromTab(tab)
    return action ? TOTEME_ACTION_CONFIG[action] : null
  }

  if (isInTotemeDrawer(el, TOTEME_DRAWERS.sizeGuide)) {
    return TOTEME_ACTION_CONFIG.sizeGuide
  }

  if (isInTotemeDrawer(el, TOTEME_DRAWERS.productDetails)) {
    return TOTEME_ACTION_CONFIG.details
  }

  return null
}

function clickPathElements (event: MouseEvent): Element[] {
  const path =
    typeof event.composedPath === 'function'
      ? event.composedPath()
      : [event.target]

  return path.filter((node): node is Element => node instanceof Element)
}

export function classifyTotemeEngagementFromEvent (
  event: MouseEvent
): TotemeEngagementMatch | null {
  for (const el of clickPathElements(event)) {
    const match = classifyTotemeEngagementClick(el)
    if (match) return match
  }
  return null
}

/**
 * Observes shopper clicks on Toteme PDP tabs and drawers — read-only.
 * Uses data-drawers-trigger / data-value on tab buttons; dedupes per action
 * because multiple tabs map to `details`.
 */
export function startTotemeEngagementTracking (
  getProduct: () => ProductData
): () => void {
  const fired = new Set<TotemeEngagementAction>()

  const onClick = (event: MouseEvent) => {
    const match = classifyTotemeEngagementFromEvent(event)
    if (!match || fired.has(match.action)) return

    fired.add(match.action)
    const product = getProduct()
    fohliooLog('capture', `Toteme shopper engagement: ${match.action}`, {
      product: product.name,
      section: match.section,
    })
    sendSectionEngagement(product, match.section, match.label)
  }

  document.addEventListener('click', onClick, true)
  fohliooLog('capture', 'Toteme engagement tracking started', {
    hasTabsRoot: Boolean(document.querySelector(TOTEME_TABS_ROOT)),
    hasSizeGuideTab: Boolean(
      document.querySelector(
        `[data-drawers-trigger="${TOTEME_DRAWERS.sizeGuide}"]`
      )
    ),
    hasDetailsTab: Boolean(
      document.querySelector(
        `[data-drawers-trigger="${TOTEME_DRAWERS.productDetails}"]`
      )
    ),
  })

  return () => document.removeEventListener('click', onClick, true)
}
