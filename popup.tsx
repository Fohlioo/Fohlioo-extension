import React, { useEffect, useState } from 'react'

import { ProductPreview } from './components/product-preview'
import type { ProductData } from './interface'
import { fetchActiveTabProduct } from './lib/popup-product'
import logo from './assets/logo.svg'
import './popup.css'



type PopupState = 'loading' | 'ready' | 'empty'

function IndexPopup () {
  const [state, setState] = useState<PopupState>('loading')
  const [product, setProduct] = useState<ProductData | null>(null)

  useEffect(() => {
    let active = true

    const loadProduct = async () => {
      const data = await fetchActiveTabProduct()
      if (!active) return
      setProduct(data)
      setState(data ? 'ready' : 'empty')
    }

    loadProduct()

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'local' || !changes.latestProduct?.newValue) return
      if (!active) return
      setProduct(changes.latestProduct.newValue as ProductData)
      setState('ready')
    }

    chrome.storage.onChanged.addListener(onStorageChanged)

    return () => {
      active = false
      chrome.storage.onChanged.removeListener(onStorageChanged)
    }
  }, [])

  return (
    <div className="popup">
      <div className="popup__shell">
        <div className="popup__topbar">
          <div>
            <img src={logo} alt="Fohlioo" className="popup__logo" />
            <p className="popup__tagline">Better choices. Smarter collections.</p>
          </div>
        </div>

        <div className="popup__body">
          {state === 'loading' && (
            <div className="popup__state">
              <div className="popup__spinner" aria-hidden />
              <p className="popup__state-title">Reading product</p>
              <p className="popup__state-copy">
                Pulling structured data from the page you&apos;re on.
              </p>
            </div>
          )}

          {state === 'empty' && (
            <div className="popup__state">
              <p className="popup__state-title">No product detected</p>
              <p className="popup__state-copy">
                Open a product page on a supported fashion site, then open this
                popup again.
              </p>
            </div>
          )}

          {state === 'ready' && product && <ProductPreview product={product} />}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
