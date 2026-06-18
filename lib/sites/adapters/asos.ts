import type { SiteAdapter } from '../types'
import { startAsosEngagementTracking } from '../asos/engagement'
import { getSiteKey } from '../registry'

export const asosAdapter: SiteAdapter = {
  key: 'asos.com',
  matches: (hostname) => getSiteKey(hostname) === 'asos.com',
  startEngagementTracking: startAsosEngagementTracking,
}
