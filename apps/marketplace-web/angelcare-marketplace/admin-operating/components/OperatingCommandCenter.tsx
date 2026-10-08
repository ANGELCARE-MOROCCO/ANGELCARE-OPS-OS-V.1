import Link from 'next/link'
import { Activity, AlertTriangle, BadgeCheck, Clock3, Layers3 } from 'lucide-react'
import { ULTRA_MZ1_WORKSPACES } from '../workspace-registry'
import type { OperatingCase } from '../types'
import styles from '../admin-operating.module.css'

export function OperatingCommandCenter({cases}:{cases:OperatingCase[]}){
 const open=cases.filter(x=>!['closed','cancelled'].includes(x.status))
 const blocked=open.filter(x=>x.status==='blocked'||x.blockers.length>0)
 const critical=open.filter(x=>x.risk_level==='critical'||x.priority==='critical')
 const overdue=open.filter(x=>x.due_at&&new Date(x.due_at).getTime()<Date.now())
 const reconciled=cases.filter(x=>x.status==='reconciled'||x.status==='closed')
 return <main className={styles.shell}>
  <section className={styles.hero}><div><span className={styles.eyebrow}>ULTRA MZ1 · VERTICAL OPERATING AUTHORITY</span><h1>Dossiers, propriétaires, preuves, décisions, exceptions et clôture.</h1><p>Le noyau opérationnel relie les objets commerciaux et d’exécution sans remplacer leurs moteurs métiers. Chaque exception a un owner, chaque décision une preuve, chaque clôture une trace.</p></div><aside className={styles.heroCard}><Layers3/><strong>{open.length}</strong><span>dossiers opérationnels ouverts</span><small>{critical.length} critiques · {overdue.length} SLA dépassés</small></aside></section>
  <section className={styles.metrics}><article className={styles.metric}><Activity/><strong>{open.length}</strong><span>Ouverts</span></article><article className={styles.metric}><AlertTriangle/><strong>{blocked.length}</strong><span>Bloqués</span></article><article className={styles.metric}><AlertTriangle/><strong>{critical.length}</strong><span>Critiques</span></article><article className={styles.metric}><Clock3/><strong>{overdue.length}</strong><span>En retard</span></article><article className={styles.metric}><BadgeCheck/><strong>{reconciled.length}</strong><span>Réconciliés / clos</span></article></section>
  <section className={styles.panel}><header className={styles.panelHeader}><div><span className={styles.kicker}>MISSION WORKSPACES</span><h2>Autorités verticales Ultra MZ1</h2></div><strong>{ULTRA_MZ1_WORKSPACES.length}</strong></header><div className={styles.panelBody}><div className={styles.workspaceGrid}>{ULTRA_MZ1_WORKSPACES.map(w=><Link className={styles.workspaceCard} href={w.route} key={w.key}><small>{w.domain.toUpperCase()} · {w.workspaceType}</small><b>{w.key}</b><p>{w.mission}</p><span>{w.capabilities.length} capacités obligatoires</span></Link>)}</div></div></section>
  <section className={styles.panel}><header className={styles.panelHeader}><div><span className={styles.kicker}>LIVE CASES</span><h2>Priorités opérationnelles</h2></div></header><div className={styles.panelBody}><div className={styles.queue}>{open.slice(0,30).map(x=><Link className={styles.caseCard} href={`/angelcare-marketplace/admin/operating/${x.id}`} key={x.id}><div><strong>{x.title}</strong><small>{x.public_reference} · {x.workspace_key}</small></div><span className={styles.status}>{x.status}</span><span className={styles.risk} data-risk={x.risk_level}>{x.risk_level}</span><div><strong>{x.next_action||'Action à définir'}</strong><small>{x.due_at?new Date(x.due_at).toLocaleString('fr-FR'):'Sans échéance'}</small></div></Link>)}{!open.length?<div className={styles.empty}>Aucun dossier opérationnel matérialisé. Les moteurs métiers restent actifs; les dossiers sont créés lorsqu’une mission requiert orchestration, preuve, approbation ou exception.</div>:null}</div></div></section>
 </main>
}
