'use client'

import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.scope}>
    <section className={`${styles.truthBox} ${styles.lock}`}>
      <div className={styles.sectionKicker}>Transport & Sécurité</div>
      <h1>Le workspace Transport n’a pas pu être chargé</h1>
      <p>Aucune opération Transport n’a été exécutée par cet écran. Les données existantes restent inchangées.</p>
      <p className={styles.subtle}>{error.message}</p>
      <button type="button" className={styles.button} onClick={reset}>Réessayer</button>
    </section>
  </div>
}
