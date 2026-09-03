'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { FormEvent, useState } from 'react'

type Row = Record<string, any>

export default function SanilaDemoDesk({ config, grants, inquiries, events }: { config: Row | null; grants: Row[]; inquiries: Row[]; events: Row[] }) {
  const [rows, setRows] = useState(grants)
  const [message, setMessage] = useState('')
  const [pin, setPin] = useState<string | null>(null)
  const [inquiryId, setInquiryId] = useState(String(inquiries[0]?.id || ''))
  const [policyType, setPolicyType] = useState('single_use')

  async function act(payload: Row) {
    setMessage('')
    setPin(null)
    const response = await fetch('/api/angelcare-marketplace/admin/sanila-demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const result = await response.json()
    if (!response.ok || !result.ok) { setMessage(result.error || 'Action impossible.'); return }
    if (result.pin) setPin(result.pin)
    if (result.grant) setRows((current) => [result.grant, ...current.filter((row) => row.id !== result.grant.id)])
    setMessage('Dossier Demo mis à jour.')
  }

  function confirmed(action: 'revoke' | 'regenerate_pin', grantId: string) {
    const label = action === 'revoke' ? 'révoquer définitivement ce grant' : 'invalider les sessions et régénérer le PIN'
    if (window.confirm(`Confirmer : ${label} ?`)) void act({ action, grantId })
  }

  function createGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const absoluteValue = String(values.get('absoluteExpiresAt') || '')
    const absoluteExpiresAt = absoluteValue ? new Date(absoluteValue).toISOString() : null
    void act({ action: 'create_grant', publicInquiryId: inquiryId, policyType, maxUses: values.get('maxUses'), activationDurationMinutes: values.get('activationDurationMinutes'), absoluteExpiresAt, notes: values.get('notes') })
  }

  return (
    <main style={{ padding: 'clamp(24px,4vw,56px)', background: '#f6f9fc', minHeight: '100vh', color: '#17324d' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'end', marginBottom: 26 }}>
        <div><div style={{ fontSize: 11, letterSpacing: '.16em', fontWeight: 900, color: '#59748b' }}>SANILA · DEMO DESK</div><h1 style={{ margin: '10px 0 6px' }}>Accès Master Demo</h1><p style={{ margin: 0, color: '#718398' }}>Qualification, approbation formelle et accès contrôlé au même établissement.</p></div>
        <Link href="/angelcare-marketplace/admin/public-inquiries" style={{ color: '#174b73', fontWeight: 800 }}>Retour aux inquiries</Link>
      </header>
      {message ? <div role="status" style={{ padding: 12, background: '#eaf4ff', border: '1px solid #b9d5ec', borderRadius: 10, marginBottom: 16 }}>{message}</div> : null}
      {pin ? <div style={{ padding: 16, background: '#fff8dd', border: '1px solid #e3c56f', borderRadius: 12, marginBottom: 16 }}><strong>PIN affiché une seule fois :</strong> <code style={{ fontSize: 20, letterSpacing: '.16em' }}>{pin}</code></div> : null}
      <section style={{ background: '#fff', border: '1px solid #dce6ef', borderRadius: 16, padding: 18, marginBottom: 20 }}><strong>SANILA MASTER DEMO</strong><div style={{ marginTop: 8, color: '#61788e', fontSize: 13 }}>{config ? `École ${config.school_id} · Seed ${config.seed_version} · Accès ${config.access_status} · Sécurité ${config.safety_status} · ${config.billing_mode}` : 'Aucune configuration Master Demo provisionnée.'}</div></section>

      <form onSubmit={createGrant} style={{ background: '#fff', border: '1px solid #dce6ef', borderRadius: 16, padding: 18, marginBottom: 24, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Créer un grant depuis une inquiry</h2>
        <label>Inquiry<select required value={inquiryId} onChange={(event) => setInquiryId(event.target.value)}><option value="">Sélectionner</option>{inquiries.map((row) => <option key={row.id} value={row.id}>{row.public_reference} · {row.full_name} · {row.status}</option>)}</select></label>
        <label>Politique<select value={policyType} onChange={(event) => setPolicyType(event.target.value)}><option value="single_use">Usage unique</option><option value="n_uses">N usages</option><option value="unlimited">Illimité</option></select></label>
        {policyType === 'n_uses' ? <label>Nombre d’usages<input name="maxUses" type="number" min="1" max="100" defaultValue="3" required /></label> : null}
        <label>Durée après activation (minutes)<input name="activationDurationMinutes" type="number" min="1" placeholder="720" /></label>
        <label>Expiration fixe<input name="absoluteExpiresAt" type="datetime-local" /></label>
        <label>Notes<input name="notes" maxLength={1000} /></label>
        <button type="submit" disabled={!config || !inquiryId}>CRÉER LE GRANT</button>
      </form>

      <section style={{ display: 'grid', gap: 12 }}>
        {rows.map((row) => <article key={row.id} style={{ background: '#fff', border: '1px solid #dce6ef', borderRadius: 14, padding: 16, display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><strong>{row.requester_name}</strong><span>{row.approval_state} · {row.status}</span></div>
          <small>{row.requester_email || '—'} · {row.policy_type} · {row.used_count || 0}/{row.max_uses || '∞'} usages · PIN ••••{row.pin_last4 || '—'} · expiration {row.effective_expires_at || row.absolute_expires_at || '—'}</small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" onClick={() => void act({ action: 'under_review', grantId: row.id })}>Sous revue</button><button type="button" onClick={() => void act({ action: 'needs_info', grantId: row.id })}>Informations requises</button><button type="button" onClick={() => void act({ action: 'approve', grantId: row.id })}>Approuver</button><button type="button" onClick={() => void act({ action: 'reject', grantId: row.id })}>Rejeter</button><button type="button" onClick={() => void act({ action: 'suspend', grantId: row.id })}>Suspendre</button><button type="button" onClick={() => void act({ action: 'reactivate', grantId: row.id })}>Réactiver</button><button type="button" onClick={() => { const expiry = window.prompt('Nouvelle expiration ISO (ex. 2026-10-01T18:00:00Z)'); if (expiry) void act({ action: 'extend', grantId: row.id, absoluteExpiresAt: expiry }) }}>Prolonger</button><button type="button" onClick={() => confirmed('regenerate_pin', row.id)}>Régénérer le PIN</button><button type="button" onClick={() => confirmed('revoke', row.id)}>Révoquer</button>
          </div>
        </article>)}
        {!rows.length ? <p>Aucun grant. Créez-en un depuis une inquiry publique.</p> : null}
      </section>

      <section id="audit" style={{ marginTop: 32 }}><h2>Usage et audit</h2><div style={{ display: 'grid', gap: 8 }}>{events.map((event) => <article key={event.id} style={{ background: '#fff', border: '1px solid #dce6ef', padding: 12, borderRadius: 10 }}><strong>{event.event_type}</strong> · {event.severity} · {new Date(event.created_at).toLocaleString('fr-MA')}<pre style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{JSON.stringify(event.metadata)}</pre></article>)}</div></section>
    </main>
  )
}
