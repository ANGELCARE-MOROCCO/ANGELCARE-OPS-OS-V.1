'use client'
import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'
export default function BibliothequeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className={styles.universe}><main className={styles.shell}><section className={styles.failureState}><span className={styles.eyebrow}>Bibliothèque · temporairement indisponible</span><h1>La bibliothèque n’a pas pu être chargée.</h1><p>Nous ne pouvons pas afficher le registre pour le moment. Réessayez dans quelques instants.</p><div className={styles.warningChamber}><strong>Vos données restent protégées</strong><p>Aucun prêt, retour, perte, annulation ou changement d’exemplaire n’est considéré comme confirmé depuis cet écran.</p></div><button className={styles.button} onClick={reset}>Réessayer</button></section></main></div>
}
