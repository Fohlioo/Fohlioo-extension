import type { ProductData } from '../interface'

type SiteSizeSelectors = {
  container: string
  option: string
}

type SiteDomConfig = {
  sizes?: SiteSizeSelectors
}

/** Per-site DOM overrides — extend as you validate each retailer */
const SITE_DOM_CONFIG: Record<string, SiteDomConfig> = {
  'cos.com': {
    sizes: {
      container: '[class*="grid-cols-auto" i], [class*="size" i]',
      option: 'button[data-testid^="size-selector-button-"]',
    },
  },
  'arket.com': {
    sizes: {
      container: '[class*="grid-cols-auto" i], [class*="size" i]',
      option: 'button[data-testid^="size-selector-button-"]',
    },
  },
  'stories.com': {
    sizes: {
      container: '[class*="grid-cols-auto" i], [class*="size" i]',
      option: 'button[data-testid^="size-selector-button-"]',
    },
  },
  'hm.com': {
    sizes: {
      container: '[class*="grid-cols-auto" i], [class*="size" i]',
      option: 'button[data-testid^="size-selector-button-"]',
    },
  },
  'asos.com': {
    sizes: {
      container: '[data-testid="sizeSelect"], select[name*="size" i], #variantSelector',
      option: 'option, button, label',
    },
  },
  'zara.com': {
    sizes: {
      container:
        '[class*="size-selector" i], .product-detail-size-selector, ul[class*="size" i]',
      option: 'button, li, [role="radio"]',
    },
  },
}

/** H&M group (COS, Arket, Stories, H&M) — size lives on button test ids */
const HM_SIZE_BUTTON_SELECTOR = 'button[data-testid^="size-selector-button-"]'

const GENERIC_SIZE_CONTAINER_SELECTORS = [
  '[data-testid*="size" i]',
  '[class*="size-selector" i]',
  '[class*="SizeSelector"]',
  '[id*="size-selector" i]',
  'fieldset[aria-label*="size" i]',
  '[role="radiogroup"][aria-label*="size" i]',
  '[aria-labelledby*="size" i]',
]

const GENERIC_SIZE_OPTION_SELECTORS = [
  'button',
  '[role="radio"]',
  'input[type="radio"]',
  'label',
  'li',
  'option',
]

const SIZE_LABEL =
  /^(xxs|xs|s|m|l|xl|xxl|2xs|3xs|2xl|3xl|4xl|one\s*size|os)$/i

const SIZE_NUMERIC = /^\d{1,2}(\.\d)?$/

const SIZE_NOISE =
  /size guide|select size|choose size|find your size|add to|sold out|notify|wishlist|bag|cart/i

const NAME_SELECTORS = [
  'h1[data-product-name]',
  'h1.product-name',
  'h1[class*="product" i]',
  '[data-testid="product-title"]',
  '[itemprop="name"]',
  'h1',
]

const BRAND_SELECTORS = [
  '[data-brand]',
  '[itemprop="brand"]',
  '[class*="product-brand" i]',
  'a[class*="brand" i]',
]

const PRICE_SELECTORS = [
  '[data-testid="current-price"]',
  '[data-testid="price"]',
  '[itemprop="price"]',
  '[class*="current-price" i]',
  '[class*="product-price" i]:not([class*="was" i]):not([class*="original" i])',
  '[class*="Price" i]:not([class*="was" i]):not([class*="compare" i])',
]

const ORIGINAL_PRICE_SELECTORS = [
  '[data-testid="was-price"]',
  '[data-testid="original-price"]',
  '[class*="was-price" i]',
  '[class*="compare" i]',
  '[class*="original-price" i]',
  'del',
  's',
]

const IMAGE_SELECTORS = [
  '[data-testid="product-image"] img',
  '[class*="product-image" i] img',
  '[class*="gallery" i] img',
  'picture img',
  '[itemprop="image"]',
]

