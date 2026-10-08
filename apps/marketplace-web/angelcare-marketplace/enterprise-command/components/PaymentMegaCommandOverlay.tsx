'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { AdminPaymentDossier } from '@/angelcare-marketplace/admin-control-plane/types'
import styles from '../enterprise-command.module.css'
import { PaymentMegaCommand } from './PaymentMegaCommand'

type Envelope<T> = { data: T; error?: { message?: string } }

export function PaymentMegaCommandOverlay({ paymentIntentId, onClose }: { paymentIntentId: string; onClose: () => void }) {
  const [initial, setInitial] = useState<AdminPaymentDossier | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void (async () => {
      const response = await fetch(`/api/angelcare-marketplace/admin/payments/${paymentIntentId}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => ({})) as Envelope<AdminPaymentDossier>
      if (!active) return
      if (response.ok && payload.data) setInitial(payload.data)
      else setError(payload.error?.message || 'Dossier paiement indisponible.')
    })()
    return () => { active = false }
  }, [paymentIntentId])

  return <div className={styles.nestedOverlay} role="dialog" aria-modal="true" aria-label="Finance Mega Dossier">
    <section className={styles.nestedDossier}>
      <div className={styles.nestedHeader}>
        <button className={styles.buttonSecondary} type="button" onClick={onClose}><X size={14}/>Fermer Finance Dossier</button>
      </div>
      {error ? <div className={styles.error}>{error}</div> : initial ? <PaymentMegaCommand initial={initial}/> : <div className={styles.panel}>Chargement du Finance Mega Dossier…</div>}
    </section>
  </div>
}
