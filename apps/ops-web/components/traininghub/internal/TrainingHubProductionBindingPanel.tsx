'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

type Action = {
  key: string
  label: string
  endpoint: string
  method?: 'POST' | 'PATCH'
  body: Record<string, any>
  modules: string[]
}

const ACTIONS: Action[] = [
  { key: 'partner', label: 'Créer dossier partenaire réel', endpoint: '/api/traininghub/internal/partners', body: { name: 'Partenaire TrainingHub Production', city: 'Rabat' }, modules: ['command-center', 'partners', 'partner-dossier'] },
  { key: 'offer', label: 'Créer offre réelle', endpoint: '/api/traininghub/internal/offers', body: { organization_id: '', title: 'Offre TrainingHub partenaire', amount: 7200, participants: 10, format: 'onsite' }, modules: ['command-center', 'commercial', 'offres', 'partner-dossier'] },
  { key: 'course', label: 'Créer / publier formation', endpoint: '/api/traininghub/internal/catalogue', body: { title: 'Formation AngelCare Premium', category: 'TrainingHub', duration_hours: 3, price: 3500, status: 'published' }, modules: ['catalogue', 'categories', 'commercial', 'offres'] },
  { key: 'session', label: 'Planifier session réelle', endpoint: '/api/traininghub/internal/sessions', body: { organization_id: '', title: 'Session TrainingHub', mode: 'onsite', location: 'Site partenaire', participants: [{ full_name: 'Participant 1', role: 'Équipe partenaire' }] }, modules: ['command-center', 'sessions', 'participants', 'partner-dossier'] },
  { key: 'attendance', label: 'Valider présences', endpoint: '/api/traininghub/internal/attendance/validate', body: { session_id: '', participants: [] }, modules: ['attendance', 'sessions', 'participants', 'certificates'] },
  { key: 'certificates', label: 'Émettre certificats', endpoint: '/api/traininghub/internal/certificates/issue', body: { organization_id: '', session_id: '', participants: [{ full_name: 'Participant certifié' }] }, modules: ['certificates', 'documents', 'quality', 'refresh'] },
  { key: 'document', label: 'Publier document / preuve', endpoint: '/api/traininghub/internal/documents/publish', body: { organization_id: '', title: 'Proof kit TrainingHub', document_type: 'proof_kit' }, modules: ['documents', 'certificates', 'reports', 'partner-dossier'] },
]

