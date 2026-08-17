import Link from 'next/link'
import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'

export default function BibliothequeNotFound() {
  return (
    <div className={styles.universe}>
      <main className={styles.shell}>
        <div className={styles.empty}>
          <strong>Dossier Bibliothèque introuvable</strong>
          <p>L’ouvrage, l’exemplaire ou le prêt demandé n’existe pas dans le contexte accessible.</p>
          <div style={{ marginTop: 18 }}><Link className={styles.button} href="/angelcare-360-command-center/bibliotheque">Retour à la Bibliothèque</Link></div>
        </div>
      </main>
    </div>
  )
}
