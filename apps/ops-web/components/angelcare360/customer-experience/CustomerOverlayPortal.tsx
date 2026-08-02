'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
export default function CustomerOverlayPortal({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    let node = document.getElementById('angelcare360-customer-overlay-root')
    if (!node) { node = document.createElement('div'); node.id = 'angelcare360-customer-overlay-root'; node.dataset.customerOverlayRoot = 'true'; document.body.appendChild(node) }
    setHost(node)
  }, [])
  return host ? createPortal(children, host) : null
}
