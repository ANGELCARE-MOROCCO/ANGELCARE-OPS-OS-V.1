import Link from 'next/link'
import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'
export default function BibliothequeNotFound() {
  return <div className={styles.universe}><main className={styles.shell}><section className={styles.failureState}><span className={styles.eyebrow}>Library & Circulation Command</span><h1>Dossier Bibliothèque introuvable</h1><p>L’ouvrage, l’exemplaire, le prêt ou le membre demandé n’existe pas dans le contexte actuellement accessible.</p><Link className={styles.button} href="/angelcare-360-command-center/bibliotheque">Retour au cockpit</Link></section></main></div>
}
