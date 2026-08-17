import styles from '@/components/angelcare360/claims/TrustResolutionOS.module.css'

export default function Angelcare360ClaimsLoading() {
  return <main className={styles.statePage} aria-busy="true" aria-label="Chargement du Trust Resolution OS"><div className={styles.skeleton}><div className={styles.skeletonBar} /><div className={styles.skeletonPanel} /><div className={styles.skeletonBar} /></div></main>
}
