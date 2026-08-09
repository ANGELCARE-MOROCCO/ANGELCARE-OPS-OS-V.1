import AngelCareLogo from '@/components/brand/AngelCareLogo'
import styles from './CustomerFooter.module.css'
export default function CustomerFooter(){return <footer className={styles.footer} data-customer-ownership-footer="true"><div className={styles.legal}><strong>ANGELCARE SANILA OS — SaaS owned by AngelCare</strong><span>Engineered and designed by Aissaoui Ilyass</span><small>Copyright © 2026 AngelCare</small></div><div className={styles.logo}><AngelCareLogo size="xs" priority={false}/></div></footer>}
