import AngelCareLogo from './AngelCareLogo'
import styles from './AngelCareOwnershipFooter.module.css'

export default function AngelCareOwnershipFooter() {
  return (
    <footer className={styles.footer} data-angelcare-ownership-footer="true">
      <div className={styles.brand}><AngelCareLogo size="xs" priority={false} /></div>
      <div className={styles.copy}>
        <strong>ANGELCARE OWNED SANILA OS</strong>
        <span>ENGINEERED AND DESIGNED BY AISSAOUI ILYASS</span>
        <small>COPYRIGHT © 2026 ANGELCARE</small>
      </div>
    </footer>
  )
}
