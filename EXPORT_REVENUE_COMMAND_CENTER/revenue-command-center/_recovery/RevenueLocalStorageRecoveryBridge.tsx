'use client'

import { useEffect, useState } from 'react'

const FLAG = 'angelcare_revenue_recovery_bridge_v1_applied'

export default function RevenueLocalStorageRecoveryBridge() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const url = new URL(window.location.href)
        const force = url.searchParams.get('restoreRevenueLocal') === '1'
        if (!force && localStorage.getItem(FLAG) === '1') return
        const res = await fetch('/api/revenue-command-center/recovery/raw', { cache: 'no-store' })
        const json = await res.json()
        if (!json?.ok || !json.payload) return
        let restored = 0
        for (const [key, value] of Object.entries(json.payload as Record<string, string>)) {
          const current = localStorage.getItem(key)
          if (force || !current || current === '{}' || current === '[]') {
            localStorage.setItem(key, String(value))
            restored++
          }
        }
        localStorage.setItem(FLAG, '1')
        if (!cancelled && restored > 0) setMessage(`Recovered ${restored} Revenue workspace stores from permanent backup.`)
      } catch (error) {
        console.warn('Revenue recovery bridge skipped', error)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  if (!message) return null
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 9999, maxWidth: 420, borderRadius: 18, border: '1px solid rgba(34,197,94,.35)', background: 'rgba(2,6,23,.96)', color: '#ecfdf5', padding: '14px 16px', boxShadow: '0 22px 70px rgba(0,0,0,.45)', fontSize: 13, lineHeight: 1.4 }}>
      <strong style={{ color: '#86efac' }}>Revenue recovery active</strong>
      <div>{message}</div>
    </div>
  )
}
