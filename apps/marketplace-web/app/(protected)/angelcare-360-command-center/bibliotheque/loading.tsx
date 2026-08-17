import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'

export default function BibliothequeLoading() {
  return (
    <div className={styles.universe}>
      <main className={styles.shell} aria-busy="true" aria-label="Chargement de la Bibliothèque">
        <div className={styles.eyebrow}>SANILA · Library & Circulation OS</div>
        <div className={styles.skeleton} style={{ width: '48%', height: 54, margin: '10px 0 18px' }} />
        <div className={styles.skeleton} style={{ width: '72%', height: 18, marginBottom: 28 }} />
        <div className={styles.skeleton} style={{ width: '100%', height: 340, borderRadius: 30 }} />
        <div style={{ height: 20 }} />
        <div className={styles.gridTwo}><div className={styles.skeleton} style={{ height: 280 }} /><div className={styles.skeleton} style={{ height: 280 }} /></div>
      </main>
    </div>
  )
}
