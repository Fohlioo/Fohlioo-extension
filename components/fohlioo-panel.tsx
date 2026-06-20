import React from 'react'

import { SessionDashboard } from './session-dashboard'
import { useShopperSession } from '../hooks/use-shopper-session'
import logo from '../assets/logo.svg'

type FohliooPanelProps = {
  className?: string
}

export function FohliooPanel ({ className }: FohliooPanelProps) {
  const { state, session } = useShopperSession()

  return (
    <div className={['popup', className].filter(Boolean).join(' ')}>
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
            <p className="empty-state__copy">
              Capturing product and session signals…
            </p>
          </div>
        )}

        {state === 'empty' && (
          <div className="empty-state">
            <p className="empty-state__title">No product detected</p>
            <p className="empty-state__copy">
              Open a product page on a supported fashion site, then open Fohlioo
              again.
            </p>
          </div>
        )}

        {state === 'ready' && session && <SessionDashboard session={session} />}
      </main>
    </div>
  )
}
