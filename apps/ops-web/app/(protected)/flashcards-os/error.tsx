'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import styles from '@/components/flashcards-os/flashcards-os.module.css'

export default function FlashcardsOSError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Flashcards OS · Controlled failure state</p>
          <h1 className={styles.pageTitle}>Le workspace n’a pas pu être chargé.</h1>
          <p className={styles.pageLead}>Aucune donnée n’a été modifiée. Vérifiez la migration Flashcards OS, la connexion Supabase et les permissions de votre session.</p>
        </div>
      </header>
      <div className={styles.panel} style={{ maxWidth: 880 }}>
        <div className={styles.integrityTop}>
          <span className={styles.integrityIcon}><AlertTriangle size={18} /></span>
          <div><div className={styles.integrityTitle}>Incident de chargement contenu</div><div className={styles.insightLabel}>Reference {error.digest || 'local-runtime'}</div></div>
        </div>
        <p className={styles.inspectorCopy}>{error.message || 'Erreur applicative non qualifiée.'}</p>
        <button className={styles.actionButton} type="button" onClick={reset}><RefreshCw size={15} /> Relancer le workspace</button>
      </div>
    </section>
  )
}
