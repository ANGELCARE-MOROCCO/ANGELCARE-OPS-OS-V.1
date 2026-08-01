import Link from 'next/link'
import { FileSearch } from 'lucide-react'
import styles from '@/components/flashcards-os/flashcards-os.module.css'

export default function FlashcardsOSNotFound() {
  return (
    <section>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Flashcards OS · Product lineage</p>
          <h1 className={styles.pageTitle}>Dossier produit introuvable.</h1>
          <p className={styles.pageLead}>Le code demandé n’existe pas dans le portefeuille actif, ou le dossier n’est pas accessible dans votre périmètre.</p>
        </div>
      </header>
      <div className={styles.panel} style={{ maxWidth: 760, textAlign: 'center', padding: 42 }}>
        <span className={styles.horizonSeal} style={{ margin: '0 auto 18px' }}><FileSearch size={22} /></span>
        <h2 className={styles.panelTitle}>Revenir au registre canonique</h2>
        <p className={styles.panelSubtitle}>Recherchez la collection par code stable, nom officiel ou catégorie.</p>
        <Link className={styles.actionButton} href="/flashcards-os/product/collections" style={{ marginTop: 18 }}>Ouvrir Collection Registry</Link>
      </div>
    </section>
  )
}
