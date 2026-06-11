'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BExecutiveIntelligenceWorkspace.module.css'

type IntelligencePayload = {
  metrics: Record<string, number>
  risks: Array<{ severity: string; title: string; count: number; action: string }>
  recommendations: string[]
}

type Snapshot = {
  id: string
  snapshot_type: string
  period_start?: string | null
  period_end?: string | null
  metrics: Record<string, unknown>
  risks: unknown[]
  recommendations: unknown[]
  notes?: string | null
  created_at: string
}

type HealthResult = { table: string; ok: boolean; count: number; error: string | null }

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Non-JSON response from ${url} · HTTP ${response.status} · ${text.slice(0, 120).replace(/\s+/g, ' ')}`)
  }
  const payload = await response.json()
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed: ${url}`)
  return payload.data as T
}

function money(value: number) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(value || 0)
}

function labelKey(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function B2BExecutiveIntelligenceWorkspace() {
  const [intel, setIntel] = useState<IntelligencePayload | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [health, setHealth] = useState<HealthResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<'snapshot' | 'qa' | null>(null)
  const [notes, setNotes] = useState('')

  async function load() {
    try {
      setError(null)
      const [i, s, h] = await Promise.all([
        readJson<IntelligencePayload>('/api/b2b-partnerships/intelligence'),
        readJson<Snapshot[]>('/api/b2b-partnerships/reports/executive'),
        readJson<{ results: HealthResult[] }>('/api/b2b-partnerships/qa/health'),
      ])
      setIntel(i)
      setSnapshots(s)
      setHealth(h.results || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load executive intelligence')
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 30000)
    return () => window.clearInterval(id)
  }, [])

  const metrics = intel?.metrics || {}
  const qaScore = useMemo(() => {
    if (!health.length) return 0
    return Math.round((health.filter((h) => h.ok).length / health.length) * 100)
  }, [health])

  async function createSnapshot() {
    setBusy(true)
    try {
      const response = await fetch('/api/b2b-partnerships/reports/executive', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          snapshot_type: 'weekly',
          metrics,
          risks: intel?.risks || [],
          recommendations: intel?.recommendations || [],
          notes,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Unable to create snapshot')
      setModal(null)
      setNotes('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create snapshot')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Executive Intelligence</span>
          <h1>B2B Leadership Control Tower</h1>
          <p>Vue direction générale sur valeur pipeline, exécution terrain, risques, qualité système et décisions prioritaires.</p>
        </div>
        <div className={styles.heroActions}>
          <button onClick={() => setModal('snapshot')} className={styles.primary}>Créer snapshot exécutif</button>
          <button onClick={() => setModal('qa')} className={styles.secondary}>Ouvrir QA health</button>
          <button onClick={load} className={styles.secondary}>Resynchroniser</button>
        </div>
      </section>

      {error && <div className={styles.notice}><strong>Synchronisation à vérifier</strong><span>{error}</span></div>}

      <section className={styles.kpiGrid}>
        {Object.entries(metrics).slice(0, 10).map(([key, value]) => (
          <article key={key} className={styles.kpiCard}>
            <span>{labelKey(key)}</span>
            <strong>{key.includes('value') ? money(Number(value)) : Number(value).toLocaleString('fr-MA')}</strong>
          </article>
        ))}
      </section>

      <section className={styles.columns}>
        <article className={styles.panelLarge}>
          <div className={styles.panelHeader}><div><span>Risk desk</span><h2>Risques opérationnels prioritaires</h2></div></div>
          <div className={styles.riskList}>
            {(intel?.risks || []).length ? intel?.risks.map((risk, index) => (
              <div key={`${risk.title}-${index}`} className={styles.riskCard}>
                <b>{risk.severity}</b>
                <strong>{risk.title}</strong>
                <span>{risk.count} cas détectés</span>
                <p>{risk.action}</p>
              </div>
            )) : <div className={styles.empty}>Aucun risque critique détecté actuellement.</div>}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Recommendations</span><h2>Décisions conseillées</h2></div></div>
          <div className={styles.recommendations}>
            {(intel?.recommendations || []).map((item) => <p key={item}>{item}</p>)}
          </div>
        </article>
      </section>

      <section className={styles.columns}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Quality</span><h2>System readiness {qaScore}%</h2></div></div>
          <div className={styles.healthGrid}>
            {health.map((item) => (
              <div key={item.table} className={item.ok ? styles.healthOk : styles.healthBad}>
                <strong>{item.table}</strong>
                <span>{item.ok ? `${item.count} rows` : item.error}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Snapshots</span><h2>Archives exécutives</h2></div></div>
          <div className={styles.snapshotList}>
            {snapshots.length ? snapshots.map((s) => (
              <div key={s.id} className={styles.snapshot}>
                <strong>{s.snapshot_type}</strong>
                <span>{new Date(s.created_at).toLocaleString('fr-FR')}</span>
                <p>{s.notes || 'Snapshot exécutif enregistré.'}</p>
              </div>
            )) : <div className={styles.empty}>Aucun snapshot créé pour le moment.</div>}
          </div>
        </article>
      </section>

      {modal === 'snapshot' && (
        <div className={styles.backdrop}>
          <section className={styles.modal}>
            <header><div><span>Executive snapshot</span><h2>Créer une archive direction générale</h2><p>Capture les KPI, risques et recommandations actuels pour pilotage management.</p></div><button onClick={() => setModal(null)}>×</button></header>
            <label>Notes direction / décisions<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Décisions, risques, arbitrages, support requis..." /></label>
            <footer><button onClick={() => setModal(null)} className={styles.secondary}>Annuler</button><button disabled={busy} onClick={createSnapshot} className={styles.primary}>{busy ? 'Création...' : 'Créer snapshot'}</button></footer>
          </section>
        </div>
      )}

      {modal === 'qa' && (
        <div className={styles.backdrop}>
          <section className={styles.modalWide}>
            <header><div><span>QA Health Center</span><h2>Contrôle qualité B2B</h2><p>Vérifie les tables critiques et la disponibilité des couches opérationnelles.</p></div><button onClick={() => setModal(null)}>×</button></header>
            <div className={styles.healthGrid}>{health.map((item) => <div key={item.table} className={item.ok ? styles.healthOk : styles.healthBad}><strong>{item.table}</strong><span>{item.ok ? `${item.count} rows` : item.error}</span></div>)}</div>
            <footer><button onClick={() => setModal(null)} className={styles.primary}>Fermer</button></footer>
          </section>
        </div>
      )}
    </div>
  )
}
