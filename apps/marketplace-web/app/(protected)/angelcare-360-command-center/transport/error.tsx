'use client'

import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.scope}>
    <section className={`${styles.truthBox} ${styles.lock}`}>
      <div className={styles.sectionKicker}>Transport & Sécurité</div>
      <h1>L’espace Transport n’a pas pu être chargé</h1>
      <p>Aucune opération de transport n’a été exécutée depuis cet écran. Les données existantes restent inchangées.</p>
      <p className={styles.subtle}>Service temporairement indisponible. Réessayez dans quelques instants.</p>
      <button type="button" className={styles.button} onClick={reset}>Réessayer</button>
    </section>
  </div>
}
