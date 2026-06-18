import type { SiteAdapter } from '../types'
import { asosAdapter } from './asos'
import { cosAdapter } from './cos'
import { netAPorterAdapter } from './net-a-porter'
import { zaraAdapter } from './zara'

/** Ordered list — first match wins. Add new retailers here. */
const ADAPTERS: SiteAdapter[] = [
  cosAdapter,
  netAPorterAdapter,
  asosAdapter,
  zaraAdapter,
]

export function getSiteAdapter (hostname: string): SiteAdapter | null {
  return ADAPTERS.find(a => a.matches(hostname)) ?? null
}

export { asosAdapter, cosAdapter, netAPorterAdapter, zaraAdapter }
