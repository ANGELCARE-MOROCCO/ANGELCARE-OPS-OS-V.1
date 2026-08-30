'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, CircleAlert, Search, ShieldAlert } from 'lucide-react'
import type { CustomerCaseRecord, CustomerRelationshipOverview } from '../types'
import styles from '../customer-relationship.module.css'
import { RelationshipDrawerHost } from './CustomerRelationshipDrawers'

const money = (value: number, currency = 'Dh') => `${Math.round(value).toLocaleString('fr-FR')} ${currency}`

export function CustomerCasesWorkspace({ snapshot, canManageCase }: { snapshot: CustomerRelationshipOverview; canManageCase: boolean }) {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState('all')
  const [selected, setSelected] = useState<CustomerCaseRecord | null>(null)
  const list = useMemo(() => snapshot.cases.filter((record) => {
    const scoped = scope === 'all' ||
      (scope === 'critical' && (['critical', 'urgent'].includes(record.priority) || record.riskLevel === 'critical')) ||
      (scope === 'blocked' && record.status === 'blocked') ||
      (scope === 'recovery' && record.status === 'recovery') ||
      scope === record.status
    const haystack = `${record.reference} ${record.customerName || ''} ${record.title} ${record.sourceReference || ''}`.toLowerCase()
    return scoped && (!query || haystack.includes(query.toLowerCase()))
  }), [snapshot.cases, query, scope])
  const exposure = list.reduce((sum, record) => sum + record.exposure, 0)
  const scopes = ['all', 'critical', 'blocked', 'recovery', 'in_progress', 'approval_pending']

  return <main className={styles.workspaceCanvas}>
    <section className={styles.workspaceHero}>
      <div><span>CLIENTS · SUPPORT & RÉCLAMATIONS</span><h2>Qualifier le préjudice client, l’urgence et la prochaine décision.</h2><p>La file s’appuie sur les dossiers du noyau opérationnel. Les transitions, preuves, affectations et actions de recovery restent auditées par leurs autorités serveur.</p></div>
      <div className={styles.introActions}><Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers">Registre clients</Link><Link className={styles.primaryAction} href="/angelcare-marketplace/admin/customers/health">Santé & rétention</Link></div>
    </section>
    <section className={styles.estateStrip} aria-label="Indicateurs support">
      <button type="button" onClick={() => setScope('all')}><CircleAlert/><span>Dossiers ouverts</span><strong>{snapshot.cases.length}</strong></button>
      <button type="button" onClick={() => setScope('critical')}><ShieldAlert/><span>Critiques / urgents</span><strong>{snapshot.cases.filter((record) => ['critical', 'urgent'].includes(record.priority) || record.riskLevel === 'critical').length}</strong></button>
      <button type="button" onClick={() => setScope('blocked')}><CircleAlert/><span>Bloqués</span><strong>{snapshot.cases.filter((record) => record.status === 'blocked').length}</strong></button>
      <button type="button" onClick={() => setScope('approval_pending')}><ShieldAlert/><span>Approbation</span><strong>{snapshot.cases.filter((record) => record.status === 'approval_pending').length}</strong></button>
      <button type="button" onClick={() => setScope('recovery')}><ShieldAlert/><span>Recovery</span><strong>{snapshot.cases.filter((record) => record.status === 'recovery').length}</strong></button>
      <button type="button" onClick={() => setScope('all')}><CircleAlert/><span>Exposition</span><strong>{money(snapshot.cases.reduce((sum, record) => sum + record.exposure, 0))}</strong></button>
    </section>
    <div className={styles.registryScope}>{scopes.map((key) => <button type="button" key={key} data-active={scope === key} onClick={() => setScope(key)}>{key.replaceAll('_', ' ')}<span>{key === 'all' ? snapshot.cases.length : snapshot.cases.filter((record) => key === 'critical' ? ['critical', 'urgent'].includes(record.priority) || record.riskLevel === 'critical' : record.status === key).length}</span></button>)}</div>
    <section className={styles.registryPanel}>
      <header><label className={styles.searchBox}><Search size={15}/><span className={styles.visuallyHidden}>Rechercher un dossier support</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dossier, client, référence source…"/></label><div className={styles.registryCount}><CircleAlert size={14}/>{list.length} dossier(s) · {money(exposure)} d’exposition</div></header>
      <div className={styles.caseQueue}>{list.map((record) => <button type="button" key={record.id} data-risk={['critical', 'urgent'].includes(record.priority) || record.riskLevel === 'critical' ? 'critical' : 'attention'} onClick={() => setSelected(record)}><ShieldAlert size={16}/><div><strong>{record.title}</strong><small>{record.reference} · {record.customerName || 'Client non relié'}</small></div><div><strong>{record.status.replaceAll('_', ' ')}</strong><small>{record.nextAction || 'Prochaine action non renseignée'}</small></div><div><strong>{record.priority}</strong><small>{record.dueAt ? new Date(record.dueAt).toLocaleString('fr-FR') : 'Échéance non définie'}</small></div><b>{record.exposure ? money(record.exposure, record.currency) : '—'}</b><ChevronRight size={14}/></button>)}{!list.length ? <div className={styles.healthyEmpty}>Aucun dossier ne correspond à cette file. Les filtres restent disponibles pour correction.</div> : null}</div>
    </section>
    {selected ? <RelationshipDrawerHost customer={null} caseRecord={selected} canManageCase={canManageCase} onClose={() => setSelected(null)}/> : null}
  </main>
}
