'use client'

import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'

export default function BibliothequeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.universe}>
      <main className={styles.shell}>
        <div className={styles.eyebrow}>SANILA · Library & Circulation OS</div>
        <div className={styles.empty}>
          <strong>La Bibliothèque n’a pas pu être chargée.</strong>
          <p>{error.message || 'La consultation a échoué. Aucune mutation n’est confirmée par cet écran.'}</p>
          <div style={{ marginTop: 18 }}><button className={styles.button} onClick={reset}>Réessayer</button></div>
        </div>
      </main>
    </div>
  )
}
