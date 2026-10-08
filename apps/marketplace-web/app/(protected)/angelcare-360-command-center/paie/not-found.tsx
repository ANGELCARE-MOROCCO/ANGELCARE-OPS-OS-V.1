import Link from 'next/link'
import styles from '@/components/angelcare360/payroll-sovereign-command/PayrollCommand.module.css'
export default function NotFound(){return <section className={styles.stateUniverse}><div className={styles.stateCard}><span>PAYROLL · DOSSIER INTROUVABLE</span><h1>Cette autorité de paie n’est pas disponible.</h1><p>L’identifiant demandé ne correspond pas à une période ou un dossier accessible dans le contexte actuel. SANILA n’invente aucune donnée de remplacement.</p><Link href="/angelcare-360-command-center/paie">Retour au Payroll Command</Link></div></section>}
