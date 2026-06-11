/** Set false to silence capture/event logs in production builds */
const DEBUG_CAPTURE =
  typeof process !== 'undefined'
    ? process.env.NODE_ENV !== 'production'
    : true

type LogCategory =
  | 'capture'
  | 'dwell'
  | 'scroll'
  | 'wishlist'
  | 'spa'
  | 'sizes'
  | 'message'

const STYLES: Record<LogCategory, string> = {
  capture: 'color:#6366f1;font-weight:bold',
  dwell: 'color:#059669;font-weight:bold',
  scroll: 'color:#0891b2;font-weight:bold',
  wishlist: 'color:#db2777;font-weight:bold',
  spa: 'color:#d97706;font-weight:bold',
  sizes: 'color:#7c3aed;font-weight:bold',
  message: 'color:#64748b;font-weight:bold',
}

export function fohliooLog (
  category: LogCategory,
  message: string,
  data?: unknown
): void {
  if (!DEBUG_CAPTURE) return

  const prefix = `%c[Fohlioo:${category}]`
  if (data !== undefined) {
    console.log(prefix, STYLES[category], message, data)
  } else {
    console.log(prefix, STYLES[category], message)
  }
}
