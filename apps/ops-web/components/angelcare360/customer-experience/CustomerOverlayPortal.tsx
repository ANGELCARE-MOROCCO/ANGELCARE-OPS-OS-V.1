'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useCustomerOverlayKernel } from './CustomerOverlayProvider'

export default function CustomerOverlayPortal({ children }: { children: ReactNode }) {
  const kernel = useCustomerOverlayKernel()
  const [fallback, setFallback] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (kernel.host) return
    let node = document.getElementById('angelcare360-customer-overlay-root')
    if (!node) {
      node = document.createElement('div')
      node.id = 'angelcare360-customer-overlay-root'
      node.dataset.customerOverlayRoot = 'true'
      document.body.appendChild(node)
    }
    setFallback(node)
  }, [kernel.host])

  const host = kernel.host || fallback
  return host ? createPortal(children, host) : null
}
