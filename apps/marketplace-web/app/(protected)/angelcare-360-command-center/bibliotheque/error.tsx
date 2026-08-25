'use client'
import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'
export default function BibliothequeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.universe}><main className={styles.shell}><section className={styles.failureState}><span className={styles.eyebrow}>Library & Circulation Command · indisponible</span><h1>La Bibliothèque n’a pas pu être chargée.</h1><p>{error.message || 'La consultation a échoué.'}</p><div className={styles.warningChamber}><strong>Conséquence</strong><p>Aucun prêt, retour, perte, annulation ou changement d’exemplaire n’est considéré comme confirmé depuis cet écran.</p></div><button className={styles.button} onClick={reset}>Réessayer</button></section></main></div>
}
