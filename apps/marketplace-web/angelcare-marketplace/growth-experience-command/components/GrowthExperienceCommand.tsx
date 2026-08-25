import Link from 'next/link'
import {
  Activity, ArrowUpRight, BarChart3, Compass, FlaskConical, Globe2, Home,
  Megaphone, MousePointerClick, RefreshCcw, Search, ShieldAlert, Sparkles, Target, UsersRound, WandSparkles,
} from 'lucide-react'
import type {GrowthExperienceSnapshot} from '../types'
import styles from '../growth-experience-command.module.css'

const root='/angelcare-marketplace/admin/growth-experience'
const n=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(v)

const commands=[
  {href:`${root}/acquisition`,title:'Acquisition',copy:'Transformer les opportunités prouvées en initiatives gouvernées.',icon:Target},
  {href:`${root}/campaigns`,title:'Campaigns',copy:'Planifier, approuver, activer, mesurer et clôturer les initiatives.',icon:Megaphone},
  {href:`${root}/audiences`,title:'Audiences',copy:'Relier segmentation, source réelle et exécution sans audience inventée.',icon:UsersRound},
  {href:`${root}/merchandising`,title:'Merchandising',copy:'Produits, collections, placements et exposition commerciale.',icon:WandSparkles},
  {href:`${root}/homepage`,title:'Homepage',copy:'Composer et publier les surfaces d’accueil administrables.',icon:Home},
  {href:`${root}/discovery`,title:'Discovery',copy:'Contrôler règles, suggestions, bannières et résultats vides.',icon:Compass},
  {href:`${root}/conversion`,title:'Conversion',copy:'Piloter les sessions jusqu’au résultat canonique.',icon:MousePointerClick},
  {href:`${root}/retention`,title:'Retention',copy:'Exécuter les initiatives de rétention avec preuve et outcome.',icon:RefreshCcw},
  {href:`${root}/recovery`,title:'Recovery',copy:'Transformer les opportunités de récupération en actions mesurées.',icon:Activity},
  {href:`${root}/experiments`,title:'Experiments',copy:'Hypothèse → activation → mesure → scale/stop.',icon:FlaskConical},
  {href:`${root}/localization`,title:'Localization',copy:'Traiter les blockers de traduction et de publication locale.',icon:Globe2},
  {href:`${root}/performance`,title:'Performance',copy:'Lire uniquement les métriques et incidents réellement observés.',icon:BarChart3},
]

export function GrowthExperienceCommand({data}:{data:GrowthExperienceSnapshot}){
  const a=data.authority,c=data.conversion,l=data.localization,f=data.frontend
  const risks=[
    {label:'Conversion failures',value:c.failedSessions,href:`${root}/conversion`},
    {label:'Critical conversion exceptions',value:c.criticalExceptions,href:`${root}/conversion`},
    {label:'Localization blockers',value:l.sensitiveBlockers,href:`${root}/localization`},
    {label:'Missing translations',value:l.missing,href:`${root}/localization`},
    {label:'Performance breaches',value:a.performanceBreaches,href:`${root}/performance`},
  ].filter(x=>x.value>0)
  return <main className={styles.commandRoot}>
    <section className={styles.commandHero}>
      <div><span>MARKETPLACE GROWTH OPERATING SYSTEM</span><h2>Move commercial evidence into controlled execution.</h2><p>This command surface composes existing Growth, Conversion, Homepage, Discovery, Localization and Frontend authorities. It does not invent revenue attribution, ROAS, churn or demand that the backend cannot prove.</p><div className={styles.heroActions}><Link href={`${root}/campaigns`}>Open execution queue <ArrowUpRight size={15}/></Link><Link href={`${root}/conversion`}>Open conversion control</Link></div></div>
      <aside><small>GROWTH POSTURE</small><strong>{a.growthOpportunities}</strong><span>open evidence-backed opportunities</span><b>{a.experimentsRunning} experiments currently running</b></aside>
    </section>

    <section className={styles.metricRail}>
      <article><span>Active conversion</span><strong>{n(c.activeSessions)}</strong><small>{c.readyForConfirmation} ready for confirmation</small></article>
      <article><span>Submitted today</span><strong>{n(c.submittedToday)}</strong><small>canonical conversion sessions</small></article>
      <article><span>Public surfaces</span><strong>{n(f.surfaces)}</strong><small>{f.published} published</small></article>
      <article><span>Open inquiries</span><strong>{n(f.openInquiries)}</strong><small>commercial intake</small></article>
      <article><span>Localization debt</span><strong>{n(l.missing+l.stale)}</strong><small>{l.truthfulCoverage==null?'coverage not asserted':`${Math.round(l.truthfulCoverage)}% source coverage`}</small></article>
      <article><span>Accepted metrics</span><strong>{n(a.acceptedMetrics)}</strong><small>{a.dataQualityBlockers} quality blockers</small></article>
    </section>

    <section className={styles.commandGrid}>{commands.map(({href,title,copy,icon:Icon})=><Link href={href} className={styles.commandCard} key={href}><div><Icon size={18}/><span>OPERATING WORKSPACE</span></div><strong>{title}</strong><p>{copy}</p><i>Open command →</i></Link>)}</section>

    <section className={styles.splitGrid}>
      <article className={styles.panel}><header><div><span>DECISION QUEUE</span><h3>Growth opportunities</h3></div><Link href={`${root}/acquisition`}>Full queue</Link></header><div className={styles.rows}>{a.opportunities.length?a.opportunities.map(x=><div className={styles.row} key={x.id}><div><strong>{x.title}</strong><small>{x.opportunity_type} · confidence {x.confidence}%</small></div><b>{x.commercial_relevance}</b><span>{x.status}</span></div>):<div className={styles.empty}>No evidence-backed opportunity is currently recorded.</div>}</div></article>
      <article className={styles.panel}><header><div><span>INTERVENTION QUEUE</span><h3>What needs attention</h3></div></header><div className={styles.rows}>{risks.length?risks.map(x=><Link href={x.href} className={styles.riskRow} key={x.label}><ShieldAlert size={16}/><div><strong>{x.label}</strong><small>Open the canonical authority to resolve it.</small></div><b>{n(x.value)}</b></Link>):<div className={styles.empty}>No critical growth-experience blocker is asserted by the current sources.</div>}</div></article>
    </section>

    <section className={styles.truthBand}><Sparkles size={17}/><div><strong>Truth rule</strong><span>Metrics without accepted source quality remain blockers, not executive facts. Growth actions remain explicit operator decisions with audit evidence.</span></div><Search size={17}/></section>
  </main>
}
