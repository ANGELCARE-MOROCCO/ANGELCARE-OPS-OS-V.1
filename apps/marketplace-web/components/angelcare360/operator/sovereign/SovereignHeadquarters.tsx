import Link from 'next/link'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { SOVEREIGN_TOWERS } from '@/data/angelcare360/operator-sovereign-navigation'
import styles from './SovereignExperience.module.css'

export default function SovereignHeadquarters() {
  return (
    <section className={styles.hq}>
      <header className={styles.hqCrown}>
        <div className={styles.hqMeta}><span/> AngelCare Sovereign Operator OS · Global SaaS Command Fabric</div>
        <h1 className={styles.hqTitle}>Six univers. <em>Une seule machine souveraine.</em></h1>
        <p className={styles.hqSubtitle}>Commercialiser, provisionner, facturer, servir, sécuriser et développer des milliers de tenants depuis une architecture institutionnelle connectée. Chaque client, contrat, droit produit, dirham, incident et décision reste explicable, configurable et auditable.</p>
        <div className={styles.hqCommandStrip}><span>Operational Graph</span><span>Digital Twins</span><span>Revenue Circulation</span><span>Mission Networks</span><span>Decision Chambers</span><span>Global Readiness</span></div>
      </header>
      <div className={styles.towerGrid}>
        {SOVEREIGN_TOWERS.map((tower) => (
          <Link key={tower.key} href={tower.href} className={styles.towerCard} style={{ '--tower': tower.accent, '--tower-deep': tower.accentDeep } as CSSProperties}>
            <div className={styles.towerTop}><span className={styles.towerIndex}>{tower.index}</span><span className={styles.towerSignal}>{tower.signal}</span></div>
            <div><h2 className={styles.towerTitle}>{tower.label}</h2><p className={styles.towerSummary}>{tower.summary}</p></div>
            <div className={styles.towerFooter}><span>Entrer dans l’univers</span><span><ArrowUpRight size={16}/></span></div>
          </Link>
        ))}
      </div>
    </section>
  )
}
