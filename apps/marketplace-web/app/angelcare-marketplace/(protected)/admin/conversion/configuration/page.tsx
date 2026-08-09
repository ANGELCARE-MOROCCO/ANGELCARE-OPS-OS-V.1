import Link from 'next/link'
import {ArrowRight,Clock3,FileCheck2,ShieldCheck} from 'lucide-react'
import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import styles from '@/angelcare-marketplace/conversion-universe/conversion.module.css'

const policyCards=[
 {title:'Hold disponibilité',value:'30 minutes',icon:Clock3},
 {title:'Snapshot prix',value:'30 minutes',icon:Clock3},
 {title:'Consentements obligatoires',value:'Version 2026.1',icon:FileCheck2},
 {title:'Confirmation idempotente',value:'Toujours active',icon:ShieldCheck},
]
export default async function Page(){await requireMarketplacePageContext('marketplace.conversion.configuration.manage');return <div className={styles.queueRoot}><section className={styles.queueHero}><div><span>CONVERSION POLICY CONTROL</span><h1>Politiques, expirations et exigences de confirmation</h1><p>Les politiques sont persistées en base et pilotent les holds, snapshots, consentements et règles de confirmation.</p></div><ShieldCheck size={48}/></section><section className={styles.queueGrid}>{policyCards.map(card=>{const Icon=card.icon;return <article key={card.title}><header><div><span>POLICY</span><h2>{card.title}</h2></div><Icon size={24}/></header><div className={styles.queueEvidence}><div><small>Valeur active</small><b>{card.value}</b></div><div><small>Autorité</small><b>Database policy registry</b></div></div></article>})}</section><Link href="/angelcare-marketplace/admin/conversion">Retour au cockpit <ArrowRight size={16}/></Link></div>}
