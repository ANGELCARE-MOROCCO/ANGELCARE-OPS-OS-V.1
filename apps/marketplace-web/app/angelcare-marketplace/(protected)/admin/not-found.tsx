import Link from 'next/link'
import{Search,ArrowLeft}from'lucide-react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import{Card,PageHeader}from '@/angelcare-marketplace/design-system/ui'
export default function AdminNotFound(){return <main style={{padding:'28px',maxWidth:980,margin:'0 auto'}}><PageHeader eyebrow="ADMIN REALITY" title="Workspace introuvable" description="Cette adresse ne correspond pas à un workspace Admin actif. Utilisez la Reality Map pour ouvrir l’autorité canonique plutôt qu’une ancienne route."/><Card title="Revenir au contrôle canonique" subtitle="Aucune impasse : retrouvez le workspace réel ou revenez au cockpit."><div className={styles.pageActions}><Link href="/angelcare-marketplace/admin/workspaces" className={styles.primaryButton}><Search size={16}/>Reality Map</Link><Link href="/angelcare-marketplace/admin" className={styles.secondaryButton}><ArrowLeft size={16}/>Operator Excellence</Link></div></Card></main>}
