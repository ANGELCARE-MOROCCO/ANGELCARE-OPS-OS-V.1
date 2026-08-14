"use client"

import { useState } from 'react'
import { CheckCircle2, Plus, Save, Truck } from 'lucide-react'
import type { Supplier } from '../types'
import s from '../marketplace.module.css'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

export function SupplierCommand({ suppliers }: { suppliers: Supplier[] }) {
  const [local, setLocal] = useState(suppliers)
  const [createOpen, setCreateOpen] = useState(false)
  const [code, setCode] = useState('')
  const [legalName, setLegalName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function createSupplier() {
    setBusy(true); setError(null)
    try {
      const created = await request<Supplier>('/api/angelcare-marketplace/admin/suppliers', { method: 'POST', body: JSON.stringify({ supplierCode: code, legalName, displayName, paymentTerms }) })
      setLocal(current => [created, ...current]); setCode(''); setLegalName(''); setDisplayName(''); setPaymentTerms(''); setCreateOpen(false); setMessage(`Fournisseur ${created.public_reference} créé.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
    finally { setBusy(false) }
  }

  async function updateSupplier(supplier: Supplier, patch: Record<string, unknown>) {
    setBusy(true); setError(null)
    try {
      const updated = await request<Supplier>(`/api/angelcare-marketplace/admin/suppliers/${supplier.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      setLocal(current => current.map(item => item.id === supplier.id ? { ...item, ...updated } : item))
      setMessage(`${updated.public_reference} mis à jour.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Mise à jour impossible.') }
    finally { setBusy(false) }
  }

  return <div className={s.shell}>
    <section className={s.hero}><div className={s.eyebrow}>SUPPLIER NETWORK</div><h1 className={s.title}>Fournisseurs, offres et qualité</h1><p className={s.lead}>Les fournisseurs ne sont plus une simple liste : création, statut commercial, qualité et conditions de paiement sont pilotables depuis le backoffice.</p><div className={s.actions}><button className={s.primary} onClick={() => setCreateOpen(value => !value)}><Plus size={15} /> Nouveau fournisseur</button></div></section>
    {message ? <div className={s.message}><CheckCircle2 size={15} /> {message}</div> : null}
    {error ? <div className={s.message} style={{ background: '#fff0f1', color: '#9f2530' }}>{error}</div> : null}
    {createOpen ? <section className={s.panel}><h2>Créer un fournisseur</h2><div className={s.formGrid}>
      <div className={s.field}><label>Code</label><input className={s.input} value={code} onChange={e => setCode(e.target.value)} /></div>
      <div className={s.field}><label>Nom affiché</label><input className={s.input} value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
      <div className={s.field}><label>Raison sociale</label><input className={s.input} value={legalName} onChange={e => setLegalName(e.target.value)} /></div>
      <div className={s.field}><label>Conditions de paiement</label><input className={s.input} value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} /></div>
      <div className={s.actions}><button className={s.primary} disabled={busy || !code || !displayName || !legalName} onClick={() => void createSupplier()}><Save size={14} /> Créer</button></div>
    </div></section> : null}
    <section className={s.grid}>{local.map(x => <article className={s.card} key={x.id}><span className={s.kind}>{x.supplier_code}</span><h3>{x.display_name}</h3><p className={s.subtle}>{x.legal_name} · {x.catalog_offer_count || 0} offres</p><div className={s.actions}><select className={s.select} value={x.status} disabled={busy} onChange={e => void updateSupplier(x, { status: e.target.value })}><option value="prospect">Prospect</option><option value="qualification">Qualification</option><option value="approved">Approuvé</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="archived">Archivé</option></select><select className={s.select} value={x.quality_status} disabled={busy} onChange={e => void updateSupplier(x, { qualityStatus: e.target.value })}><option value="unreviewed">Qualité à revoir</option><option value="pending">Qualité en attente</option><option value="approved">Qualité approuvée</option><option value="conditional">Conditionnelle</option><option value="rejected">Rejetée</option><option value="expired">Expirée</option></select><Truck size={14} /></div></article>)}{!local.length && <div className={s.empty}>Aucun fournisseur réel enregistré.</div>}</section>
  </div>
}
