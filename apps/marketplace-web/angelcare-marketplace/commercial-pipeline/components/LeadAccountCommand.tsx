"use client"

import { useState } from 'react'
import { Building2, CheckCircle2, Plus, UserPlus } from 'lucide-react'
import styles from '../commercial.module.css'

type Lead = { id: string; public_reference: string; lead_type: string; name: string; organization_name: string | null; email: string | null; phone: string | null; source: string; status: string; next_action: string | null }
type Account = { id: string; public_reference: string; account_type: string; legal_name: string; display_name: string; status: string; health_status: string }
type Envelope<T> = { data: T }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json() as Envelope<T> | { error?: { message?: string } }
  if (!response.ok || !('data' in payload)) throw new Error('error' in payload ? payload.error?.message || 'Action impossible.' : 'Action impossible.')
  return payload.data
}

export function LeadAccountCommand({ leads, accounts }: { leads: Lead[]; accounts: Account[] }) {
  const [localLeads, setLocalLeads] = useState(leads)
  const [localAccounts, setLocalAccounts] = useState(accounts)
  const [createLead, setCreateLead] = useState(false)
  const [createAccount, setCreateAccount] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadType, setLeadType] = useState('family')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadSource, setLeadSource] = useState('admin')
  const [accountName, setAccountName] = useState('')
  const [accountLegalName, setAccountLegalName] = useState('')
  const [accountType, setAccountType] = useState('prospect')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function saveLead() {
    setBusy(true); setError(null)
    try {
      const result = await request<Lead>('/api/angelcare-marketplace/crm/leads', { method: 'POST', body: JSON.stringify({ lead_type: leadType, name: leadName, email: leadEmail || null, phone: leadPhone || null, source: leadSource }) })
      setLocalLeads(current => [result, ...current]); setMessage(`Lead ${result.public_reference} créé.`); setLeadName(''); setLeadEmail(''); setLeadPhone(''); setCreateLead(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création du lead impossible.') }
    finally { setBusy(false) }
  }

  async function saveAccount() {
    setBusy(true); setError(null)
    try {
      const result = await request<Account>('/api/angelcare-marketplace/crm/accounts', { method: 'POST', body: JSON.stringify({ account_type: accountType, display_name: accountName, legal_name: accountLegalName || accountName }) })
      setLocalAccounts(current => [result, ...current]); setMessage(`Compte ${result.public_reference} créé.`); setAccountName(''); setAccountLegalName(''); setCreateAccount(false)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Création du compte impossible.') }
    finally { setBusy(false) }
  }

  return <div className={styles.shell}>
    <section className={styles.hero}>
      <div className={styles.eyebrow}>LEADS & ACCOUNTS</div>
      <h1 className={styles.title}>Identité commerciale, propriétaire et prochaine action</h1>
      <p className={styles.lead}>Le backoffice peut maintenant créer un lead ou un compte commercial réel, pas seulement afficher le pipeline.</p>
      <div className={styles.actions}>
        <button className={styles.primary} onClick={() => setCreateLead(value => !value)}><UserPlus size={15} /> Nouveau lead</button>
        <button className={styles.secondary} onClick={() => setCreateAccount(value => !value)}><Building2 size={15} /> Nouveau compte</button>
      </div>
    </section>

    {message ? <div className={styles.message}><CheckCircle2 size={15} /> {message}</div> : null}
    {error ? <div className={styles.message} style={{ background: '#fff0f1', color: '#9f2530' }}>{error}</div> : null}

    {createLead ? <section className={styles.panel}><h2>Créer un lead</h2><div className={styles.formGrid}>
      <div className={styles.field}><label>Nom</label><input className={styles.input} value={leadName} onChange={e => setLeadName(e.target.value)} /></div>
      <div className={styles.field}><label>Type</label><select className={styles.select} value={leadType} onChange={e => setLeadType(e.target.value)}><option value="family">Famille</option><option value="establishment">Établissement</option><option value="hotel">Hôtel</option><option value="clinic">Clinique</option><option value="corporate">Corporate</option><option value="partner">Partenaire</option><option value="supplier">Fournisseur</option></select></div>
      <div className={styles.field}><label>Email</label><input className={styles.input} value={leadEmail} onChange={e => setLeadEmail(e.target.value)} /></div>
      <div className={styles.field}><label>Téléphone</label><input className={styles.input} value={leadPhone} onChange={e => setLeadPhone(e.target.value)} /></div>
      <div className={styles.field}><label>Source</label><input className={styles.input} value={leadSource} onChange={e => setLeadSource(e.target.value)} /></div>
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !leadName} onClick={() => void saveLead()}>Créer le lead</button></div>
    </div></section> : null}

    {createAccount ? <section className={styles.panel}><h2>Créer un compte commercial</h2><div className={styles.formGrid}>
      <div className={styles.field}><label>Nom affiché</label><input className={styles.input} value={accountName} onChange={e => setAccountName(e.target.value)} /></div>
      <div className={styles.field}><label>Raison sociale</label><input className={styles.input} value={accountLegalName} onChange={e => setAccountLegalName(e.target.value)} /></div>
      <div className={styles.field}><label>Type</label><input className={styles.input} value={accountType} onChange={e => setAccountType(e.target.value)} /></div>
      <div className={styles.actions}><button className={styles.primary} disabled={busy || !accountName} onClick={() => void saveAccount()}>Créer le compte</button></div>
    </div></section> : null}

    <section className={styles.panel}><h2>Leads</h2><div className={styles.rows}>{localLeads.map(x => <div className={styles.row} key={x.id}><div><strong>{x.name}</strong><div className={styles.subtle}>{x.organization_name || x.lead_type}</div></div><span>{x.source}</span><span>{x.status}</span><span>{x.next_action || 'À définir'}</span><span>{x.public_reference}</span></div>)}{!localLeads.length && <div className={styles.empty}>Aucun lead réel.</div>}</div></section>
    <section className={styles.panel}><h2>Comptes</h2><div className={styles.rows}>{localAccounts.map(x => <div className={styles.row} key={x.id}><div><strong>{x.display_name}</strong><div className={styles.subtle}>{x.legal_name}</div></div><span>{x.account_type}</span><span>{x.status}</span><span className={styles.status}>{x.health_status}</span><span>{x.public_reference}</span></div>)}{!localAccounts.length && <div className={styles.empty}>Aucun compte réel.</div>}</div></section>
  </div>
}
