import type { SiteAdapter } from '../types'
import { startCosCartTracking } from '../cos/cart'
import { startCosEngagementTracking } from '../cos/engagement'
import {
  extractCosComposition,
  startCosMaterialPassiveWatch,
} from '../cos/material'
import { getSiteKey } from '../registry'

export const cosAdapter: SiteAdapter = {
  key: 'cos.com',
  matches: (hostname) => getSiteKey(hostname) === 'cos.com',
  extractMaterial: extractCosComposition,
  watchMaterialReveal: startCosMaterialPassiveWatch,
  startEngagementTracking: startCosEngagementTracking,
  startCartTracking: startCosCartTracking,
}
