import React, { useEffect, useState } from 'react'

import { SessionDashboard } from './components/session-dashboard'
import type { ShopperSession } from './interface'
import { fetchShopperSession, watchSession } from './lib/popup-product'
import logo from './assets/logo.svg'
import './popup.css'

type PopupState = 'loading' | 'ready' | 'empty'

function IndexPopup () {
  const [state, setState] = useState<PopupState>('loading')
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

  return (
    <div className="popup">
      <header className="popup-header">
        <img src={logo} alt="Fohlioo" className="popup-header__logo" />
        <div className="popup-header__live">
          {state === 'ready' && (
            <>
              <span className="popup-header__pulse" />
              Live
            </>
          )}
        </div>
      </header>

      <main className="popup-main">
        {state === 'loading' && (
          <div className="empty-state">
            <div className="spinner" aria-hidden />
            <p className="empty-state__title">Reading this page</p>
            <p className="empty-state__copy">Capturing product and session signals…</p>
          </div>
        )}

        {state === 'empty' && (
          <div className="empty-state">
            <p className="empty-state__title">No product detected</p>
            <p className="empty-state__copy">
              Open a product page on a supported fashion site, then open Fohlioo again.
            </p>
          </div>
        )}

        {state === 'ready' && session && <SessionDashboard session={session} />}
      </main>
    </div>
  )
}

export default IndexPopup
