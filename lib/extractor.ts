import type { ProductData } from '../interface'
import { extractFromDom } from './dom-extractor'

// ─── Price extraction ───────────────────────────────────────────────
// Handles: offers.price, offers.priceSpecification (object or array — NAP),
//          offers[0].price
function getOfferPriceSpec (offer: unknown): Record<string, unknown> | null {
  if (!offer || typeof offer !== 'object') return null
  const ps = (offer as Record<string, unknown>).priceSpecification
  if (Array.isArray(ps)) {
    const current = ps.find((item) => {
      if (!item || typeof item !== 'object') return false
      const spec = item as Record<string, unknown>
      const priceType = spec.priceType
      return (
        spec.price != null &&
        (!priceType || !String(priceType).includes('Strikethrough'))
      )
    })
    if (current && typeof current === 'object') {
      return current as Record<string, unknown>
    }
    const first = ps[0]
    return first && typeof first === 'object'
      ? (first as Record<string, unknown>)
      : null
  }
  if (ps && typeof ps === 'object') return ps as Record<string, unknown>
  return null
}

function getStrikethroughPriceSpec (
  offer: Record<string, unknown>
): Record<string, unknown> | null {
  const ps = offer.priceSpecification
  if (!Array.isArray(ps)) return null
  const strike = ps.find((item) => {
    if (!item || typeof item !== 'object') return false
    const priceType = (item as Record<string, unknown>).priceType
    return priceType != null && String(priceType).includes('Strikethrough')
  })
  return strike && typeof strike === 'object'
    ? (strike as Record<string, unknown>)
    : null
}

function extractPrice (offers: any): {
  price: number | null
  originalPrice: number | null
  currency: string | null
} {
  if (!offers) return { price: null, originalPrice: null, currency: null }

  const offer = Array.isArray(offers) ? offers[0] : offers
  const priceSpec = getOfferPriceSpec(offer)

  if (priceSpec?.price != null) {
    const strikeSpec = getStrikethroughPriceSpec(offer as Record<string, unknown>)
    return {
      price: parseFloat(String(priceSpec.price)),
      originalPrice: strikeSpec?.price
        ? parseFloat(String(strikeSpec.price))
        : priceSpec.highPrice
          ? parseFloat(String(priceSpec.highPrice))
          : null,
      currency: (priceSpec.priceCurrency as string) ?? null,
    }
  }

  if (offer?.price !== undefined && offer?.price !== null) {
    return {
      price: parseFloat(String(offer.price)),
      originalPrice: offer.highPrice
        ? parseFloat(String(offer.highPrice))
        : null,
      currency: offer.priceCurrency ?? null,
    }
  }

  return { price: null, originalPrice: null, currency: null }
}



// ─── Brand extraction ───────────────────────────────────────────────
// Handles: brand as string, brand as { name: string }, brand as { @type, name }
function extractBrand (brand: any): string | null {
  if (!brand) return null
  if (typeof brand === 'string') return brand
  if (typeof brand === 'object' && brand.name) return brand.name
  return null
}

// ─── Image extraction ───────────────────────────────────────────────
// Handles: string, ImageObject, array of strings / ImageObjects
function imageObjectUrl (img: unknown): string | null {
  if (typeof img !== 'object' || img === null) return null
  const obj = img as Record<string, unknown>
  const url = obj.url ?? obj.contentUrl
  return typeof url === 'string' && url.length > 0 ? url : null
}

function normalizeImageUrl (url: string): string {
  if (url.startsWith('//')) return `https:${url}`
  return url
}

function collectImageUrls (image: unknown): string[] {
  if (!image) return []

  if (typeof image === 'string') {
    return image.length > 0 ? [normalizeImageUrl(image)] : []
  }

  if (Array.isArray(image)) {
    const urls: string[] = []
    for (const img of image) {
      if (typeof img === 'string' && img.length > 0) {
        urls.push(normalizeImageUrl(img))
      } else {
        const url = imageObjectUrl(img)
        if (url) urls.push(normalizeImageUrl(url))
      }
    }
    return urls
  }

  const single = imageObjectUrl(image)
  return single ? [normalizeImageUrl(single)] : []
}

/** Returns a string for one image, string[] for multiple, null when absent */
function extractImages (image: unknown): string | string[] | null {
  const urls = [...new Set(collectImageUrls(image))]
  if (urls.length === 0) return null
  if (urls.length === 1) return urls[0]
  return urls
}

