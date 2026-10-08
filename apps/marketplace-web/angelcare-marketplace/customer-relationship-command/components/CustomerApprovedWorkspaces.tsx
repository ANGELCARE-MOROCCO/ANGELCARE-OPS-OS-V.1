'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, CircleAlert, Save, ShieldAlert, UsersRound, WalletCards } from 'lucide-react'
import type { CustomerRelationshipOverview, RelationshipCustomer } from '../types'
import styles from '../customer-relationship.module.css'
import { RelationshipDrawerHost } from './CustomerRelationshipDrawers'
import type { CustomerDossierPermissions } from '@/angelcare-marketplace/enterprise-command/customer-permissions'

type TerritoryOption = { id: string; label: string; reference: string }
type CreatedCustomer = { id: string; public_reference?: string; display_name?: string }
type CreateEnvelope = { data?: { customer?: CreatedCustomer; temporaryPassword?: string }; error?: { message?: string } }
const money = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} Dh`

export function CustomerCreateWorkspace({ territories, canManage }: { territories: TerritoryOption[]; canManage: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', accountKind: 'family', preferredLocale: 'fr', territoryId: '', premiumStatus: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ customer: CreatedCustomer; temporaryPassword?: string } | null>(null)
  const dirty = Object.values(form).some((value) => value !== '' && value !== false) && !result

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', protect)
    return () => window.removeEventListener('beforeunload', protect)
  }, [dirty])

  const checks = [
    ['Type de relation', Boolean(form.accountKind)],
    ['Nom / identité', form.displayName.trim().length > 1],
    ['E-mail valide', /^\S+@\S+\.\S+$/.test(form.email)],
    ['Téléphone', Boolean(form.phone.trim())],
    ['Territoire', Boolean(form.territoryId) || territories.length === 0],
    ['Dossier enregistré', Boolean(result)],
  ] as const

  async function submit() {
    if (!canManage || !checks[1][1] || !checks[2][1]) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/angelcare-marketplace/admin/customers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, territoryId: form.territoryId || null }) })
      const payload = await response.json() as CreateEnvelope
      if (!response.ok || !payload.data?.customer) throw new Error(payload.error?.message || 'Création impossible.')
      setResult({ customer: payload.data.customer, temporaryPassword: payload.data.temporaryPassword })
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') } finally { setBusy(false) }
  }

  return <main className={styles.workspaceCanvas}>
    <section className={styles.workspaceHero}><div><span>CLIENTS · ONBOARDING STRUCTURÉ</span><h2>Ajouter un client</h2><p>Création de l’identité Auth et du dossier Marketplace canonique. Une relation famille crée aussi son dossier famille via l’autorité existante.</p></div><div className={styles.introActions}><Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers">Annuler</Link><button type="button" className={styles.primaryAction} disabled={!canManage || busy || !checks[1][1] || !checks[2][1]} title={!canManage ? 'Permission marketplace.admin.access requise' : undefined} onClick={() => void submit()}><Save size={15}/>{busy ? 'Création…' : 'Créer et ouvrir le 360'}</button></div></section>
    <div className={styles.customerCreateLayout}>
      <section className={styles.customerCreateForm}>
        <div className={styles.customerTypeSelector}>{[['family','Famille'],['individual','Particulier'],['organization','Organisation'],['employee_beneficiary','Bénéficiaire entreprise'],['guest','Invité']].map(([value,label]) => <button type="button" key={value} data-active={form.accountKind === value} disabled={!canManage} onClick={() => setForm((current) => ({ ...current, accountKind: value }))}><UsersRound size={16}/><span>{label}</span></button>)}</div>
        <fieldset disabled={!canManage || busy}><legend>1. Identité</legend><div className={styles.formGrid}><label className={styles.span2}><span>Nom d’affichage *</span><input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoComplete="name"/></label><label><span>E-mail principal *</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email"/></label><label><span>Téléphone</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} autoComplete="tel"/></label></div></fieldset>
        <fieldset disabled={!canManage || busy}><legend>2. Territoire & préférences</legend><div className={styles.formGrid}><label><span>Langue préférée</span><select value={form.preferredLocale} onChange={(event) => setForm({ ...form, preferredLocale: event.target.value })}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label><label><span>Territoire</span><select value={form.territoryId} onChange={(event) => setForm({ ...form, territoryId: event.target.value })}><option value="">{territories.length ? 'Sélectionner…' : 'Aucun territoire accessible'}</option>{territories.map((territory) => <option value={territory.id} key={territory.id}>{territory.label} · {territory.reference}</option>)}</select></label><label className={styles.switchRow}><input type="checkbox" checked={form.premiumStatus} onChange={(event) => setForm({ ...form, premiumStatus: event.target.checked })}/><span>Relation premium</span></label></div></fieldset>
        <section className={styles.creationDoctrine}><ShieldAlert size={18}/><div><strong>Ce que la création exécute réellement</strong><p>Identité, dossier client, référence canonique et dossier famille lorsqu’applicable. Les consentements, adresses, membres et objets commerciaux sont ensuite opérés dans le Client 360.</p></div></section>
        {error ? <div className={styles.errorBox}>{error}</div> : null}
        {result ? <section className={styles.createdCustomerResult}><CheckCircle2/><div><strong>{result.customer.display_name || form.displayName} créé</strong><span>{result.customer.public_reference || result.customer.id}</span>{result.temporaryPassword ? <code>Accès temporaire : {result.temporaryPassword}</code> : null}</div><button type="button" className={styles.primaryAction} onClick={() => router.push(`/angelcare-marketplace/admin/customers/${result.customer.id}`)}>Ouvrir le 360 <ChevronRight size={14}/></button></section> : null}
      </section>
      <aside className={styles.customerCreateRail}><section><header>CHECKLIST DE QUALIFICATION <span>{checks.filter(([,done]) => done).length}/{checks.length}</span></header>{checks.map(([label,done]) => <div key={label} data-done={done}><CheckCircle2 size={14}/><span>{label}</span></div>)}</section><section><header>AUTORITÉ</header><p>Écriture : <code>POST /admin/customers</code></p><p>Protection serveur : <code>marketplace.admin.access</code></p><p>Les champs absents de l’autorité de création ne sont pas simulés.</p></section></aside>
    </div>
  </main>
}

export function CustomerHealthWorkspace({ snapshot, permissions }: { snapshot: CustomerRelationshipOverview; permissions: CustomerDossierPermissions }) {
  const [scope, setScope] = useState<'all' | 'critical' | 'attention' | 'outstanding' | 'dormant'>('all')
  const [selected, setSelected] = useState<RelationshipCustomer | null>(null)
  const snapshotTime = new Date(snapshot.generatedAt).getTime()
  const list = useMemo(() => snapshot.customers.filter((customer) => scope === 'all' ||
    (scope === 'critical' && customer.risk === 'critical') ||
    (scope === 'attention' && customer.risk === 'attention') ||
    (scope === 'outstanding' && customer.outstanding > 0) ||
    (scope === 'dormant' && Boolean(customer.lastOrderAt) && snapshotTime - new Date(customer.lastOrderAt!).getTime() > 90 * 86400000)), [snapshot.customers, scope, snapshotTime])
  const dormant = snapshot.customers.filter((customer) => Boolean(customer.lastOrderAt) && snapshotTime - new Date(customer.lastOrderAt!).getTime() > 90 * 86400000).length
  const clear = snapshot.customers.filter((customer) => customer.risk === 'healthy').length

  return <main className={styles.workspaceCanvas}>
    <section className={styles.workspaceHero}><div><span>CLIENTS · SANTÉ & RÉTENTION</span><h2>Prioriser les relations dont un signal source exige une intervention.</h2><p>Les risques proviennent uniquement des dossiers critiques, encours financiers, incidents de paiement et périodes d’inactivité présents dans la source.</p></div><div className={styles.introActions}><Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers/segments">Voir les segments</Link><Link className={styles.primaryAction} href="/angelcare-marketplace/admin/promotions">Ouvrir Marketing</Link></div></section>
    <section className={styles.estateStrip}><button type="button" onClick={() => setScope('critical')}><ShieldAlert/><span>Critiques</span><strong>{snapshot.customers.filter((c) => c.risk === 'critical').length}</strong></button><button type="button" onClick={() => setScope('attention')}><CircleAlert/><span>À surveiller</span><strong>{snapshot.customers.filter((c) => c.risk === 'attention').length}</strong></button><button type="button" onClick={() => setScope('outstanding')}><WalletCards/><span>Encours ouverts</span><strong>{money(snapshot.metrics.outstanding)}</strong></button><button type="button" onClick={() => setScope('dormant')}><UsersRound/><span>Dormants 90j+</span><strong>{dormant}</strong></button><button type="button" onClick={() => setScope('all')}><CheckCircle2/><span>Sans signal actif</span><strong>{clear}</strong></button></section>
    <div className={styles.healthCommandGrid}>
      <section className={styles.registryPanel}><div className={styles.registryScope}>{(['all','critical','attention','outstanding','dormant'] as const).map((key) => <button type="button" key={key} data-active={scope === key} onClick={() => setScope(key)}>{key}</button>)}</div><div className={styles.healthTable}><header><span>Client</span><span>Signal principal</span><span>Commercial</span><span>Finance</span><span>Prochaine action</span></header>{list.map((customer) => <button type="button" key={customer.id} data-risk={customer.risk} onClick={() => setSelected(customer)}><div><strong>{customer.name}</strong><small>{customer.reference} · {customer.status}</small></div><div><strong>{customer.risk}</strong><small>{customer.riskReasons.join(' · ') || 'Aucun signal actif'}</small></div><div><strong>{money(customer.capturedRevenue)}</strong><small>{customer.orderCount} commandes</small></div><div><strong>{customer.outstanding ? money(customer.outstanding) : 'À jour'}</strong><small>Credit {money(customer.walletBalance)}</small></div><span>Ouvrir et intervenir <ChevronRight size={13}/></span></button>)}{!list.length ? <div className={styles.healthyEmpty}>Aucune relation dans cette file.</div> : null}</div></section>
      <aside className={styles.customerContextRail}><section><header><span>PLAYBOOKS SOURCE-RÉELS</span></header>{snapshot.nextMoves.map((move) => <Link key={move.id} href={move.targetCustomerId ? `/angelcare-marketplace/admin/customers/${move.targetCustomerId}` : '/angelcare-marketplace/admin/customers/segments'}><i data-severity={move.severity}/><span><strong>{move.title}</strong><small>{move.detail}</small></span><ChevronRight size={13}/></Link>)}</section><section><header><span>SEGMENTS CRITIQUES</span></header>{snapshot.segments.filter((segment) => segment.severity !== 'healthy').map((segment) => <Link key={segment.key} href={`/angelcare-marketplace/admin/customers?segment=${segment.key}`}><i data-severity={segment.severity}/><span>{segment.label}</span><strong>{segment.count}</strong></Link>)}</section></aside>
    </div>
    {selected ? <RelationshipDrawerHost customer={selected} caseRecord={null} permissions={permissions} onClose={() => setSelected(null)}/> : null}
  </main>
}
