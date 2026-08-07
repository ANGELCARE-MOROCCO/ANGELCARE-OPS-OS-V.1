import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { AdaptiveExperienceData } from '../types'
import styles from '../experience.module.css'
export function ExperienceTrustPanel({data}:{data:AdaptiveExperienceData}){const {locale}=data;return <section className={styles.trustPanel} id="trust"><ShieldCheck size={42}/><div><span>TRUST & EVIDENCE</span><h2>{locale==='fr'?'Une décision appuyée par des autorités réelles':locale==='ar'?'قرار مدعوم بمراجع فعلية':'A decision backed by real authorities'}</h2><div className={styles.trustClaims}>{data.trust.map((claim)=><b key={claim.key}>{claim.label}</b>)}</div></div><Link href={`/angelcare-marketplace/${locale}/trust`}>{locale==='fr'?'Centre de confiance':locale==='ar'?'مركز الثقة':'Trust center'}<ArrowRight size={16}/></Link></section>}