const COLOUR_SELECTORS = [
  '[data-testid*="colour" i][aria-checked="true"]',
  '[data-testid*="color" i][aria-checked="true"]',
  '[class*="colour" i][aria-selected="true"]',
  '[class*="color" i][aria-selected="true"]',
  '[data-selected-color]',
  '[data-color]',
]

const MATERIAL_LABELS = /material|composition|fabric/i

function getSiteKey (hostname: string): string | null {
  const host = hostname.replace(/^www\./, '')
  for (const key of Object.keys(SITE_DOM_CONFIG)) {
    if (host === key || host.endsWith(`.${key}`)) return key
  }
  return null
}

function textContent (el: Element | null): string | null {
  const text = el?.textContent?.trim()
  return text && text.length > 0 ? text : null
}

function attr (el: Element | null, name: string): string | null {
  const value = el?.getAttribute(name)?.trim()
  return value && value.length > 0 ? value : null
}

function queryFirst (selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

function queryAllUnique (selectors: string[]): Element[] {
  const seen = new Set<Element>()
  const results: Element[] = []
  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      if (!seen.has(el)) {
        seen.add(el)
        results.push(el)
      }
    }
  }
  return results
}

function parseCurrencySymbol (symbol: string): string | null {
  switch (symbol) {
    case '£':
      return 'GBP'
    case '$':
      return 'USD'
    case '€':
      return 'EUR'
    default:
      return /^[A-Z]{3}$/i.test(symbol) ? symbol.toUpperCase() : null
  }
}

function parseAmount (raw: string): number | null {
  const normalized = raw.replace(/,/g, '').trim()
  const value = Number.parseFloat(normalized)
  return Number.isFinite(value) ? value : null
}

export function parsePriceText (
  text: string
): { price: number; currency: string | null } | null {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return null

  const symbolFirst = cleaned.match(/([£$€])\s*([\d,.]+)/)
  if (symbolFirst) {
    const price = parseAmount(symbolFirst[2])
    if (price == null) return null
    return { price, currency: parseCurrencySymbol(symbolFirst[1]) }
  }

  const codeAfter = cleaned.match(/([\d,.]+)\s*(GBP|USD|EUR)/i)
  if (codeAfter) {
    const price = parseAmount(codeAfter[1])
    if (price == null) return null
    return { price, currency: codeAfter[2].toUpperCase() }
  }

  const plain = cleaned.match(/^([\d,.]+)$/)
  if (plain) {
    const price = parseAmount(plain[1])
    if (price == null) return null
    return { price, currency: null }
  }

  return null
}

function isValidSizeLabel (label: string): boolean {
  const trimmed = label.trim()
  if (!trimmed || trimmed.length > 12) return false
  if (SIZE_NOISE.test(trimmed)) return false
  if (SIZE_LABEL.test(trimmed)) return true
  if (SIZE_NUMERIC.test(trimmed)) return true
  return false
}

function normalizeSizeLabel (label: string): string {
  const trimmed = label.trim()
  if (/^one\s*size$/i.test(trimmed)) return 'One Size'
  return trimmed.toUpperCase() === trimmed && trimmed.length <= 4
    ? trimmed
    : trimmed
}

function isGenericSizeAriaLabel (label: string): boolean {
  return /^select\s+size$/i.test(label.trim())
}

function sizeFromTestId (testId: string | null): string | null {
  if (!testId) return null
  const match = testId.match(/size-selector-button-(.+)$/i)
  if (!match) return null
  const label = match[1].trim()
  return isValidSizeLabel(label) ? normalizeSizeLabel(label) : null
}

function sizeFromLabelSpan (el: Element): string | null {
  const labelSpan = el.querySelector(
    'span.relative, span[class*="truncate"], span:not([data-testid])'
  )
  const label = textContent(labelSpan)
  if (!label) return null
  return isValidSizeLabel(label) ? normalizeSizeLabel(label) : null
}

