import type { ProductData } from '../../../interface'
import { fohliooLog } from '../../debug'
import { sendSectionEngagement } from '../../capture/messenger'

const COS_DETAILS_BUTTON =
  '[data-testid="product-info-navigation-details-and-description-button"]'

const COS_DETAILS_HEADING = '[data-testid="details-and-description-heading"]'

const COS_MATERIALS_TAB_PATTERN = /materials?\s+and\s+suppliers?/i

import type { EngagementSection } from '../engagement-section'

export type CosEngagementSection = EngagementSection

function classifyCosClick (el: Element): CosEngagementSection | null {
  if (
    el.closest(COS_DETAILS_BUTTON) ||
    el.closest(COS_DETAILS_HEADING) ||
    (el.closest('button') &&
      /details?\s*&\s*description/i.test(el.closest('button')!.textContent ?? ''))
  ) {
    return 'details'
  }

  const tab = el.closest('button[role="tab"]')
  if (tab && COS_MATERIALS_TAB_PATTERN.test(tab.textContent ?? '')) {
    return 'materials'
  }

  const button = el.closest('button, a, [role="button"]')
  const label = button?.textContent ?? ''
  if (/reviews?/i.test(label)) return 'reviews'
  if (/size guide/i.test(label)) return 'size_guide'

  return null
}

const SECTION_LABELS: Record<CosEngagementSection, string> = {
  details: 'Opened details & description',
  materials: 'Viewed materials & suppliers',
  size_guide: 'Opened size guide',
  reviews: 'Viewed reviews',
}

/**
 * Observes intentional shopper clicks on PDP sections — read-only, for segmentation.
 * Never simulates or triggers UI actions.
 */
export function startCosEngagementTracking (product: ProductData): () => void {
  const fired = new Set<CosEngagementSection>()

  const onClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const section = classifyCosClick(target)
    if (!section || fired.has(section)) return

    fired.add(section)
    fohliooLog('capture', `COS shopper engagement: ${section}`, {
      product: product.name,
    })
    sendSectionEngagement(product, section, SECTION_LABELS[section])
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
