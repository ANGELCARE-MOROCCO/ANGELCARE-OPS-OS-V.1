import Link from 'next/link'
import { ArrowRight, Boxes, CheckCircle2, Layers3, ShieldAlert } from 'lucide-react'
import type { ProductDesign } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill } from './IntelligencePrimitives'

export default function ProductDesignPortfolio({ designs }: { designs: ProductDesign[] }) {
  const lanes = [
    { label:'Architecture', statuses:['draft','researching','structuring'] },
    { label:'Authority review', statuses:['review','rework'] },
    { label:'Approved design', statuses:['approved'] },
    { label:'UMZ3 handoff', statuses:['ready_for_umz3','archived','rejected'] },
  ]
  return (
    <div className={styles.productDesignPortfolioPage}>
      <header className={styles.productDesignPortfolioHeader}><div><span className={styles.intelKicker}><Layers3 size={16}/> PRODUCT DESIGN PORTFOLIO</span><h1>Des concepts prouvés aux architectures prêtes pour le Command Compiler.</h1><p>Aucun asset n’est créé ici. La War Room constitue le produit, ses exigences, alternatives, risques et décisions.</p></div><div><strong>{designs.filter(d=>d.status==='ready_for_umz3').length}</strong><span>ready for UMZ3</span></div></header>
      <section className={styles.designPortfolioLanes}>{lanes.map((lane: any)=><article key={lane.label}><header><span>{lane.label}</span><strong>{designs.filter(d=>lane.statuses.includes(d.status)).length}</strong></header><div>{designs.filter(d=>lane.statuses.includes(d.status)).map(design=><Link href={`/flashcards-os/intelligence/product-design/${design.id}`} key={design.id}><div><span>{design.code}</span><StatusPill value={design.status}/></div><h2>{design.title}</h2><p>{design.executiveThesis}</p><footer><span>V{design.version}</span><span>{design.totalCardCountHypothesis} cartes hypothèse</span><strong>{Math.round(design.readinessScore)}%</strong><ArrowRight size={14}/></footer></Link>)}</div></article>)}</section>
      {!designs.length?<EmptyIntelligenceState title="Aucune War Room ouverte" detail="Autorisez une opportunité qualifiée, puis ouvrez son Product Design dossier." href="/flashcards-os/intelligence/opportunities" action="Examiner les opportunités"/>:null}
      <section className={styles.designPortfolioDoctrine}><article><Boxes size={18}/><div><strong>Architecture, pas illustration</strong><span>Contenu, progression, formats et contraintes.</span></div></article><article><ShieldAlert size={18}/><div><strong>Risques explicites</strong><span>Droits, culture, sécurité et overlap.</span></div></article><article><CheckCircle2 size={18}/><div><strong>Handoff gouverné</strong><span>UMZ3 uniquement après readiness et autorité.</span></div></article></section>
    </div>
  )
}
