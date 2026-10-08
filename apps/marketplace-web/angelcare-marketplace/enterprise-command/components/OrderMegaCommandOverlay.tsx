'use client'

import { X } from 'lucide-react'
import styles from '../enterprise-command.module.css'
import { OrderMegaCommand } from './OrderMegaCommand'

export function OrderMegaCommandOverlay({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  return <div className={styles.nestedOverlay} role="dialog" aria-modal="true" aria-label="Order Command dossier">
    <section className={styles.nestedDossier}>
      <div className={styles.nestedHeader}>
        <button className={styles.buttonSecondary} type="button" onClick={onClose}><X size={14}/>Fermer Order Dossier</button>
      </div>
      <OrderMegaCommand orderId={orderId}/>
    </section>
  </div>
}
