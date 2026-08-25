'use client'
import Link from'next/link'
import{AlertTriangle,RefreshCcw}from'lucide-react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import{Button}from '@/angelcare-marketplace/design-system/ui'
export default function AdminError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className={styles.workspace}><div className={styles.errorState}><div><span className={styles.stateIcon}><AlertTriangle size={28}/></span><h1 className={styles.stateTitle}>Ce workspace n’a pas pu être chargé.</h1><p className={styles.stateText}>L’Admin ne masque plus les erreurs derrière une page vide. Réessayez; si l’erreur persiste, la référence ci-dessous permet d’identifier précisément le flux concerné.</p><div className={styles.noticeDanger}>{error.message||'Erreur de chargement'}{error.digest?` · ${error.digest}`:''}</div><div className={styles.stateActions}><Button onClick={reset}><RefreshCcw size={15}/>Réessayer</Button><Link href="/angelcare-marketplace/admin">Retour au cockpit</Link><Link href="/angelcare-marketplace/admin/workspaces">Reality Map</Link></div></div></div></main>}
