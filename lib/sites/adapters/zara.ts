import type { SiteAdapter } from '../types'
import { startZaraEngagementTracking } from '../zara/engagement'
import { getSiteKey } from '../registry'

export const zaraAdapter: SiteAdapter = {
  key: 'zara.com',
  matches: (hostname) => getSiteKey(hostname) === 'zara.com',
  startEngagementTracking: startZaraEngagementTracking,
}
