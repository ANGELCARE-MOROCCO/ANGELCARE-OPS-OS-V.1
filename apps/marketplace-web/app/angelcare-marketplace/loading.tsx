import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'

export default function MarketplaceLoading() {
  return (
    <div className={styles.scope}>
      <div className={styles.publicMain}>
        <div className={styles.stack} aria-label="Chargement ANGELCARE Marketplace">
          <div className={styles.skeleton} style={{ width: 160, height: 28 }} />
          <div className={styles.skeleton} style={{ width: '62%', height: 58 }} />
          <div className={styles.skeleton} style={{ width: '82%', height: 16 }} />
          <div className={styles.skeleton} style={{ width: '74%', height: 16 }} />
          <div className={styles.skeleton} style={{ width: '100%', height: 260 }} />
        </div>
      </div>
    </div>
  )
}