function readSizeFromElement (el: Element): string | null {
  const fromTestId = sizeFromTestId(attr(el, 'data-testid'))
  if (fromTestId) return fromTestId

  const fromSpan = sizeFromLabelSpan(el)
  if (fromSpan) return fromSpan

  const ariaLabel = attr(el, 'aria-label')
  const candidates = [
    attr(el, 'data-size'),
    attr(el, 'data-value'),
    ariaLabel && !isGenericSizeAriaLabel(ariaLabel) ? ariaLabel : null,
    attr(el, 'value'),
    textContent(el),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const label = candidate
      .replace(/^size\s*[:\-]?\s*/i, '')
      .trim()
    if (isValidSizeLabel(label)) return normalizeSizeLabel(label)
  }

  return null
}

/** COS / H&M group — buttons use data-testid="size-selector-button-XS" */
function extractHmGroupSizes (): string[] {
  const sizes: string[] = []

  for (const button of document.querySelectorAll(HM_SIZE_BUTTON_SELECTOR)) {
    const size = readSizeFromElement(button)
    if (size) sizes.push(size)
  }

  return [...new Set(sizes)]
}

function extractSizesFromDom (): string[] {
  const hmGroupSizes = extractHmGroupSizes()
  if (hmGroupSizes.length > 0) return hmGroupSizes

  const siteKey = getSiteKey(window.location.hostname)
  const siteConfig = siteKey ? SITE_DOM_CONFIG[siteKey] : undefined
  const containers: Element[] = []

  if (siteConfig?.sizes) {
    for (const container of document.querySelectorAll(
      siteConfig.sizes.container
    )) {
      containers.push(container)
    }
  }

  if (containers.length === 0) {
    for (const selector of GENERIC_SIZE_CONTAINER_SELECTORS) {
      for (const container of document.querySelectorAll(selector)) {
        containers.push(container)
      }
    }
  }

  const optionSelectors = siteConfig?.sizes
    ? siteConfig.sizes.option.split(',').map((s) => s.trim())
    : GENERIC_SIZE_OPTION_SELECTORS

  const sizes: string[] = []
  const roots = containers.length > 0 ? containers : [document.body]

  for (const root of roots) {
    for (const selector of optionSelectors) {
      for (const el of root.querySelectorAll(selector)) {
        const size = readSizeFromElement(el)
        if (size) sizes.push(size)
      }
    }
  }

  if (sizes.length === 0) {
    for (const root of roots) {
      for (const selector of GENERIC_SIZE_OPTION_SELECTORS) {
        for (const el of root.querySelectorAll(selector)) {
          const size = readSizeFromElement(el)
          if (size) sizes.push(size)
        }
      }
    }
  }

  return [...new Set(sizes)]
}

function extractNameFromDom (): string | null {
  const el = queryFirst(NAME_SELECTORS)
  return textContent(el)
}

function extractBrandFromDom (): string | null {
  for (const selector of BRAND_SELECTORS) {
    const el = document.querySelector(selector)
    const dataBrand = attr(el, 'data-brand')
    if (dataBrand) return dataBrand
    const text = textContent(el)
    if (text) return text
  }
  return null
}

function extractPricesFromDom (): {
  price: number | null
  originalPrice: number | null
  currency: string | null
} {
  let price: number | null = null
  let currency: string | null = null

  const priceEl = queryFirst(PRICE_SELECTORS)
  const priceAttr =
    attr(priceEl, 'content') ??
    attr(priceEl, 'data-price') ??
    textContent(priceEl)

  if (priceAttr) {
    const parsed = parsePriceText(priceAttr)
    if (parsed) {
      price = parsed.price
      currency = parsed.currency
    }
  }

  let originalPrice: number | null = null
  const originalEl = queryFirst(ORIGINAL_PRICE_SELECTORS)
  const originalAttr =
    attr(originalEl, 'content') ??
    attr(originalEl, 'data-price') ??
    textContent(originalEl)

  if (originalAttr) {
    const parsed = parsePriceText(originalAttr)
    if (parsed) originalPrice = parsed.price
  }

  return { price, originalPrice, currency }
}

