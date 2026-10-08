"use client"

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Plus } from 'lucide-react'
import type { CommercialAccount, CommercialLead, CommercialQuote, CommercialSummary, Opportunity, OpportunityStage } from '../types'
import s from '../commercial.module.css'

type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

const stages: OpportunityStage[] = ['new', 'discovery', 'qualified', 'solution', 'proposal', 'negotiation', 'verbal_commitment', 'won', 'lost', 'on_hold']

export function CommercialCommand({ summary, leads, accounts, opportunities, quotes }: { summary: CommercialSummary; leads: CommercialLead[]; accounts: CommercialAccount[]; opportunities: Opportunity[]; quotes: CommercialQuote[] }) {
  const metrics = [['Leads', summary.leads], ['Qualifiés', summary.qualifiedLeads], ['Opportunités', summary.openOpportunities], ['Pipeline', `${summary.pipelineValue} Dh`], ['Propositions', summary.proposals], ['Négociations', summary.negotiations], ['Gagné', `${summary.wonValue} Dh`], ['Tâches en retard', summary.overdueTasks]]
  return <div className={s.shell}>
    <section className={s.hero}><div className={s.eyebrow}>REVENUE COMMAND</div><h1 className={s.title}>Du signal commercial à la preuve de gain, sans illusion de pipeline.</h1><p className={s.lead}>Leads, comptes, opportunités et devis sont désormais réellement pilotables depuis le backoffice.</p><div className={s.metrics}>{metrics.map(([label, value]) => <div className={s.metric} key={String(label)}><strong>{value}</strong><span>{label}</span></div>)}</div></section>
    <OpportunityBoard opportunities={opportunities} accounts={accounts} />
    <section className={s.panel}><h2>Pression immédiate</h2><div className={s.rows}><div className={s.row}><strong>Leads sans prochaine action</strong><span>{leads.filter(x => !x.next_action).length}</span><span>Ownership requis</span><span className={s.status}>attention</span><span>→</span></div><div className={s.row}><strong>Devis en décision</strong><span>{quotes.filter(x => ['submitted', 'negotiation'].includes(x.quote_status)).length}</span><span>Approval tracké</span><span className={s.status}>gouverné</span><span>→</span></div></div></section>
  </div>
}

export function OpportunityBoard({ opportunities, accounts = [] }: { opportunities: Opportunity[]; accounts?: CommercialAccount[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [value, setValue] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [local, setLocal] = useState(opportunities)

  async function createOpportunity() {
    setBusy(true); setError(null)
    try {
      const created = await request<Opportunity>('/api/angelcare-marketplace/crm/opportunities', { method: 'POST', body: JSON.stringify({ name, account_id: accountId || null, estimated_value: value ? Number(value) : null, next_action: nextAction || null }) })
      setLocal(current => [created, ...current]); setName(''); setValue(''); setNextAction(''); setCreateOpen(false); setMessage(`Opportunité ${created.public_reference} créée.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création impossible.') }
    finally { setBusy(false) }
  }

  async function transition(id: string, target: OpportunityStage) {
    setBusy(true); setError(null)
    try {
      const updated = await request<Opportunity>(`/api/angelcare-marketplace/crm/opportunities/${id}/transition`, { method: 'POST', body: JSON.stringify({ target, reason: `Transition depuis Opportunity Command vers ${target}.` }) })
      setLocal(current => current.map(item => item.id === id ? updated : item))
      setMessage(`${updated.public_reference} → ${updated.stage}`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Transition impossible.') }
    finally { setBusy(false) }
  }

  return <section className={s.shell}>
    <div className={s.panel}>
      <div className={s.actions}><button className={s.primary} onClick={() => setCreateOpen(value => !value)}><Plus size={15} /> Nouvelle opportunité</button></div>
      {message ? <div className={s.message}><CheckCircle2 size={15} /> {message}</div> : null}
      {error ? <div className={s.message} style={{ background: '#fff0f1', color: '#9f2530' }}>{error}</div> : null}
      {createOpen ? <div className={s.formGrid}>
        <div className={s.field}><label>Nom</label><input className={s.input} value={name} onChange={e => setName(e.target.value)} /></div>
        <div className={s.field}><label>Compte</label><select className={s.select} value={accountId} onChange={e => setAccountId(e.target.value)}><option value="">Sans compte</option>{accounts.map(account => <option value={account.id} key={account.id}>{account.display_name} · {account.public_reference}</option>)}</select></div>
        <div className={s.field}><label>Valeur estimée (Dh)</label><input className={s.input} type="number" min="0" value={value} onChange={e => setValue(e.target.value)} /></div>
        <div className={s.field}><label>Prochaine action</label><input className={s.input} value={nextAction} onChange={e => setNextAction(e.target.value)} /></div>
        <div className={s.actions}><button className={s.primary} disabled={busy || !name} onClick={() => void createOpportunity()}>Créer</button></div>
      </div> : null}
    </div>
    <div className={s.board}>{stages.map(stage => <div className={s.lane} key={stage}><h3>{stage.replace('_', ' ')}</h3>{local.filter(o => o.stage === stage).map(o => <article className={s.card} key={o.id}><strong>{o.name}</strong><div className={s.subtle}>{o.public_reference}</div><div className={s.money}>{o.estimated_value || 0} {o.currency_label}</div><div className={s.subtle}>{o.probability}% · {o.next_action || 'Prochaine action manquante'}</div><div className={s.actions}>{stage !== 'won' && stage !== 'lost' ? <select className={s.select} defaultValue="" disabled={busy} onChange={e => { const target = e.target.value as OpportunityStage; if (target) void transition(o.id, target) }}><option value="">Déplacer…</option>{stages.filter(target => target !== stage).map(target => <option value={target} key={target}>{target}</option>)}</select> : null}<ArrowRight size={14} /></div></article>)}{!local.some(o => o.stage === stage) && <div className={s.empty}>Vide</div>}</div>)}</div>
  </section>
}
