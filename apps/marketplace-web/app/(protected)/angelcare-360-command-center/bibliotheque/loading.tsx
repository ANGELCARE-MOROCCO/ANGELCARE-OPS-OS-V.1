import styles from '@/components/angelcare360/library-command/LibraryCommand.module.css'
export default function BibliothequeLoading() {
  return <div className={styles.universe}><main className={styles.shell} aria-busy="true" aria-label="Chargement de la Bibliothèque"><div className={styles.loadingMast}><div className={styles.skeleton} /><div className={styles.skeletonWide} /></div><div className={styles.loadingRail}>{Array.from({ length: 6 }, (_, index) => <div className={styles.loadingMetric} key={index}><span/><strong/><small/></div>)}</div><div className={styles.loadingGrid}><div className={styles.loadingPanel}/><div className={styles.loadingPanel}/></div></main></div>
}
