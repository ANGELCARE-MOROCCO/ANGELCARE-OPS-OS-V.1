'use client'

import Link from 'next/link'
import { styles } from '@/components/service-os/Services360UI'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={styles.shell}>
    <section className={styles.panel} style={{ maxWidth: 980, margin: '40px auto', textAlign: 'center' }}>
      <div className={styles.panelEyebrow}>Services 360 · Partial failure</div>
      <h2 className={styles.panelTitle} style={{ fontSize: 28 }}>The requested service workspace could not be loaded.</h2>
      <p className={styles.panelText} style={{ marginInline: 'auto' }}>No data has been modified. Retry the current workspace or return safely to the service portfolio. Technical reference: {error.digest || 'not available'}.</p>
      <div className={styles.actions} style={{ justifyContent: 'center' }}>
        <button className={styles.primaryAction} onClick={reset}>Réessayer</button>
        <Link className={styles.secondaryAction} href="/services">Retour au portfolio</Link>
      </div>
    </section>
  </main>
}
