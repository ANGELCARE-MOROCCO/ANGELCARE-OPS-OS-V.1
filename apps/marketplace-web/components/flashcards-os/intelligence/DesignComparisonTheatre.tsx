import Link from 'next/link'
import { ArrowLeft, CheckCircle2, GitCompareArrows, ShieldAlert, Sparkles } from 'lucide-react'
import type { ProductDesign } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'

export default function DesignComparisonTheatre({ design }: { design: ProductDesign }) {
  const alternatives = design.alternatives
  return (
    <div className={styles.designComparisonPage}>
      <header className={styles.designComparisonHeader}><div><Link href={`/flashcards-os/intelligence/product-design/${design.id}`}><ArrowLeft size={15}/> War Room</Link><span className={styles.intelKicker}><GitCompareArrows size={16}/> DESIGN COMPARISON THEATRE</span><h1>{design.title}</h1><p>Comparer l’architecture, l’audience, la différenciation, la complexité et le risque sans confondre préférence esthétique et décision produit.</p></div><strong>{alternatives.length}<span>architectures</span></strong></header>
      <section className={styles.comparisonMatrix}><div className={styles.comparisonCriteria}><span>CRITERIA</span>{['Product thesis','Card count','Formats','Audience fit','Differentiation','Complexity','Risk','Benefits','Drawbacks','Recommendation'].map(item=><strong key={item}>{item}</strong>)}</div>{alternatives.map((item,index)=><article key={item.id} className={index===0?styles.comparisonPreferred:''}><header><span>OPTION {String(index+1).padStart(2,'0')}</span><h2>{item.name}</h2>{index===0?<i><Sparkles size={13}/> Lead option</i>:null}</header><p>{item.thesis}</p><strong>{item.cardCountHypothesis}</strong><div>{item.formats.map(format=><span key={format}>{format}</span>)}</div><meter min="0" max="100" value={item.audienceFit}/><meter min="0" max="100" value={item.differentiation}/><meter min="0" max="100" value={item.complexity}/><meter min="0" max="100" value={item.risk}/><ul>{item.benefits.map((value: any)=><li key={value}><CheckCircle2 size={13}/>{value}</li>)}</ul><ul>{item.drawbacks.map((value: any)=><li key={value}><ShieldAlert size={13}/>{value}</li>)}</ul><footer>{item.recommendation}</footer></article>)}</section>
      {!alternatives.length?<section className={styles.comparisonEmpty}><GitCompareArrows size={32}/><h2>Aucune alternative structurée.</h2><p>Lancez l’architecture Product Design depuis la War Room. Le système ne précharge pas de faux concepts.</p></section>:null}
    </div>
  )
}
