import styles from '@/components/angelcare360/transport/sovereign/TransportSovereign.module.css'

export default function Loading() {
  return <div className={styles.scope} aria-busy="true" aria-label="Chargement Transport & Sécurité">
    <div className={styles.skeleton} />
    <div className={styles.section}><div className={styles.gridTwo}><div className={styles.skeleton} /><div className={styles.skeleton} /></div></div>
  </div>
}
