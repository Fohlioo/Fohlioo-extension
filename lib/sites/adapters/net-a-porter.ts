import type { SiteAdapter } from '../types'
import { startNapEngagementTracking } from '../net-a-porter/engagement'
import { getSiteKey } from '../registry'

export const netAPorterAdapter: SiteAdapter = {
  key: 'net-a-porter.com',
  matches: (hostname) => {
    const key = getSiteKey(hostname)
    return key === 'net-a-porter.com' || key === 'mrporter.com'
  },
  startEngagementTracking: startNapEngagementTracking,
}
