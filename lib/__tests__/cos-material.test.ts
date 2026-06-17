import { afterEach, describe, expect, test } from 'vitest'

import {
  extractCosComposition,
  startCosMaterialPassiveWatch,
} from '../sites/cos/material'
import { isCosSite } from '../sites/registry'

function mockCosDom (html: string) {
  document.body.innerHTML = html
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://www.cos.com/en-gb/product/test',
      hostname: 'www.cos.com',
    },
    writable: true,
  })
}

const compositionRow = `
  <div
    data-testid="product-details-drawer-sustainability-materials"
    class="flex items-baseline text-main-primary">
    <span class="body2_semibold">Composition</span>
    <div class="flex-1">
      <span class="body2_regular">Shell: 72% Linen, 28% Cotton</span>
    </div>
  </div>
`

describe('isCosSite', () => {
  test('matches cos.com hostnames', () => {
    expect(isCosSite('www.cos.com')).toBe(true)
    expect(isCosSite('cos.com')).toBe(true)
    expect(isCosSite('www.asos.com')).toBe(false)
  })
})

describe('extractCosComposition', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('returns null when composition row is in a hidden tabpanel', () => {
    mockCosDom(`
      <div role="tablist">
        <button role="tab" aria-selected="true">Clothing</button>
        <button role="tab" aria-selected="true">Materials and Suppliers</button>
      </div>
      <div role="tabpanel" hidden>${compositionRow}</div>
    `)

    expect(extractCosComposition()).toBeNull()
  })

  test('extracts composition even when site nav has another active tab', () => {
    mockCosDom(`
      <div role="tablist">
        <button role="tab" aria-selected="true" data-state="active">Clothing</button>
        <button role="tab" aria-selected="true" data-state="active">Materials and Suppliers</button>
      </div>
      <div role="tabpanel">${compositionRow}</div>
    `)

    expect(extractCosComposition()).toBe('Shell: 72% Linen, 28% Cotton')
  })
})

describe('startCosMaterialPassiveWatch', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('captures when shopper reveals composition in the DOM', async () => {
    mockCosDom(`<div role="tabpanel" id="panel" hidden></div>`)

    let captured = false
    const cleanup = startCosMaterialPassiveWatch(() => {
      captured = true
    })

    const panel = document.getElementById('panel')!
    panel.removeAttribute('hidden')
    panel.innerHTML = compositionRow

    await new Promise((r) => setTimeout(r, 1_600))

    expect(extractCosComposition()).toBe('Shell: 72% Linen, 28% Cotton')
    expect(captured).toBe(true)

    cleanup()
  })
})
