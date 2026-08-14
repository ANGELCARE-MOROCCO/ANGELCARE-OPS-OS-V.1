"use client"

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Plus, UserRound } from 'lucide-react'
import styles from '../provider.module.css'
import type { ProviderProfile, ProviderSummary } from '../types'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

export function ProviderCommand({ summary, providers }: { summary: ProviderSummary; providers: ProviderProfile[] }) {
  const [localProviders, setLocalProviders] = useState(providers)
  const [createOpen, setCreateOpen] = useState(false)
  const [providerType, setProviderType] = useState('individual')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [services, setServices] = useState('childcare')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function createProvider() {
    setBusy(true); setError(null)
    try {
      const created = await request<ProviderProfile>('/api/angelcare-marketplace/providers', {
        method: 'POST',
        body: JSON.stringify({ providerType, displayName, email: email || null, phone: phone || null, territoryId: null, serviceCategories: services.split(',').map(value => value.trim()).filter(Boolean) }),
      })
      setLocalProviders(current => [created, ...current]); setMessage(`Provider ${created.public_reference} créé et placé en onboarding.`)
      setDisplayName(''); setEmail(''); setPhone(''); setCreateOpen(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création provider impossible.') }
    finally { setBusy(false) }
  }

  return <div className={styles.shell}>
    <section className={styles.hero}><div><div className={styles.eyebrow}>PROVIDER WORKFORCE COMMAND</div><h1 className={styles.title}>Une force opérationnelle qualifiée, disponible et explicable.</h1><p className={styles.copy}>Création et onboarding réels depuis l’administration, puis contrôle documentaire, disponibilité et éligibilité.</p><div className={styles.actions}><button className={styles.primary} onClick={() => setCreateOpen(value => !value)}><Plus size={15} /> Nouveau provider</button></div></div><div className={styles.heroMark}><strong>{summary.eligible}</strong><span>providers éligibles · {summary.blocked} bloqués</span></div></section>
    {message ? <div style={{ padding: 12, borderRadius: 11, background: '#eef9f3', color: '#176243', fontSize: 12 }}><CheckCircle2 size={15} /> {message}</div> : null}
    {error ? <div style={{ padding: 12, borderRadius: 11, background: '#fff0f1', color: '#9f2530', fontSize: 12 }}>{error}</div> : null}
    {createOpen ? <section className={styles.panel}><div className={styles.panelHead}><h2>Créer un provider</h2></div><div className={styles.formGrid}>
      <div className={styles.field}><label>Type</label><select className={styles.input} value={providerType} onChange={e => setProviderType(e.target.value)}><option value="individual">Individuel</option><option value="agency">Agence</option><option value="partner">Partenaire</option></select></div>
      <div className={styles.field}><label>Nom</label><input className={styles.input} value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
      <div className={styles.field}><label>Email</label><input className={styles.input} value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className={styles.field}><label>Téléphone</label><input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} /></div>
      <div className={styles.field}><label>Services</label><input className={styles.input} value={services} onChange={e => setServices(e.target.value)} /></div>
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !displayName} onClick={() => void createProvider()}><UserRound size={14} /> Créer</button></div>
    </div></section> : null}
    <section className={styles.metricGrid}>{[['Total', summary.total], ['Onboarding', summary.onboarding], ['Éligibles', summary.eligible], ['Documents à échéance', summary.documentsExpiring], ['Payables à revoir', summary.payablePending]].map(([label, value]) => <div className={styles.metric} key={String(label)}><small>{label}</small><strong>{Number(value)}</strong></div>)}</section>
    <section className={styles.panel}><div className={styles.panelHead}><h2>Portefeuille providers</h2><Link href="/angelcare-marketplace/admin/providers/eligibility">Ouvrir l’éligibilité</Link></div><div className={styles.panelBody}><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Provider</th><th>Type</th><th>Onboarding</th><th>Services</th><th>Zones</th><th>Action</th></tr></thead><tbody>{localProviders.slice(0, 100).map(p => <tr key={p.id}><td><strong>{p.display_name}</strong><br /><small>{p.public_reference}</small></td><td>{p.provider_type}</td><td>{p.onboarding_status}</td><td>{p.service_categories.join(', ')}</td><td>{p.operational_zones.join(', ') || 'À configurer'}</td><td><Link href={`/angelcare-marketplace/admin/providers/dossiers/${p.id}`}>Dossier 360 →</Link></td></tr>)}</tbody></table></div></div></section>
  </div>
}