export function TrainingHubProductionBindingPanel({ moduleKey, entityId }: { moduleKey: string; moduleTitle?: string; entityId?: string }) {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [selected, setSelected] = useState<Action | null>(null)
  const [payload, setPayload] = useState('{}')
  const [result, setResult] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const visible = useMemo(() => {
    const matching = ACTIONS.filter((action) => action.modules.includes(moduleKey))
    return matching.length ? matching : ACTIONS.slice(0, 4)
  }, [moduleKey])

  async function loadSnapshot() {
    const response = await fetch('/api/traininghub/internal/production/snapshot', { cache: 'no-store' })
    setSnapshot(await response.json().catch(() => null))
  }

  useEffect(() => {
    loadSnapshot().catch(() => setSnapshot(null))
  }, [])

  function open(action: Action) {
    const body = { ...action.body }
    if (entityId && !body.organization_id) body.organization_id = entityId
    setSelected(action)
    setPayload(JSON.stringify(body, null, 2))
    setResult(null)
  }

  async function run() {
    if (!selected) return
    setBusy(true)
    try {
      let body: any = {}
      try {
        body = JSON.parse(payload || '{}')
      } catch {
        setResult({ ok: false, error: 'JSON invalide.' })
        return
      }
      const response = await fetch(selected.endpoint, {
        method: selected.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setResult(await response.json().catch(() => ({})))
      await loadSnapshot()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>PRODUCTION BINDING LAYER</div>
          <h3 style={titleStyle}>Chaîne réelle connectée</h3>
          <p style={leadStyle}>Actions reliées aux tables partenaires, offres, commandes, factures, crédits, sessions, présences, certificats, documents et demandes.</p>
        </div>
        <button type="button" style={ghostButtonStyle} onClick={loadSnapshot}>Rafraîchir état</button>
      </div>

      <div style={statusGridStyle}>
        {['partners', 'proposals', 'orders', 'invoices', 'credits', 'sessions', 'participants', 'certificates', 'requests', 'documents'].map((key) => (
          <article key={key} style={statusCardStyle}><span>{key}</span><strong>{snapshot?.data?.counts?.[key] ?? 0}</strong></article>
        ))}
      </div>

      <div style={actionGridStyle}>
        {visible.map((action) => (
          <button key={action.key} type="button" style={actionButtonStyle} onClick={() => open(action)}>
            <span>{action.label}</span>
            <small>{action.endpoint}</small>
          </button>
        ))}
      </div>

      {selected ? (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalTopStyle}>
              <div>
                <div style={eyebrowStyle}>ACTION PRODUCTION</div>
                <h3 style={modalTitleStyle}>{selected.label}</h3>
              </div>
              <button type="button" style={closeButtonStyle} onClick={() => setSelected(null)}>×</button>
            </div>
            <label style={fieldStyle}>
              <span>Payload métier JSON</span>
              <textarea value={payload} onChange={(event) => setPayload(event.target.value)} style={textareaStyle} />
            </label>
            <div style={modalFooterStyle}>
              <button type="button" style={ghostButtonStyle} onClick={() => setSelected(null)}>Annuler</button>
              <button type="button" style={primaryButtonStyle} onClick={run} disabled={busy}>{busy ? 'Exécution…' : 'Exécuter workflow réel'}</button>
            </div>
            {result ? <pre style={resultStyle}>{JSON.stringify(result, null, 2)}</pre> : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

const panelStyle: CSSProperties = { display: 'grid', gap: 16, padding: 20, borderRadius: 30, background: 'linear-gradient(135deg,#ffffff 0%,#f7faff 62%,#edf4ff 100%)', border: '1px solid rgba(188,205,242,.95)', boxShadow: '0 20px 50px rgba(17,35,72,.08)' }
const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }
const eyebrowStyle: CSSProperties = { color: '#315fd8', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '6px 0 0', fontSize: 28, letterSpacing: '-.04em', color: '#0d1931' }
const leadStyle: CSSProperties = { margin: '8px 0 0', color: '#61718c', fontWeight: 850, lineHeight: 1.55, maxWidth: 920 }
const statusGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(10,minmax(0,1fr))', gap: 10 }
const statusCardStyle: CSSProperties = { display: 'grid', gap: 8, padding: 13, borderRadius: 18, background: '#fff', border: '1px solid rgba(203,216,238,.9)' }
const actionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }
const actionButtonStyle: CSSProperties = { display: 'grid', gap: 6, textAlign: 'left', cursor: 'pointer', padding: 15, borderRadius: 18, background: 'linear-gradient(180deg,#f0f5ff,#e5edff)', border: '1px solid rgba(179,197,239,1)', color: '#173b92', fontWeight: 950 }
const ghostButtonStyle: CSSProperties = { cursor: 'pointer', borderRadius: 16, padding: '12px 15px', color: '#315fd8', background: '#fff', border: '1px solid rgba(188,205,242,.95)', fontWeight: 950 }
const primaryButtonStyle: CSSProperties = { border: 0, cursor: 'pointer', borderRadius: 16, padding: '13px 16px', color: '#fff', background: 'linear-gradient(135deg,#12306d,#315fd8)', boxShadow: '0 16px 30px rgba(49,95,216,.22)', fontWeight: 950 }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'rgba(8,18,36,.48)', padding: 24 }
const modalStyle: CSSProperties = { width: 'min(980px,100%)', maxHeight: '90vh', overflow: 'auto', display: 'grid', gap: 16, padding: 24, borderRadius: 30, background: '#fff', boxShadow: '0 40px 90px rgba(10,21,39,.24)' }
const modalTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start' }
const modalTitleStyle: CSSProperties = { margin: '6px 0 0', fontSize: 30, letterSpacing: '-.04em' }
const closeButtonStyle: CSSProperties = { width: 48, height: 48, borderRadius: 18, border: '1px solid rgba(203,216,238,.95)', background: '#fff', color: '#0d1931', fontSize: 26, fontWeight: 950, cursor: 'pointer' }
const fieldStyle: CSSProperties = { display: 'grid', gap: 8, color: '#253a58', fontWeight: 950 }
const textareaStyle: CSSProperties = { width: '100%', minHeight: 240, borderRadius: 18, border: '1px solid rgba(203,216,238,.95)', padding: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#0d1931', background: '#fbfcff' }
const modalFooterStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }
const resultStyle: CSSProperties = { whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 280, padding: 14, borderRadius: 18, background: '#0d1931', color: '#dbeafe', fontSize: 12 }
