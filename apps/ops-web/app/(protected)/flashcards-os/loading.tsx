import styles from '@/components/flashcards-os/flashcards-os.module.css'

export default function FlashcardsOSLoading() {
  return (
    <section aria-busy="true" aria-label="Chargement Flashcards OS">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>ANGELCARE · Flashcards OS</p>
          <h1 className={styles.pageTitle}>Synchronisation du portefeuille…</h1>
          <p className={styles.pageLead}>Chargement de la taxonomie, des dossiers produit, des décisions legacy et des contrôles de gouvernance.</p>
        </div>
      </header>
      <div className={styles.kpiGrid}>
        {Array.from({ length: 4 }, (_, index) => <div className={styles.kpiCard} key={index} style={{ minHeight: 138, opacity: 0.58 }} />)}
      </div>
      <div className={styles.panel} style={{ minHeight: 360, marginTop: 18, opacity: 0.5 }} />
    </section>
  )
}
