import { useEffect, useState } from 'react'

import type { ShopperSession } from '../interface'
import { fetchShopperSession, watchSession } from '../lib/popup-product'

export type PanelState = 'loading' | 'ready' | 'empty'

export function useShopperSession (): {
  state: PanelState
  session: ShopperSession | null
} {
  const [state, setState] = useState<PanelState>('loading')
  const [session, setSession] = useState<ShopperSession | null>(null)

  useEffect(() => {
    let active = true
    let pollId: number | undefined

    const load = async () => {
      const data = await fetchShopperSession()
      if (!active) return
      setSession(data)
      setState(data ? 'ready' : 'empty')
    }

    load()
    pollId = window.setInterval(load, 2000)
    const unwatch = watchSession((next) => {
      if (!active) return
      setSession(next)
      setState(next ? 'ready' : 'empty')
    })

    return () => {
      active = false
      if (pollId) window.clearInterval(pollId)
      unwatch()
    }
  }, [])

  return { state, session }
}
