/**
 * Fashion retailer URL patterns (shared manifest + tabs query).
 * Plasmo requires the same list as a literal in `contents/capture.ts` — keep both in sync.
 * package.json `host_permissions` and `web_accessible_resources.matches` mirror this list too.
 */
export const FASHION_CONTENT_SCRIPT_MATCHES = [
  'https://*.cos.com/*',
  'https://*.net-a-porter.com/*',
  'https://*.asos.com/*',
  'https://*.zara.com/*',
  'https://*.toteme-studio.com/*',
  'https://*.reiss.com/*',
  'https://*.stories.com/*',
  'https://*.arket.com/*',
  'https://*.hm.com/*',
  'https://*.reebok.eu/*',
  'https://*.reebok.com/*',
  'https://*.underarmour.com/*',
  'https://*.puma.com/*',
  'https://*.underarmour.co.uk/*',
] as const

/** Scoped patterns for chrome.tabs.query — fashion retailers only, never all tabs */
export const FASHION_TAB_QUERY_URL_PATTERNS = FASHION_CONTENT_SCRIPT_MATCHES.map(
  (pattern) => pattern.replace(/^https:/, '*:')
)
