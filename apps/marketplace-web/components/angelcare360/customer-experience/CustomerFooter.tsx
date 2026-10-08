import SanilaLogo from '@/components/brand/SanilaLogo'
import styles from './CustomerFooter.module.css'
export default function CustomerFooter(){return <footer className={styles.footer} data-customer-ownership-footer="true"><div className={styles.legal}><strong>SANILA OPERATING SYSTEM — SaaS owned by AngelCare</strong><span>Engineered and designed by Aissaoui Ilyass</span><small>Copyright © 2026 AngelCare</small></div><div className={styles.logo}><SanilaLogo variant="normal" width={112} height={39}/></div></footer>}
