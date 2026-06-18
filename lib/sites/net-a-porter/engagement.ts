import type { ProductData } from '../../../interface'
import { fohliooLog } from '../../debug'
import { sendSectionEngagement } from '../../capture/messenger'
import type { EngagementSection } from '../engagement-section'

const NAP_ACCORDION_LABEL = 'label.AccordionSection3__heading--pdpAccordion'

type NapSectionConfig = {
  headingIds: string[]
  contentIds: string[]
  labelPatterns: RegExp[]
  eventLabel: string
}

const NAP_SECTIONS: Record<EngagementSection, NapSectionConfig | null> = {
  size_guide: {
    headingIds: ['heading-SIZE_AND_FIT'],
    contentIds: ['SIZE_AND_FIT'],
    labelPatterns: [/size\s*&\s*fit/i, /view size guide/i],
    eventLabel: 'Opened size & fit',
  },
  details: {
    headingIds: ['heading-DETAILS_AND_CARE', 'heading-EDITORS_NOTES'],
    contentIds: ['DETAILS_AND_CARE', 'EDITORS_NOTES'],
    labelPatterns: [/details?\s*&\s*care/i, /editor'?s notes/i],
    eventLabel: 'Opened details & care',
  },
  reviews: {
    headingIds: ['heading-REVIEWS', 'heading-CUSTOMER_REVIEWS'],
    contentIds: ['REVIEWS', 'CUSTOMER_REVIEWS'],
    labelPatterns: [/customer reviews?/i, /^reviews?$/i],
    eventLabel: 'Viewed reviews',
  },
  materials: null,
}

function matchesNapSectionContainer (
  el: Element,
  config: NapSectionConfig
): boolean {
  const ids = new Set([...config.headingIds, ...config.contentIds])
  let current: Element | null = el
  while (current) {
    if (current.id && ids.has(current.id)) return true
    current = current.parentElement
  }
  return false
}

function matchesNapSectionLabel (text: string, config: NapSectionConfig): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return config.labelPatterns.some((pattern) => pattern.test(normalized))
}

/** Classify a shopper click on NAP / Mr Porter PDP accordions */
export function classifyNapEngagementClick (el: Element): EngagementSection | null {
  const link = el.closest('a')
  if (link && /view size guide/i.test(link.textContent ?? '')) {
    return 'size_guide'
  }

  for (const [section, config] of Object.entries(NAP_SECTIONS) as Array<
    [EngagementSection, NapSectionConfig | null]
  >) {
    if (!config) continue
    if (matchesNapSectionContainer(el, config)) return section
  }

  const label = el.closest(NAP_ACCORDION_LABEL)
  if (label) {
    const text = label.textContent ?? ''
    for (const [section, config] of Object.entries(NAP_SECTIONS) as Array<
      [EngagementSection, NapSectionConfig | null]
    >) {
      if (!config) continue
      if (matchesNapSectionLabel(text, config)) return section
    }
  }

  const labelledControl = el.closest('label[for]')
  const controlId = labelledControl?.getAttribute('for') ?? ''
  if (controlId) {
    if (/size\s*&\s*fit/i.test(controlId)) return 'size_guide'
    if (/details?\s*&\s*care/i.test(controlId)) return 'details'
    if (/editor'?s notes/i.test(controlId)) return 'details'
    if (/reviews?/i.test(controlId)) return 'reviews'
  }

  return null
}

function sectionEventLabel (section: EngagementSection): string {
  const config = NAP_SECTIONS[section]
  return config?.eventLabel ?? `Viewed ${section}`
}

/**
 * Observes intentional shopper clicks on NAP PDP accordions — read-only.
 * Never simulates or triggers UI actions.
 */
export function startNapEngagementTracking (
  getProduct: () => ProductData
): () => void {
  const fired = new Set<EngagementSection>()

  const onClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const section = classifyNapEngagementClick(target)
    if (!section || fired.has(section)) return

    fired.add(section)
    const product = getProduct()
    fohliooLog('capture', `NAP shopper engagement: ${section}`, {
      product: product.name,
    })
    sendSectionEngagement(product, section, sectionEventLabel(section))
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
