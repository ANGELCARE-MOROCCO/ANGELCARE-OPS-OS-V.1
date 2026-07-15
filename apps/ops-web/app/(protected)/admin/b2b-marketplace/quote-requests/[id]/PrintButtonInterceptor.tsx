'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PrintButtonInterceptor() {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname || pathname.includes('/devis-print')) return
    const id = pathname.split('/quote-requests/')[1]?.split('/')[0]
    if (!id) return
    const openPrint = () => window.open(`/devis-b2b/${id}`, '_blank', 'noopener,noreferrer')
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button, a') as HTMLElement | null
      if (!button) return
      const label = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''}`.toLowerCase()
      if (label.includes('print') || label.includes('imprimer') || label.includes('a4') || label.includes('devis')) {
        event.preventDefault()
        event.stopPropagation()
        openPrint()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])
  return null
}