function isPresent<T> (value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function isKnownAvailability (
  availability: ProductData['availability'] | undefined
): availability is 'in_stock' | 'out_of_stock' {
  return availability === 'in_stock' || availability === 'out_of_stock'
}

/** JSON-LD → OG → DOM; each layer fills only fields still missing */
export function mergeExtractedProductData (
  jsonLd: Partial<ProductData>,
  og: Partial<ProductData>,
  dom: Partial<ProductData> = {}
): Partial<ProductData> {
  const hasJsonLd = Boolean(jsonLd.name || jsonLd.price)
  const hasOg = Boolean(og.name || og.price)

  let extractionSource: ProductData['extractionSource'] = 'dom'
  if (hasJsonLd) extractionSource = 'json_ld'
  else if (hasOg) extractionSource = 'open_graph'

  const sizes =
    jsonLd.sizes && jsonLd.sizes.length > 0
      ? jsonLd.sizes
      : og.sizes && og.sizes.length > 0
        ? og.sizes
        : dom.sizes && dom.sizes.length > 0
          ? dom.sizes
          : []

  return {
    name: isPresent(jsonLd.name)
      ? jsonLd.name
      : isPresent(og.name)
        ? og.name
        : dom.name ?? null,
    brand: isPresent(jsonLd.brand)
      ? jsonLd.brand
      : isPresent(og.brand)
        ? og.brand
        : dom.brand ?? null,
    price: jsonLd.price ?? og.price ?? dom.price ?? null,
    originalPrice:
      jsonLd.originalPrice ?? og.originalPrice ?? dom.originalPrice ?? null,
    currency: isPresent(jsonLd.currency)
      ? jsonLd.currency
      : isPresent(og.currency)
        ? og.currency
        : dom.currency ?? null,
    category: isPresent(jsonLd.category)
      ? jsonLd.category
      : isPresent(og.category)
        ? og.category
        : dom.category ?? null,
    colour: isPresent(jsonLd.colour)
      ? jsonLd.colour
      : isPresent(og.colour)
        ? og.colour
        : dom.colour ?? null,
    material: isPresent(jsonLd.material)
      ? jsonLd.material
      : isPresent(og.material)
        ? og.material
        : dom.material ?? null,
    images: isPresent(jsonLd.images)
      ? jsonLd.images
      : isPresent(og.images)
        ? og.images
        : dom.images ?? null,
    availability: isKnownAvailability(jsonLd.availability)
      ? jsonLd.availability
      : isKnownAvailability(og.availability)
        ? og.availability
        : isKnownAvailability(dom.availability)
          ? dom.availability
          : 'unknown',
    sizes,
    url: isPresent(jsonLd.url)
      ? jsonLd.url
      : isPresent(og.url)
        ? og.url
        : dom.url,
    extractionSource,
  }
}

// ─── Size extraction ────────────────────────────────────────────────
// Handles: product.size, offers[].size, offers[].sizeSpecification.size (Reebok/Shopify)
function extractSizeFromOffer (offer: unknown): string | null {
  if (!offer || typeof offer !== 'object') return null
  const o = offer as Record<string, unknown>
  if (typeof o.size === 'string' && o.size.trim()) return o.size.trim()
  const spec = o.sizeSpecification
  if (spec && typeof spec === 'object') {
    const size = (spec as Record<string, unknown>).size
    if (typeof size === 'string' && size.trim()) return size.trim()
    if (typeof size === 'number' && !Number.isNaN(size)) return String(size)
  }
  return null
}

function extractSizesFromOffers (offers: unknown): string[] {
  if (!offers) return []
  const offerList = Array.isArray(offers) ? offers : [offers]
  const sizes = offerList
    .map(extractSizeFromOffer)
    .filter((s): s is string => Boolean(s))
    .filter((s) => s !== 'One Size')
  return [...new Set(sizes)]
}

function extractSizes (product: Record<string, unknown>): string[] {
  const fromOffers = extractSizesFromOffers(product.offers)
  if (fromOffers.length > 0) return fromOffers

  if (typeof product.size === 'string' && product.size.trim()) {
    const size = product.size.trim()
    return size === 'One Size' ? [] : [size]
  }

  const variants = product.hasVariant
  if (Array.isArray(variants)) {
    const fromVariants = variants
      .flatMap((v) => {
        if (!v || typeof v !== 'object') return []
        const variant = v as Record<string, unknown>
        if (typeof variant.size === 'string' && variant.size.trim()) {
          return [variant.size.trim()]
        }
        return extractSizesFromOffers(variant.offers)
      })
      .filter((s) => s !== 'One Size')
    if (fromVariants.length > 0) return [...new Set(fromVariants)]
  }

  return []
}

function isJsonLdType (node: unknown, type: string): boolean {
  if (!node || typeof node !== 'object') return false
  const rawType = (node as Record<string, unknown>)['@type']
  const matches = (value: unknown) =>
    typeof value === 'string' &&
    (value === type || value.endsWith(`/${type}`))
  if (Array.isArray(rawType)) return rawType.some(matches)
  return matches(rawType)
}

/** Flatten top-level arrays and @graph wrappers into a node list */
function flattenJsonLdNodes (raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return []
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => flattenJsonLdNodes(item))
  }
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj['@graph'])) {
    return obj['@graph'] as Record<string, unknown>[]
  }
  return [obj]
}

// ─── Availability extraction ────────────────────────────────────────
function extractAvailability(
    offers: any
  ): "in_stock" | "out_of_stock" | "unknown" {
    const offer = Array.isArray(offers) ? offers[0] : offers
    const av = offer?.availability ?? offer?.priceSpecification?.availability
    if (!av) return "unknown"
    if (av.includes("InStock") || av.includes("InStoreOnly")) return "in_stock"
    if (av.includes("OutOfStock") || av.includes("Discontinued"))
      return "out_of_stock"
    return "unknown"
  }



  // ─── Normalise a single Product node ───────────────────────────────
