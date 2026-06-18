import type { ProductData } from '../../../interface'
import { fohliooLog } from '../../debug'
import { sendSectionEngagement } from '../../capture/messenger'
import type { EngagementSection } from '../engagement-section'

/** Zara PDP action list — below add-to-bag on product detail pages */
export const ZARA_PRODUCT_ACTIONS_ROOT = '.product-detail-actions'

export const ZARA_ACTION_BUTTON =
  '.product-detail-actions__action-button, [data-qa-action]'

/** Stable Zara QA hooks — survive CSS module hash changes */
export const ZARA_QA_ACTIONS = {
  compositionCare: 'show-extra-detail',
  storeAvailability: 'store-stock',
  shippingReturns: 'show-return-conditions',
} as const

export type ZaraEngagementAction = keyof typeof ZARA_QA_ACTIONS

type ZaraEngagementMatch = {
  action: ZaraEngagementAction
  section: EngagementSection
  label: string
}

const ZARA_ACTION_CONFIG: Record<ZaraEngagementAction, ZaraEngagementMatch> = {
  compositionCare: {
    action: 'compositionCare',
    section: 'materials',
    label: 'Viewed composition, care & origin',
  },
  storeAvailability: {
    action: 'storeAvailability',
    section: 'details',
    label: 'Checked in-store availability',
  },
  shippingReturns: {
    action: 'shippingReturns',
    section: 'details',
    label: 'Viewed shipping & returns',
  },
}

const COMPOSITION_CARE_LABEL =
  /composition,?\s*care\s*(?:and|&)\s*origin/i
const STORE_AVAILABILITY_LABEL = /check in-?store availability/i
const SHIPPING_RETURNS_LABEL =
  /shipping,?\s*exchanges?\s*and\s*returns?/i

const INTERACTIVE_CONTROL = 'button, [role="button"], a'

function isInProductActions (el: Element): boolean {
  return Boolean(el.closest(ZARA_PRODUCT_ACTIONS_ROOT))
}

function readQaAction (control: Element): string | null {
  return control.getAttribute('data-qa-action')
}

function readControlText (control: Element): string {
  return (control.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function matchActionFromControl (control: Element): ZaraEngagementAction | null {
  const qaAction = readQaAction(control)
  if (qaAction === ZARA_QA_ACTIONS.compositionCare) return 'compositionCare'
  if (qaAction === ZARA_QA_ACTIONS.storeAvailability) return 'storeAvailability'
  if (qaAction === ZARA_QA_ACTIONS.shippingReturns) return 'shippingReturns'

  const text = readControlText(control)
  if (COMPOSITION_CARE_LABEL.test(text)) return 'compositionCare'
  if (STORE_AVAILABILITY_LABEL.test(text)) return 'storeAvailability'
  if (SHIPPING_RETURNS_LABEL.test(text)) return 'shippingReturns'

  return null
}

/** Classify a shopper click on Zara PDP action buttons */
export function classifyZaraEngagementClick (
  el: Element
): ZaraEngagementMatch | null {
  const control = el.closest(INTERACTIVE_CONTROL)
  if (!control || !isInProductActions(control)) return null

  const action = matchActionFromControl(control)
  return action ? ZARA_ACTION_CONFIG[action] : null
}

function clickPathElements (event: MouseEvent): Element[] {
  const path =
    typeof event.composedPath === 'function'
      ? event.composedPath()
      : [event.target]

  return path.filter((node): node is Element => node instanceof Element)
}

export function classifyZaraEngagementFromEvent (
  event: MouseEvent
): ZaraEngagementMatch | null {
  for (const el of clickPathElements(event)) {
    const match = classifyZaraEngagementClick(el)
    if (match) return match
  }
  return null
}

/**
 * Observes shopper clicks on Zara PDP action buttons — read-only.
 * Uses data-qa-action as primary selector; dedupes per action (not section)
 * because multiple actions map to `details`.
 */
export function startZaraEngagementTracking (
  getProduct: () => ProductData
): () => void {
  const fired = new Set<ZaraEngagementAction>()

  const onClick = (event: MouseEvent) => {
    const match = classifyZaraEngagementFromEvent(event)
    if (!match || fired.has(match.action)) return

    fired.add(match.action)
    const product = getProduct()
    fohliooLog('capture', `Zara shopper engagement: ${match.action}`, {
      product: product.name,
      section: match.section,
      qaAction: ZARA_QA_ACTIONS[match.action],
    })
    sendSectionEngagement(product, match.section, match.label)
  }

  document.addEventListener('click', onClick, true)
  fohliooLog('capture', 'Zara engagement tracking started', {
    hasActionsRoot: Boolean(document.querySelector(ZARA_PRODUCT_ACTIONS_ROOT)),
    hasCompositionCare: Boolean(
      document.querySelector(
        `[data-qa-action="${ZARA_QA_ACTIONS.compositionCare}"]`
      )
    ),
    hasStoreAvailability: Boolean(
      document.querySelector(
        `[data-qa-action="${ZARA_QA_ACTIONS.storeAvailability}"]`
      )
    ),
    hasShippingReturns: Boolean(
      document.querySelector(
        `[data-qa-action="${ZARA_QA_ACTIONS.shippingReturns}"]`
      )
    ),
  })

  return () => document.removeEventListener('click', onClick, true)
}
