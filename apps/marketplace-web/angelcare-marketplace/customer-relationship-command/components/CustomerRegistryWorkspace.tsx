'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, CircleAlert, Filter, Search, ShieldAlert, UserPlus, UsersRound } from 'lucide-react'
import type { CustomerRelationshipOverview, RelationshipCustomer } from '../types'
import styles from '../customer-relationship.module.css'
import { RelationshipDrawerHost } from './CustomerRelationshipDrawers'
import type { CustomerDossierPermissions } from '@/angelcare-marketplace/enterprise-command/customer-permissions'

const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} Dh`
const PAGE_SIZE = 20

export function CustomerRegistryWorkspace({ snapshot, canCreate = true, permissions }: { snapshot: CustomerRelationshipOverview; canCreate?: boolean; permissions: CustomerDossierPermissions }) {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState(() => searchParams.get('segment') || 'all')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [city, setCity] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<RelationshipCustomer | null>(null)
  const snapshotTime = new Date(snapshot.generatedAt).getTime()

  const cities = useMemo(() => [...new Set(snapshot.customers.map((customer) => customer.city).filter(Boolean) as string[])].sort(), [snapshot.customers])
  const filtered = useMemo(() => snapshot.customers.filter((customer) => {
    const haystack = `${customer.name} ${customer.reference} ${customer.email || ''} ${customer.phone || ''} ${customer.city || ''}`.toLowerCase()
    const scoped = scope === 'all' ||
      (scope === 'premium' && customer.premium) ||
      (scope === 'at_risk' && customer.risk !== 'healthy') ||
      (scope === 'high_value' && customer.capturedRevenue >= 20000) ||
      (scope === 'dormant' && Boolean(customer.lastOrderAt) && snapshotTime - new Date(customer.lastOrderAt!).getTime() > 90 * 86400000) ||
      (scope === 'outstanding' && customer.outstanding > 0)
    return (!query || haystack.includes(query.toLowerCase())) && scoped &&
      (kind === 'all' || customer.accountKind === kind) &&
      (status === 'all' || customer.status === status) &&
      (city === 'all' || customer.city === city)
  }), [snapshot.customers, query, scope, kind, status, city, snapshotTime])
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function applyScope(next: string) { setScope(next); setPage(1) }
  function clearFilters() { setQuery(''); setScope('all'); setKind('all'); setStatus('all'); setCity('all'); setPage(1) }

  return <main className={styles.workspaceCanvas}>
    <section className={styles.workspaceHero}>
      <div><span>CLIENTS · REGISTRE & COMMAND CENTER CRM</span><h2>Chaque relation, sa valeur, ses risques et sa prochaine action légitime.</h2><p>Le registre assemble les identités, familles, commandes, paiements et dossiers de recovery réels. Aucun score décoratif n’est introduit.</p></div>
      <div className={styles.introActions}>
        <Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers/segments">Segments</Link>
        <Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers/support">Support</Link>
        {canCreate ? <Link className={styles.primaryAction} href="/angelcare-marketplace/admin/customers/new"><UserPlus size={15}/>Ajouter un client</Link> : <button className={styles.primaryAction} disabled title="Permission marketplace.admin.access requise"><UserPlus size={15}/>Ajouter un client</button>}
      </div>
    </section>

    <section className={styles.estateStrip} aria-label="Indicateurs clients">
      <button type="button" onClick={() => applyScope('all')}><UsersRound/><span>Relations actives</span><strong>{snapshot.metrics.active}</strong></button>
      <button type="button" onClick={() => applyScope('premium')}><UsersRound/><span>Premium</span><strong>{snapshot.metrics.premium}</strong></button>
      <button type="button" onClick={() => applyScope('all')}><UserPlus/><span>Nouveaux ce mois</span><strong>{snapshot.metrics.newThisMonth}</strong></button>
      <button type="button" onClick={() => applyScope('at_risk')}><ShieldAlert/><span>À risque</span><strong>{snapshot.metrics.atRisk}</strong></button>
      <button type="button" onClick={() => applyScope('outstanding')}><CircleAlert/><span>Encours ouverts</span><strong>{money(snapshot.metrics.outstanding)}</strong></button>
      <button type="button" onClick={() => applyScope('high_value')}><UsersRound/><span>Valeur capturée</span><strong>{money(snapshot.metrics.customerValue)}</strong></button>
    </section>

    <div className={styles.customerRegistryCommand}>
      <section>
        <div className={styles.registryScope} aria-label="Segments rapides">
          {['all','premium','high_value','at_risk','dormant','outstanding'].map((key) => <button type="button" key={key} data-active={scope === key} onClick={() => applyScope(key)}>{key.replaceAll('_',' ')}<span>{key === 'all' ? snapshot.customers.length : key === 'premium' ? snapshot.customers.filter((c) => c.premium).length : key === 'high_value' ? snapshot.customers.filter((c) => c.capturedRevenue >= 20000).length : key === 'at_risk' ? snapshot.customers.filter((c) => c.risk !== 'healthy').length : key === 'dormant' ? snapshot.customers.filter((c) => Boolean(c.lastOrderAt) && snapshotTime - new Date(c.lastOrderAt!).getTime() > 90 * 86400000).length : snapshot.customers.filter((c) => c.outstanding > 0).length}</span></button>)}
        </div>
        <section className={styles.registryPanel}>
          <header className={styles.customerFilterBar}>
            <label className={styles.searchBox}><Search size={15}/><span className={styles.visuallyHidden}>Rechercher un client</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Client, référence, téléphone, e-mail, ville…"/></label>
            <select aria-label="Type de client" value={kind} onChange={(event) => { setKind(event.target.value); setPage(1) }}><option value="all">Tous les types</option><option value="family">Famille</option><option value="individual">Individuel</option><option value="organization">Organisation</option><option value="employee_beneficiary">Bénéficiaire</option><option value="guest">Invité</option></select>
            <select aria-label="Statut client" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="pending_verification">À vérifier</option><option value="restricted">Restreint</option><option value="suspended">Suspendu</option><option value="closed">Fermé</option></select>
            <select aria-label="Ville" value={city} onChange={(event) => { setCity(event.target.value); setPage(1) }}><option value="all">Toutes les villes</option>{cities.map((name) => <option key={name}>{name}</option>)}</select>
            <button type="button" className={styles.secondaryAction} onClick={clearFilters}><Filter size={14}/>Réinitialiser</button>
          </header>
          <div className={styles.customerTable}>
            <div className={styles.customerTableHead}><span>Relation</span><span>Commercial</span><span>Finance</span><span>Expérience</span><span>Dernière activité</span><span/></div>
            {visible.map((customer) => <button type="button" key={customer.id} onClick={() => setSelected(customer)} data-risk={customer.risk}>
              <div><strong>{customer.name}</strong><small>{customer.reference} · {customer.accountKind}{customer.premium ? ' · PREMIUM' : ''}</small></div>
              <div><strong>{money(customer.capturedRevenue)}</strong><small>{customer.orderCount} commandes · panier {money(customer.averageOrderValue)}</small></div>
              <div><strong>{customer.outstanding ? `${money(customer.outstanding)} dû` : 'À jour'}</strong><small>Credit {money(customer.walletBalance)}</small></div>
              <div><strong>{customer.openCases ? `${customer.openCases} dossier(s) ouvert(s)` : 'Sans incident ouvert'}</strong><small>{customer.riskReasons.join(' · ') || 'Aucun signal de risque actif'}</small></div>
              <div><strong>{customer.lastActivityAt ? new Date(customer.lastActivityAt).toLocaleDateString('fr-FR') : '—'}</strong><small>{customer.city || 'Ville non renseignée'}</small></div><ChevronRight size={14}/>
            </button>)}
            {!visible.length ? <div className={styles.healthyEmpty}>Aucun client ne correspond aux filtres. Les critères restent disponibles pour correction.</div> : null}
          </div>
          <footer className={styles.registryPagination}><span>{filtered.length} relation(s) · page {safePage}/{pageCount}</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Précédent</button><button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Suivant</button></div></footer>
        </section>
      </section>

      <aside className={styles.customerContextRail}>
        <section><header><span>SEGMENTS ACTIFS</span><Link href="/angelcare-marketplace/admin/customers/segments">Voir tout</Link></header>{snapshot.segments.slice(0,6).map((segment) => <Link key={segment.key} href={`/angelcare-marketplace/admin/customers?segment=${segment.key}`}><i data-severity={segment.severity}/><span>{segment.label}</span><strong>{segment.count}</strong></Link>)}</section>
        <section><header><span>PRIORITÉS RELATIONNELLES</span><Link href="/angelcare-marketplace/admin/customers/health">Voir tout</Link></header>{snapshot.attention.slice(0,5).map((item) => <button type="button" key={item.id} onClick={() => { const customer = snapshot.customers.find((entry) => entry.id === item.customerId); if (customer) setSelected(customer) }}><i data-severity={item.severity}/><span><strong>{item.customerName}</strong><small>{item.reason}</small></span><b>{item.exposure ? money(item.exposure) : item.action}</b></button>)}{!snapshot.attention.length ? <div className={styles.healthyEmpty}>Aucune priorité active.</div> : null}</section>
        <section><header><span>PROCHAINES ACTIONS</span></header>{snapshot.nextMoves.map((move) => <Link key={move.id} href={move.targetCustomerId ? `/angelcare-marketplace/admin/customers/${move.targetCustomerId}` : move.id === 'crm' ? '/angelcare-marketplace/admin/customers/segments' : '/angelcare-marketplace/admin/customers/health'}><i data-severity={move.severity}/><span><strong>{move.title}</strong><small>{move.detail}</small></span><ChevronRight size={13}/></Link>)}</section>
      </aside>
    </div>
    {selected ? <RelationshipDrawerHost customer={selected} caseRecord={null} permissions={permissions} onClose={() => setSelected(null)}/> : null}
  </main>
}