function normaliseProduct(
    product: Record<string, unknown>,
    fallbackName?: string,
    fallbackBrand?: string
  ): Partial<ProductData> {
    const { price, originalPrice, currency } = extractPrice(product.offers)
    const sizes = extractSizes(product)
  
    return {
      name: (product.name as string) ?? fallbackName ?? null,
      brand: extractBrand(product.brand) ?? fallbackBrand ?? null,
      price,
      originalPrice,
      currency,
      colour: (product.color as string) ?? (product.colour as string) ?? null,
      material: (product.material as string) ?? null,
      images: extractImages(product.image),
      availability: extractAvailability(product.offers),
      sizes,
      url: typeof product.url === 'string' ? product.url : undefined,
    }
  }



  // ─── Main JSON-LD extractor ─────────────────────────────────────────
export function extractFromJsonLd(): Partial<ProductData> {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    )
  
    for (const script of scripts) {
      try {
        const raw = JSON.parse(script.textContent ?? "")
        const nodes = flattenJsonLdNodes(raw)
  
        // ── Pattern 1: ProductGroup (Net-a-Porter) ──────────────────
        const productGroup = nodes.find((n) => isJsonLdType(n, 'ProductGroup'))
        if (productGroup) {
          const variants = (productGroup.hasVariant ?? []) as Record<string, unknown>[]
  
          const fullVariant = variants.find((v) => {
            if (!isJsonLdType(v, 'Product')) return false
            const offers = v.offers
            const offer = Array.isArray(offers) ? offers[0] : offers
            return getOfferPriceSpec(offer)?.price != null
          })
  
          if (fullVariant) {
            const groupBrand = productGroup.brand as { name?: string } | undefined
            const base = normaliseProduct(
              fullVariant,
              productGroup.name as string,
              groupBrand?.name
            )
  
            const sizes = variants
              .flatMap((v) => extractSizes(v))
              .filter((s) => s !== 'One Size')
  
            const colours = [
              ...new Set(variants.map((v) => v.color).filter(Boolean)),
            ] as string[]
  
            return {
              ...base,
              name: (productGroup.name as string) ?? base.name,
              material: (productGroup.material as string) ?? base.material,
              sizes: sizes.length > 0 ? [...new Set(sizes)] : base.sizes,
              colour:
                (fullVariant.color as string) ??
                (colours.length === 1 ? colours[0] : null),
            }
          }
        }
  
        // ── Pattern 2: Multiple Product nodes (Zara) ───────────────
        const productNodes = nodes.filter((n) => isJsonLdType(n, 'Product'))
  
        if (productNodes.length > 1) {
          const base = normaliseProduct(productNodes[0])
  
          const sizes = productNodes
            .flatMap((p) => extractSizes(p))
            .filter((s) => s !== 'One Size')
  
          const firstOffers = productNodes[0].offers as Record<string, unknown> | Record<string, unknown>[] | undefined
          const offerUrl = Array.isArray(firstOffers)
            ? (firstOffers[0]?.url as string)
            : (firstOffers?.url as string)
  
          return {
            ...base,
            sizes: sizes.length > 0 ? [...new Set(sizes)] : base.sizes,
            url: offerUrl ?? (productNodes[0].url as string) ?? window.location.href,
          }
        }
  
        // ── Pattern 3: Single Product (Cos, Reebok/Shopify, etc.) ──
        if (productNodes.length === 1) {
          return normaliseProduct(productNodes[0])
        }
  
      } catch {
        // malformed JSON-LD — try next script tag
        continue
      }
    }
  
    return {}
  }
  
  // ─── Open Graph fallback ────────────────────────────────────────────
  export function extractFromOG(): Partial<ProductData> {
    const get = (prop: string) =>
      document.querySelector(`meta[property="${prop}"]`)
        ?.getAttribute("content") ?? null
  
    const priceStr = get("product:price:amount")
  
    const ogImageUrls = [
      ...document.querySelectorAll('meta[property="og:image"]')
    ]
      .map((el) => el.getAttribute('content'))
      .filter((url): url is string => Boolean(url))

    return {
      name: get("og:title"),
      images: extractImages(ogImageUrls.length > 0 ? ogImageUrls : null),
      price: priceStr ? parseFloat(priceStr) : null,
      currency: get("product:price:currency"),
      brand: get("og:site_name"),
      availability: (() => {
        const av = get("product:availability")
        if (!av) return "unknown"
        if (av === "instock" || av === "in stock") return "in_stock"
        if (av === "oos" || av === "out of stock") return "out_of_stock"
        return "unknown"
      })(),
    }
  }
  
  // ─── Main export — JSON-LD first, OG fills gaps ────────────────────
  export function extractProductData(): Partial<ProductData> | null {
    const merged = mergeExtractedProductData(
      extractFromJsonLd(),
      extractFromOG(),
      extractFromDom()
    )

    if (!merged.name && !merged.price) return null

    return {
      ...merged,
      url: merged.url ?? window.location.href,
      capturedAt: new Date().toISOString(),
    }
  }
  