function extractImagesFromDom (): string | string[] | null {
  const urls = queryAllUnique(IMAGE_SELECTORS)
    .map((img) => attr(img, 'src') ?? attr(img, 'data-src'))
    .filter((url): url is string => Boolean(url))
    .map((url) => (url.startsWith('//') ? `https:${url}` : url))
    .filter((url) => !url.startsWith('data:'))

  const unique = [...new Set(urls)]
  if (unique.length === 0) return null
  if (unique.length === 1) return unique[0]
  return unique
}

function extractColourFromDom (): string | null {
  for (const selector of COLOUR_SELECTORS) {
    const el = document.querySelector(selector)
    const colour =
      attr(el, 'data-selected-color') ??
      attr(el, 'data-color') ??
      attr(el, 'aria-label') ??
      textContent(el)
    if (colour && !/select|choose/i.test(colour)) {
      return colour.replace(/^(colour|color)\s*[:\-]?\s*/i, '').trim()
    }
  }

  const detailRows = document.querySelectorAll('dl dt, tr th, [class*="detail" i] dt')
  for (const label of detailRows) {
    if (!MATERIAL_LABELS.test(label.textContent ?? '') && /colou?r/i.test(label.textContent ?? '')) {
      const sibling =
        label.nextElementSibling ??
        label.parentElement?.querySelector('dd, td')
      const value = textContent(sibling)
      if (value) return value
    }
  }

  return null
}

function extractMaterialFromDom (): string | null {
  const labels = document.querySelectorAll('dl dt, tr th, li, span, p')
  for (const label of labels) {
    if (!MATERIAL_LABELS.test(label.textContent ?? '')) continue
    const sibling =
      label.nextElementSibling ??
      label.parentElement?.querySelector('dd, td')
    const value = textContent(sibling)
    if (value) return value
  }
  return null
}

function extractCategoryFromDom (): string | null {
  const breadcrumbSelectors = [
    'nav[aria-label*="breadcrumb" i] a',
    '[class*="breadcrumb" i] a',
    'ol[itemtype*="BreadcrumbList" i] a',
  ]

  const crumbs: string[] = []
  for (const selector of breadcrumbSelectors) {
    for (const el of document.querySelectorAll(selector)) {
      const text = textContent(el)
      if (text && !/home/i.test(text)) crumbs.push(text)
    }
    if (crumbs.length > 0) break
  }

  return crumbs.length > 0 ? crumbs[crumbs.length - 1] : null
}

function extractAvailabilityFromDom (): ProductData['availability'] {
  const pageText = document.body?.innerText ?? ''
  if (/out of stock|sold out|unavailable/i.test(pageText)) {
    const addButton = document.querySelector(
      'button[type="submit"], button[class*="add" i], [data-testid*="add-to-bag" i]'
    )
    if (addButton?.hasAttribute('disabled')) return 'out_of_stock'
    if (/sold out|out of stock/i.test(pageText)) return 'out_of_stock'
  }

  const addButton = document.querySelector(
    'button[class*="add-to" i], [data-testid*="add-to-bag" i], [data-testid*="add-to-cart" i]'
  )
  if (addButton && !addButton.hasAttribute('disabled')) return 'in_stock'

  return 'unknown'
}

/** Scrapes visible product DOM for fields missing from JSON-LD / OG */
export function extractFromDom (): Partial<ProductData> {
  const { price, originalPrice, currency } = extractPricesFromDom()
  const sizes = extractSizesFromDom()

  return {
    name: extractNameFromDom(),
    brand: extractBrandFromDom(),
    price,
    originalPrice,
    currency,
    category: extractCategoryFromDom(),
    colour: extractColourFromDom(),
    material: extractMaterialFromDom(),
    images: extractImagesFromDom(),
    availability: extractAvailabilityFromDom(),
    sizes,
    url: window.location.href,
  }
}
