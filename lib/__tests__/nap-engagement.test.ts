import { describe, expect, test } from 'vitest'

import { classifyNapEngagementClick } from '../sites/net-a-porter/engagement'

function clickTarget (html: string, selector: string): Element {
  document.body.innerHTML = html
  const el = document.querySelector(selector)
  if (!el) throw new Error(`Missing selector: ${selector}`)
  return el
}

describe('Net-a-Porter engagement classification', () => {
  test('SIZE & FIT accordion label click', () => {
    const el = clickTarget(
      `
      <div id="heading-SIZE_AND_FIT">
        <input id="Size & Fit-open" type="radio" />
        <label class="AccordionSection3__heading AccordionSection3__heading--pdpAccordion openLabel" for="Size & Fit-open">
          SIZE &amp; FIT
        </label>
      </div>
    `,
      'label.openLabel'
    )
    expect(classifyNapEngagementClick(el)).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('SIZE & FIT content click', () => {
    const el = clickTarget(
      `
      <div id="SIZE_AND_FIT">
        <div class="AccordionSection3__content AccordionSection3__content--pdpAccordion">
          <p>Fits true to size</p>
        </div>
      </div>
    `,
      'p'
    )
    expect(classifyNapEngagementClick(el)).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('View size guide link click', () => {
    const el = clickTarget(
      `
      <div id="SIZE_AND_FIT">
        <a href="#">View size guide</a>
      </div>
    `,
      'a'
    )
    expect(classifyNapEngagementClick(el)).toBe('size_guide')
    document.body.innerHTML = ''
  })

  test('DETAILS & CARE accordion label click', () => {
    const el = clickTarget(
      `
      <div id="heading-DETAILS_AND_CARE">
        <label class="AccordionSection3__heading AccordionSection3__heading--pdpAccordion openLabel" for="Details & Care-open">
          DETAILS &amp; CARE
        </label>
      </div>
    `,
      'label.openLabel'
    )
    expect(classifyNapEngagementClick(el)).toBe('details')
    document.body.innerHTML = ''
  })

  test('DETAILS & CARE content click', () => {
    const el = clickTarget(
      `
      <div id="DETAILS_AND_CARE">
        <p>95% cashmere, 5% elastane</p>
      </div>
    `,
      'p'
    )
    expect(classifyNapEngagementClick(el)).toBe('details')
    document.body.innerHTML = ''
  })

  test('Editor\'s Notes maps to details', () => {
    const el = clickTarget(
      `
      <div id="heading-EDITORS_NOTES">
        <label class="AccordionSection3__heading AccordionSection3__heading--pdpAccordion openLabel">
          EDITOR'S NOTES
        </label>
      </div>
    `,
      'label.openLabel'
    )
    expect(classifyNapEngagementClick(el)).toBe('details')
    document.body.innerHTML = ''
  })

  test('reviews section when present', () => {
    const el = clickTarget(
      `
      <div id="heading-REVIEWS">
        <label class="AccordionSection3__heading AccordionSection3__heading--pdpAccordion openLabel">
          REVIEWS
        </label>
      </div>
    `,
      'label.openLabel'
    )
    expect(classifyNapEngagementClick(el)).toBe('reviews')
    document.body.innerHTML = ''
  })

  test('unrelated PDP click returns null', () => {
    const el = clickTarget(`<button>Add to Bag</button>`, 'button')
    expect(classifyNapEngagementClick(el)).toBeNull()
    document.body.innerHTML = ''
  })
})
