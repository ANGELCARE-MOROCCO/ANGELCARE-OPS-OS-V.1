'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useTransition } from 'react'

type Row = Record<string, any>

export default function OperatorDemoControl() {
  const [snapshot, setSnapshot] = useState<Row | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [operatorTenantId, setOperatorTenantId] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [schoolAdminAppUserId, setSchoolAdminAppUserId] = useState('')
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    let active = true
    fetch('/api/angelcare360/operator/demo', { cache: 'no-store' }).then(async (response) => {
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body.error || 'Chargement impossible.')
      if (active) { setSnapshot(body.snapshot); setLoaded(true) }
    }).catch((cause) => { if (active) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); setLoaded(true) } })
    return () => { active = false }
  }, [])
  function run(action: string, confirmation?: string, extra: Row = {}) { startTransition(async () => { setError(''); try { const response = await fetch('/api/angelcare360/operator/demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, configId: snapshot?.config?.id, confirmation, ...extra }) }); const body = await response.json(); if (!response.ok || !body.ok) throw new Error(body.error || 'Action impossible.'); if (body.snapshot) setSnapshot(body.snapshot); if (body.url) window.location.assign(body.url) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.') } }) }
  if (!loaded) return <main style={{ padding: 48 }}><h1>SANILA MASTER DEMO</h1><p>{error || 'Chargement du commandement opérateur…'}</p></main>
  if (!snapshot) return <main style={{ padding: 48, color: '#17324d' }}><h1>SANILA MASTER DEMO</h1><p>Aucun Master Demo actif. Liez uniquement des identifiants créés par le workflow Operator/Tenant Access.</p>{error ? <p role="alert">{error}</p> : null}<form onSubmit={(event) => { event.preventDefault(); const confirmation = window.prompt('Saisissez CLASSIFY SANILA MASTER DEMO') || ''; run('configure', confirmation, { operatorTenantId, schoolId, schoolAdminAppUserId }) }} style={{ display: 'grid', gap: 12, maxWidth: 620 }}><label>Operator tenant ID<input required value={operatorTenantId} onChange={(event) => setOperatorTenantId(event.target.value)} /></label><label>School ID<input required value={schoolId} onChange={(event) => setSchoolId(event.target.value)} /></label><label>School Admin app user ID<input required value={schoolAdminAppUserId} onChange={(event) => setSchoolAdminAppUserId(event.target.value)} /></label><button disabled={pending} type="submit">CLASSIFIER SANILA MASTER DEMO</button></form></main>
  const c = snapshot.config; const cards = [['Statut', c.access_status], ['Tenant', snapshot.tenant?.tenant_slug], ['École', snapshot.school?.name], ['School Admin', snapshot.schoolAdmin?.email || 'Non lié'], ['Seed', c.seed_version], ['Santé seed', c.seed_health], ['Dernier seed', c.seeded_at || '—'], ['Dernière vérification', c.verified_at || c.last_seed_verified_at || '—'], ['Dernier reset', c.last_reset_at || '—'], ['Reset', c.reset_status], ['Non facturable', c.billing_mode], ['Sécurité', c.safety_status], ['Grants actifs', snapshot.activeGrants], ['Sessions valides', snapshot.validSessions]]
  return <main style={{ padding: 'clamp(24px,4vw,56px)', background: '#f6f9fc', minHeight: '100vh', color: '#17324d' }}>
    <div style={{ fontSize: 11, letterSpacing: '.16em', fontWeight: 900, color: '#59748b' }}>OPERATOR · DEMO ENVIRONMENT</div><h1>SANILA MASTER DEMO</h1><p>Commandement de l’unique environnement de démonstration partagé.</p>
    {error ? <p role="alert" style={{ padding: 12, background: '#fff0ee', color: '#9b2c24' }}>{error}</p> : null}
    <section aria-label="État du Master Demo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>{cards.map(([label, value]) => <dl key={String(label)} style={{ margin: 0, padding: 16, border: '1px solid #d8e3ec', borderRadius: 12, background: 'white' }}><dt style={{ fontSize: 11, color: '#607789' }}>{label}</dt><dd style={{ margin: '6px 0 0', fontWeight: 800, overflowWrap: 'anywhere' }}>{String(value ?? '—')}</dd></dl>)}</section>
    <section aria-label="Actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
      <button disabled={pending} onClick={() => run('verify')}>VÉRIFIER</button>{c.seed_health !== 'healthy' ? <button disabled={pending} onClick={() => run('seed', window.prompt('Saisissez SEED SANILA MASTER DEMO') || '')}>SEED CANONIQUE</button> : null}<button disabled={pending} onClick={() => run('reset', window.prompt('Saisissez RESET SANILA MASTER DEMO') || '')}>RESET MASTER DEMO</button>
      {c.access_status === 'active' ? <button disabled={pending} onClick={() => run('suspend', window.prompt('Saisissez SUSPEND ALL DEMO ACCESS') || '')}>SUSPENDRE TOUS LES ACCÈS</button> : <button disabled={pending} onClick={() => run('reactivate', window.prompt('Saisissez REACTIVATE SANILA MASTER DEMO') || '')}>RÉACTIVER</button>}
      <button disabled={pending} onClick={() => run('open_internal')}>OUVRIR EN INTERNE</button><a href="#audit">VOIR L’AUDIT</a>
    </section>
    <h2 style={{ marginTop: 32 }}>Comptages canoniques</h2><pre style={{ padding: 16, overflow: 'auto', background: '#10283c', color: '#dff4ff', borderRadius: 12 }}>{JSON.stringify(snapshot.counts, null, 2)}</pre>
    <h2 id="audit" style={{ marginTop: 32 }}>Événements récents</h2><div style={{ display: 'grid', gap: 8 }}>{snapshot.events.map((event: Row) => <article key={event.id} style={{ background: 'white', border: '1px solid #d8e3ec', borderRadius: 10, padding: 12 }}><strong>{event.event_type}</strong><span style={{ marginLeft: 12, color: '#607789' }}>{new Date(event.created_at).toLocaleString('fr-MA')}</span></article>)}</div>
    <h2 style={{ marginTop: 32 }}>Resets récents</h2><div style={{ display: 'grid', gap: 8 }}>{snapshot.resets.map((reset: Row) => <article key={reset.id} style={{ background: 'white', border: '1px solid #d8e3ec', borderRadius: 10, padding: 12 }}><strong>{reset.status}</strong><span style={{ marginLeft: 12 }}>{reset.seed_version}</span><span style={{ marginLeft: 12, color: '#607789' }}>{new Date(reset.started_at).toLocaleString('fr-MA')}</span></article>)}</div>
  </main>
}
