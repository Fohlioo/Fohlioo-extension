export function formatDwell (ms: number): string {
  if (ms < 1000) return '< 1s'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rem = seconds % 60
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`
}

export function formatRelativeTime (iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 5000) return 'Just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function dwellProgress (ms: number): number {
  const max = 180_000
  return Math.min(100, Math.round((ms / max) * 100))
}

export function scrollProgress (pct: number): number {
  return Math.min(100, Math.max(0, pct))
}
