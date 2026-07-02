import type { SiteAdapter } from '../types'
import { startTotemeEngagementTracking } from '../toteme/engagement'

function isTotemeHost (hostname: string): boolean {
  const host = hostname.replace(/^www\./, '')
  return (
    host === 'toteme.com' ||
    host.endsWith('.toteme.com') ||
    host === 'toteme-studio.com' ||
    host.endsWith('.toteme-studio.com')
  )
}

export const totemeAdapter: SiteAdapter = {
  key: 'toteme.com',
  matches: isTotemeHost,
  startEngagementTracking: startTotemeEngagementTracking,
}
