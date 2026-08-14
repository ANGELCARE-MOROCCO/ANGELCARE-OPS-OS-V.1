"use client"

import { useState } from 'react'
import { CheckCircle2, FilePlus2 } from 'lucide-react'
import type { CommercialQuote, Opportunity } from '../types'
import s from '../commercial.module.css'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

export function QuoteRegistry({ quotes, opportunities }: { quotes: CommercialQuote[]; opportunities: Opportunity[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [opportunityId, setOpportunityId] = useState(opportunities[0]?.id || '')
  const [subtotal, setSubtotal] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [validUntil, setValidUntil] = useState('')
  const [terms, setTerms] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [local, setLocal] = useState(quotes)

  async function createQuote() {
    setBusy(true); setError(null)
    const subtotalValue = Number(subtotal || 0)
    const discountValue = Number(discount || 0)
    const taxValue = Number(tax || 0)
    try {
      const created = await request<CommercialQuote>('/api/angelcare-marketplace/crm/quotes', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: opportunityId,
          subtotal: subtotalValue,
          discount_total: discountValue,
          tax_total: taxValue,
          grand_total: Math.max(0, subtotalValue - discountValue + taxValue),
          valid_until: validUntil || null,
          terms: terms || null,
        }),
      })
      setLocal(current => [created, ...current]); setCreateOpen(false); setSubtotal(''); setDiscount('0'); setTax('0'); setTerms(''); setMessage(`Devis ${created.public_reference} créé.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
    finally { setBusy(false) }
  }

  return <div className={s.shell}>
    <section className={s.hero}><div className={s.eyebrow}>QUOTE & PROOF COMMAND</div><h1 className={s.title}>Devis versionnés, approbation et preuve commerciale</h1><p className={s.lead}>Les remises, totaux, validités, statuts et approbations sont maintenant alimentés par une vraie action de création depuis l’administration.</p><div className={s.actions}><button className={s.primary} onClick={() => setCreateOpen(value => !value)}><FilePlus2 size={15} /> Nouveau devis</button></div></section>
    {message ? <div className={s.message}><CheckCircle2 size={15} /> {message}</div> : null}
    {error ? <div className={s.message} style={{ background: '#fff0f1', color: '#9f2530' }}>{error}</div> : null}
    {createOpen ? <section className={s.panel}><h2>Créer une nouvelle version de devis</h2><div className={s.formGrid}>
      <div className={s.field}><label>Opportunité</label><select className={s.select} value={opportunityId} onChange={e => setOpportunityId(e.target.value)}>{opportunities.map(item => <option value={item.id} key={item.id}>{item.public_reference} · {item.name}</option>)}</select></div>
      <div className={s.field}><label>Sous-total</label><input className={s.input} type="number" min="0" value={subtotal} onChange={e => setSubtotal(e.target.value)} /></div>
      <div className={s.field}><label>Remise</label><input className={s.input} type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
      <div className={s.field}><label>Taxe</label><input className={s.input} type="number" min="0" value={tax} onChange={e => setTax(e.target.value)} /></div>
      <div className={s.field}><label>Valide jusqu’au</label><input className={s.input} type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} /></div>
      <div className={s.field}><label>Termes</label><input className={s.input} value={terms} onChange={e => setTerms(e.target.value)} /></div>
      <div className={s.actions}><button className={s.primary} disabled={busy || !opportunityId} onClick={() => void createQuote()}>Créer le devis</button></div>
    </div></section> : null}
    <section className={s.panel}><div className={s.rows}>{local.map(q => <div className={s.row} key={q.id}><div><strong>{q.public_reference}</strong><div className={s.subtle}>Version {q.version}</div></div><span>{q.quote_status}</span><span>{q.grand_total} {q.currency_label}</span><span className={s.status}>{q.approval_status}</span><span>{q.valid_until || 'Sans date'}</span></div>)}{!local.length && <div className={s.empty}>Aucun devis réel.</div>}</div></section>
  </div>
}
