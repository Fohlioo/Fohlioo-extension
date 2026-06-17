import type { SiteAdapter } from '../types'
import { cosAdapter } from './cos'
import { netAPorterAdapter } from './net-a-porter'

/** Ordered list — first match wins. Add new retailers here. */
const ADAPTERS: SiteAdapter[] = [cosAdapter, netAPorterAdapter]

export function getSiteAdapter (hostname: string): SiteAdapter | null {
  return ADAPTERS.find((a) => a.matches(hostname)) ?? null
}

export { cosAdapter, netAPorterAdapter }
