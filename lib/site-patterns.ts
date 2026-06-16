// lib/site-patterns.ts — document as you discover them

export const SITE_PATTERNS: Record<string, string> = {
    "net-a-porter.com": "ProductGroup/hasVariant — priceSpecification",
    "mrporter.com":     "ProductGroup/hasVariant — priceSpecification",
    "zara.com":         "Array<Product> per size — offers.price",
    "cos.com":          "Single Product — offers.price; sizes via DOM",
    "toteme-studio.com":"Single Product — offers.price",
    "arket.com":        "Single Product — offers.price",
    "asos.com":         "Single Product — sizes via select#variantSelector; wishlist data-testid=saveForLater",
    "stories.com":      "Single Product — offers.price",
    "hm.com":           "Partial — DOM fallback needed for price",
    "reebok.eu":        "Single Product — offers[] with sizeSpecification.size",
    "reebok.com":       "Single Product — offers[] with sizeSpecification.size",
  }