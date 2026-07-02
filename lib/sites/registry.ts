/** Hostnames with content-script matches — keep in sync with `lib/sites/content-script-matches.ts` */
export const FASHION_DOMAINS = [
  'cos.com',
  'net-a-porter.com',
  'mrporter.com',
  'asos.com',
  'zara.com',
  'toteme.com',
  'reiss.com',
  'stories.com',
  'arket.com',
  'hm.com',
  'reebok.eu',
  'reebok.com',
  'underarmour.com',
  'puma.com',
  'underarmour.co.uk',
] as const

const SITE_KEYS = [
  'cos.com',
  'arket.com',
  'stories.com',
  'hm.com',
  'asos.com',
  'zara.com',
  'net-a-porter.com',
  'mrporter.com',
  'reebok.eu',
  'reebok.com',
] as const

export type SiteKey = (typeof SITE_KEYS)[number]

export function getSiteKey (hostname: string): SiteKey | null {
  const host = hostname.replace(/^www\./, '')
  for (const key of SITE_KEYS) {
    if (host === key || host.endsWith(`.${key}`)) return key
  }
  return null
}

export function isCosSite (hostname: string): boolean {
  return getSiteKey(hostname) === 'cos.com'
}

export function isHmGroupSite (hostname: string): boolean {
  const key = getSiteKey(hostname)
  return key === 'arket.com' || key === 'stories.com' || key === 'hm.com'
}

export function isFashionSite (url: string): boolean {
  return FASHION_DOMAINS.some((domain) => url.includes(domain))
}
