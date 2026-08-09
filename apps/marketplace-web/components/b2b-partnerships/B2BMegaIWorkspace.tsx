'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BMegaIWorkspace.module.css'

type Mode = 'imports' | 'campaigns' | 'automation'
type AnyRow = Record<string, any>

type ModalState =
  | { type: 'import' }
  | { type: 'campaign' }
  | { type: 'sequence' }
  | { type: 'rule' }
  | null

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Non-JSON response from ${url} · HTTP ${response.status} · ${text.slice(0, 110).replace(/\s+/g, ' ')}`)
  }
  const payload = await response.json()
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed: ${url}`)
  return payload.data as T
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed: ${url}`)
  return payload.data as T
}

function parseCsvRows(input: string) {
  const lines = input.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
  })
}

const defaultCsv = `name,sector,city,phone,email,decision_maker_name,decision_maker_role,priority_score\nHotel Atlas Premium,Hotel,Rabat,0600000000,contact@hotel.test,Mme Directrice,Directrice Commerciale,A\nClinique Enfant Plus,Pediatric clinic,Casablanca,0600000001,contact@clinique.test,Dr Responsable,Pédiatre,B`

export default function B2BMegaIWorkspace({ mode }: { mode: Mode }) {
  const [imports, setImports] = useState<AnyRow[]>([])
  const [campaigns, setCampaigns] = useState<AnyRow[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<AnyRow | null>(null)
  const [campaignEditForm, setCampaignEditForm] = useState({ name: '', segment: '', objective: '', status: '', target_count: '', start_at: '', end_at: '', notes: '' })

  const openCampaignEditor = (campaign: AnyRow) => {
    setSelectedCampaign(campaign)
    setCampaignEditForm({
      name: String(campaign.name || ''),
      segment: String(campaign.segment || ''),
      objective: String(campaign.objective || ''),
      status: String(campaign.status || 'Draft'),
      target_count: String(campaign.target_count ?? campaign.enrolled_count ?? ''),
      start_at: String(campaign.start_at || ''),
      end_at: String(campaign.end_at || ''),
      notes: String(campaign.notes || ''),
    })
  }

  const updateSelectedCampaign = async () => {
    if (!selectedCampaign?.id) return
    setBusy(true)
    try {
      const response = await fetch(`/api/b2b-partnerships/campaigns/${selectedCampaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignEditForm),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to update campaign')
      setSelectedCampaign(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update campaign')
    } finally {
      setBusy(false)
    }
  }

  const deleteSelectedCampaign = async () => {
    if (!selectedCampaign?.id) return
    const confirmed = window.confirm(`Delete campaign "${selectedCampaign.name || 'Untitled campaign'}"?`)
    if (!confirmed) return
    setBusy(true)
    try {
      const response = await fetch(`/api/b2b-partnerships/campaigns/${selectedCampaign.id}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to delete campaign')
      setSelectedCampaign(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete campaign')
    } finally {
      setBusy(false)
    }
  }

  const [sequences, setSequences] = useState<AnyRow[]>([])
  const [selectedSequence, setSelectedSequence] = useState<AnyRow | null>(null)
  const [rules, setRules] = useState<AnyRow[]>([])
  const [prospects, setProspects] = useState<AnyRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const [importForm, setImportForm] = useState({ name: 'Import hôtels & cliniques premium', segment: 'hospitality', default_sector: 'Hotel', default_city: '', default_priority: 'B', rows: defaultCsv, notes: '' })
  const [campaignForm, setCampaignForm] = useState({ name: 'Séquence découverte hôtels premium', segment: 'hospitality', objective: 'Créer des rendez-vous de découverte avec les décideurs familles/enfants.', status: 'Draft', target_count: '80', start_at: '', end_at: '', notes: '' })
  const [sequenceForm, setSequenceForm] = useState({ name: 'Hotel 14-day premium sequence', segment: 'hospitality', objective: 'Transformer un contact froid en échange de 15 minutes.', steps: 'Email introduction famille premium\nWhatsApp follow-up opportunité\nCall decision maker\nEmail proof/value recap\nLinkedIn soft reminder' })
  const [sequenceEditForm, setSequenceEditForm] = useState({ name: '', segment: '', objective: '', status: '', steps: '' })

  const openSequenceEditor = (sequence: AnyRow) => {
    setSelectedSequence(sequence)
    setSequenceEditForm({
      name: String(sequence.name || ''),
      segment: String(sequence.segment || ''),
      objective: String(sequence.objective || ''),
      status: String(sequence.status || 'Active'),
      steps: sequenceStepsToText(sequence),
    })
  }

  const updateSelectedSequence = async () => {
    if (!selectedSequence?.id) return
    setBusy(true)
    try {
      await postJson(`/api/b2b-partnerships/sequences/${selectedSequence.id}`, {
        ...sequenceEditForm,
        steps: parseSequenceSteps(sequenceEditForm.steps),
      })
      setSelectedSequence(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update sequence')
    } finally {
      setBusy(false)
    }
  }

  const deleteSelectedSequence = async () => {
    if (!selectedSequence?.id) return
    const confirmed = window.confirm(`Delete sequence "${selectedSequence.name || 'Untitled sequence'}"?`)
    if (!confirmed) return
    setBusy(true)
    try {
      const response = await fetch(`/api/b2b-partnerships/sequences/${selectedSequence.id}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to delete sequence')
      setSelectedSequence(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete sequence')
    } finally {
      setBusy(false)
    }
  }

  const [ruleForm, setRuleForm] = useState({ name: 'Relance priorité A inactive', trigger_key: 'priority_a_inactivity', description: 'Créer une tâche de relance lorsqu’un prospect A reste inactif.', conditions: '{"priority":"A","days_without_activity":5}', actions: '[{"type":"create_task","priority":"High","title":"Relancer priorité A inactive"}]' })

  async function load() {
    setError(null)
    try {
      const [i, c, s, r, p] = await Promise.all([
        readJson<AnyRow[]>('/api/b2b-partnerships/imports'),
        readJson<AnyRow[]>('/api/b2b-partnerships/campaigns'),
        readJson<AnyRow[]>('/api/b2b-partnerships/sequences'),
        readJson<AnyRow[]>('/api/b2b-partnerships/automation-rules'),
        readJson<AnyRow[]>('/api/b2b-partnerships/prospects?limit=120'),
      ])
      setImports(i)
      setCampaigns(c)
      setSequences(s)
      setRules(r)
      setProspects(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sync B2B execution engine.')
    }
  }

  useEffect(() => {
    load()
    if (!shouldStartAutoRefresh()) return
    const timer = window.setInterval(load, safeRefreshInterval(30000))
function legacyOpenSequenceEditor_UNUSED(sequence: AnyRow) {
    setSelectedSequence(sequence)
    setSequenceEditForm({
      name: String(sequence.name || ''),
      segment: String(sequence.segment || ''),
      objective: String(sequence.objective || ''),
      status: String(sequence.status || 'Active'),
      steps: sequenceStepsToText(sequence),
    })
  }
async function legacyUpdateSelectedSequence_UNUSED() {
    if (!selectedSequence?.id) return
    setBusy(true)
    try {
      await postJson(`/api/b2b-partnerships/sequences/${selectedSequence.id}`, {
        ...sequenceEditForm,
        steps: parseSequenceSteps(sequenceEditForm.steps),
      })
      setSelectedSequence(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update sequence')
    } finally {
      setBusy(false)
    }
  }
async function legacyDeleteSelectedSequence_UNUSED() {
    if (!selectedSequence?.id) return
    const confirmed = window.confirm(`Delete sequence "${selectedSequence.name || 'Untitled sequence'}"?`)
    if (!confirmed) return
    setBusy(true)
    try {
      const response = await fetch(`/api/b2b-partnerships/sequences/${selectedSequence.id}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to delete sequence')
      setSelectedSequence(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete sequence')
    } finally {
      setBusy(false)
    }
  }


    return () => window.clearInterval(timer)
  }, [])

  const copy = useMemo(() => {
    if (mode === 'imports') return {
      label: 'Import Hub', title: 'Import Hub prospects B2B', subtitle: 'Importer, valider, scorer et promouvoir des listes hôtels, cliniques, pédiatres et décideurs en prospects CRM exploitables.', primary: 'Nouvel import', modal: 'import' as const,
      side: 'Validation, déduplication et promotion des prospects avant exécution commerciale.'
    }
    if (mode === 'campaigns') return {
      label: 'Campaigns & Sequences', title: 'Campaigns & Sequences Engine', subtitle: 'Créer des campagnes multi-étapes, enrôler les prospects, générer les tâches de séquence et piloter les réponses.', primary: 'Créer campagne', modal: 'campaign' as const,
      side: 'Séquences email, WhatsApp, call et LinkedIn adaptées à chaque catégorie de prospect.'
    }
    return {
      label: 'Automation & Scoring', title: 'Automation & Scoring Control Tower', subtitle: 'Recalculer les scores, activer les règles, créer les tâches automatiques et surveiller les risques commerciaux.', primary: 'Créer règle', modal: 'rule' as const,
      side: 'Priorités, relances, scoring et discipline commerciale configurables.'
    }
  }, [mode])

  async function createImport() {
    setBusy(true)
    try {
      await postJson('/api/b2b-partnerships/imports', { ...importForm, rows: parseCsvRows(importForm.rows), source: 'manual_csv' })
      setModal(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create import.') }
    finally { setBusy(false) }
  }

  async function promoteImport(id: string) {
    setBusy(true)
    try { await postJson(`/api/b2b-partnerships/imports/${id}/promote`); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to promote import.') }
    finally { setBusy(false) }
  }

  async function createCampaign() {
    setBusy(true)
    try { await postJson('/api/b2b-partnerships/campaigns', campaignForm); setModal(null); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to create campaign.') }
    finally { setBusy(false) }
  }

  async function createSequence() {
    setBusy(true)
    try {
      const steps = sequenceForm.steps.split('\n').filter(Boolean).map((line, index) => ({
        step_order: index + 1,
        channel: line.toLowerCase().includes('whatsapp') ? 'WhatsApp' : line.toLowerCase().includes('call') ? 'Phone' : line.toLowerCase().includes('linkedin') ? 'LinkedIn' : 'Email',
        delay_days: index * 2,
        task_title: line,
        instructions: line,
      }))
      await postJson('/api/b2b-partnerships/sequences', { ...sequenceForm, steps })
      setModal(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create sequence.') }
    finally { setBusy(false) }
  }

  async function advanceCampaign(id: string) {
    setBusy(true)
    try { await postJson(`/api/b2b-partnerships/campaigns/${id}/advance`); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to advance campaign.') }
    finally { setBusy(false) }
  }

  async function createRule() {
    setBusy(true)
    try {
      await postJson('/api/b2b-partnerships/automation-rules', { ...ruleForm, conditions: JSON.parse(ruleForm.conditions || '{}'), actions: JSON.parse(ruleForm.actions || '[]') })
      setModal(null)
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to create rule. Check JSON conditions/actions.') }
    finally { setBusy(false) }
  }

  async function recalculate() {
    setBusy(true)
    try { await postJson('/api/b2b-partnerships/scoring'); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to recalculate scoring.') }
    finally { setBusy(false) }
  }

  async function runAutomation() {
    setBusy(true)
    try { await postJson('/api/b2b-partnerships/automation/run'); await load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to run automation.') }
    finally { setBusy(false) }
  }

  return (
    <main className={`${styles.workspace} ${mode === "campaigns" ? styles.campaignsPremiumSurface : ""}`}>
      <section className={`${styles.hero} ${styles.importsPremiumSurface}`}>
        <div>
          <span className={styles.eyebrow}>ANGELCARE B2B · {copy.label}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={() => setModal({ type: copy.modal })}>{copy.primary}</button>
            {mode === 'campaigns' && <button className={styles.secondaryButton} onClick={() => setModal({ type: 'sequence' })}>Créer séquence</button>}
            {mode === 'automation' && <button className={styles.secondaryButton} disabled={busy} onClick={recalculate}>Recalculer scoring</button>}
            {mode === 'automation' && <button className={styles.dangerButton} disabled={busy} onClick={runAutomation}>Exécuter règles</button>}
            <button className={styles.secondaryButton} onClick={load}>Synchroniser</button>
          </div>
        </div>
        <aside className={styles.sideCard}><strong>Live execution depth</strong><span>{copy.side}</span></aside>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.kpis}>
        <div className={styles.kpi}><small>Imports</small><strong>{imports.length}</strong></div>
        <div className={styles.kpi}><small>Campaigns</small><strong>{campaigns.length}</strong></div>
        <div className={styles.kpi}><small>Sequences</small><strong>{sequences.length}</strong></div>
        <div className={styles.kpi}><small>Prospects CRM</small><strong>{prospects.length}</strong></div>
      </section>

      {mode === 'imports' && <ImportsView imports={imports} promoteImport={promoteImport} busy={busy} />}
      {mode === 'campaigns' && <CampaignsView campaigns={campaigns} sequences={sequences} advanceCampaign={advanceCampaign} busy={busy} openSequenceEditor={openSequenceEditor} openCampaignEditor={openCampaignEditor} />}
      {selectedCampaign && (
        <div className={styles.campaignEditorBackdrop}>
          <section className={styles.campaignEditorModal}>
            <div className={styles.campaignEditorHeader}>
              <div>
                <span className={styles.campaignEditorEyebrow}>Campaign command record</span>
                <h2>Open & edit campaign</h2>
                <p>Review campaign identity, segment, objective, schedule and execution notes. Save updates or delete the campaign.</p>
              </div>
              <button className={styles.campaignIconButton} onClick={() => setSelectedCampaign(null)}>×</button>
            </div>

            <div className={styles.campaignEditorGrid}>
              <label>
                <span>Campaign name</span>
                <input value={campaignEditForm.name} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, name: e.target.value })} />
              </label>
              <label>
                <span>Segment</span>
                <input value={campaignEditForm.segment} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, segment: e.target.value })} />
              </label>
              <label>
                <span>Status</span>
                <select value={campaignEditForm.status} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, status: e.target.value })}>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Completed</option>
                  <option>Archived</option>
                </select>
              </label>
              <label>
                <span>Target count</span>
                <input value={campaignEditForm.target_count} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, target_count: e.target.value })} />
              </label>
              <label>
                <span>Start date</span>
                <input type="datetime-local" value={campaignEditForm.start_at} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, start_at: e.target.value })} />
              </label>
              <label>
                <span>End date</span>
                <input type="datetime-local" value={campaignEditForm.end_at} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, end_at: e.target.value })} />
              </label>
              <label className={styles.campaignEditorWide}>
                <span>Objective</span>
                <textarea value={campaignEditForm.objective} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, objective: e.target.value })} />
              </label>
              <label className={styles.campaignEditorWide}>
                <span>Notes</span>
                <textarea value={campaignEditForm.notes} onChange={(e) => setCampaignEditForm({ ...campaignEditForm, notes: e.target.value })} />
              </label>
            </div>

            <div className={styles.campaignEditorPreview}>
              <h3>Campaign execution snapshot</h3>
              <div className={styles.campaignPreviewGrid}>
                <article><span>Status</span><strong>{campaignEditForm.status || 'Draft'}</strong></article>
                <article><span>Segment</span><strong>{campaignEditForm.segment || 'Not defined'}</strong></article>
                <article><span>Target</span><strong>{campaignEditForm.target_count || '0'}</strong></article>
                <article><span>Objective</span><p>{campaignEditForm.objective || 'No objective defined yet.'}</p></article>
              </div>
            </div>

            <div className={styles.campaignEditorActions}>
              <button className={styles.dangerButton} disabled={busy} onClick={deleteSelectedCampaign}>Delete campaign</button>
              <div>
                <button className={styles.secondaryButton} disabled={busy} onClick={() => setSelectedCampaign(null)}>Cancel</button>
                <button className={styles.primaryButton} disabled={busy} onClick={updateSelectedCampaign}>Save campaign</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {selectedSequence && (
        <div className={styles.sequenceEditorBackdrop}>
          <section className={styles.sequenceEditorModal}>
            <div className={styles.sequenceEditorHeader}>
              <div>
                <span className={styles.sequenceEditorEyebrow}>Sequence command record</span>
                <h2>Edit existing sequence</h2>
                <p>Open, inspect, update or delete the selected campaign sequence without changing the backend architecture.</p>
              </div>
              <button className={styles.sequenceIconButton} onClick={() => setSelectedSequence(null)}>×</button>
            </div>

            <div className={styles.sequenceEditorGrid}>
              <label>
                <span>Sequence name</span>
                <input value={sequenceEditForm.name} onChange={(e) => setSequenceEditForm({ ...sequenceEditForm, name: e.target.value })} />
              </label>
              <label>
                <span>Segment</span>
                <input value={sequenceEditForm.segment} onChange={(e) => setSequenceEditForm({ ...sequenceEditForm, segment: e.target.value })} />
              </label>
              <label>
                <span>Status</span>
                <select value={sequenceEditForm.status} onChange={(e) => setSequenceEditForm({ ...sequenceEditForm, status: e.target.value })}>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Archived</option>
                </select>
              </label>
              <label className={styles.sequenceEditorWide}>
                <span>Objective</span>
                <textarea value={sequenceEditForm.objective} onChange={(e) => setSequenceEditForm({ ...sequenceEditForm, objective: e.target.value })} />
              </label>
              <label className={styles.sequenceEditorWide}>
                <span>Steps</span>
                <textarea value={sequenceEditForm.steps} onChange={(e) => setSequenceEditForm({ ...sequenceEditForm, steps: e.target.value })} placeholder="Email | J+0 | First contact message&#10;WhatsApp | J+2 | Short reminder&#10;Phone | J+4 | Decision maker call" />
                <small>Format: Channel | J+Delay | Task title</small>
              </label>
            </div>

            <div className={styles.sequenceEditorPreview}>
              <h3>Execution preview</h3>
              <div className={styles.sequencePreviewSteps}>
                {parseSequenceSteps(sequenceEditForm.steps).map((step) => (
                  <div key={`${step.step_order}-${step.channel}-${step.delay_days}`} className={styles.sequencePreviewStep}>
                    <b>{step.step_order}</b>
                    <span>{step.channel}</span>
                    <strong>J+{step.delay_days}</strong>
                    <p>{step.task_title}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.sequenceEditorActions}>
              <button className={styles.dangerButton} disabled={busy} onClick={deleteSelectedSequence}>Delete sequence</button>
              <div>
                <button className={styles.secondaryButton} disabled={busy} onClick={() => setSelectedSequence(null)}>Cancel</button>
                <button className={styles.primaryButton} disabled={busy} onClick={updateSelectedSequence}>Save sequence</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {mode === 'automation' && <AutomationView rules={rules} prospects={prospects} />}

      {modal?.type === 'import' && <ImportModal form={importForm} setForm={setImportForm} onClose={() => setModal(null)} onSubmit={createImport} busy={busy} />}
      {modal?.type === 'campaign' && <CampaignModal form={campaignForm} setForm={setCampaignForm} onClose={() => setModal(null)} onSubmit={createCampaign} busy={busy} />}
      {modal?.type === 'sequence' && <SequenceModal form={sequenceForm} setForm={setSequenceForm} onClose={() => setModal(null)} onSubmit={createSequence} busy={busy} />}
      {modal?.type === 'rule' && <RuleModal form={ruleForm} setForm={setRuleForm} onClose={() => setModal(null)} onSubmit={createRule} busy={busy} />}
    </main>
  )
}


function ImportsView({ imports, promoteImport, busy }: { imports: AnyRow[]; promoteImport: (id:string)=>void; busy:boolean }) {
  const [selectedImport, setSelectedImport] = useState<AnyRow | null>(null)

  const promotedCount = imports.filter((row) => String(row.status || '').toLowerCase().includes('promoted')).length
  const stagedCount = Math.max(0, imports.length - promotedCount)
  const totalRows = imports.reduce((sum, row) => sum + Number(row.total_rows || 0), 0)
  const validRows = imports.reduce((sum, row) => sum + Number(row.valid_rows || 0), 0)
  const promotedRows = imports.reduce((sum, row) => sum + Number(row.promoted_rows || 0), 0)

  return (
    <section className={styles.importsCommandLayout}>
      <div className={styles.importsCommandMain}>
        <section className={styles.importsCommandHero}>
          <div>
            <span className={styles.importsCommandEyebrow}>CSV intake command</span>
            <h2>Import batches</h2>
            <p>Contrôlez les imports hôtels, cliniques et décideurs avec validation, staging, qualité commerciale et promotion CRM.</p>
          </div>

          <div className={styles.importsHeroStats}>
            <article><span>Batches</span><strong>{imports.length}</strong></article>
            <article><span>Rows</span><strong>{totalRows}</strong></article>
            <article><span>Valid</span><strong>{validRows}</strong></article>
            <article><span>Promoted</span><strong>{promotedRows}</strong></article>
          </div>
        </section>

        <section className={styles.importBatchBoard}>
          <div className={styles.importBatchBoardHeader}>
            <div>
              <h3>Batch execution board</h3>
              <p>Chaque batch est cliquable pour inspecter son statut, ses volumes, sa readiness CRM et ses prochaines actions.</p>
            </div>
            <div className={styles.importBatchBoardPills}>
              <span>{stagedCount} staged</span>
              <span>{promotedCount} promoted</span>
            </div>
          </div>

          <div className={styles.importBatchCards}>
            {imports.map((row) => {
              const rows = Number(row.total_rows || 0)
              const valid = Number(row.valid_rows || 0)
              const promoted = Number(row.promoted_rows || 0)
              const progress = rows > 0 ? Math.min(100, Math.round((promoted / rows) * 100)) : String(row.status || '').toLowerCase().includes('promoted') ? 100 : 0

              return (
                <article key={row.id} className={styles.importBatchCard} onClick={() => setSelectedImport(row)}>
                  <div className={styles.importBatchCardTop}>
                    <div className={styles.importBatchIcon}>📥</div>
                    <span className={styles.importBatchStatus}>{row.status || 'staged'}</span>
                  </div>

                  <h3>{row.name || 'Import batch'}</h3>
                  <p>{row.segment || row.source || 'CSV prospect intake'}</p>

                  <div className={styles.importBatchMetrics}>
                    <div><span>Rows</span><strong>{rows}</strong></div>
                    <div><span>Valid</span><strong>{valid}</strong></div>
                    <div><span>Promoted</span><strong>{promoted}</strong></div>
                  </div>

                  <div className={styles.importBatchProgress}>
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  <div className={styles.importBatchCardFooter}>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedImport(row) }}>Open batch</button>
                    <button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); promoteImport(row.id) }}>Promote</button>
                  </div>
                </article>
              )
            })}

            {!imports.length && (
              <article className={styles.importBatchEmpty}>
                <div>📄</div>
                <h3>Aucun import encore</h3>
                <p>Lancez un premier import CSV pour valider les lignes et promouvoir les prospects vers le CRM.</p>
              </article>
            )}
          </div>
        </section>
      </div>

      <aside className={styles.csvStandardsCommand}>
        <div className={styles.csvStandardsHeader}>
          <span>CSV standards</span>
          <h2>Import-ready structure</h2>
          <p>Colonnes recommandées pour créer des prospects exploitables et enrichissables.</p>
        </div>

        <div className={styles.csvStandardCards}>
          <article><div>✅</div><h3>Required</h3><p>name, sector, city, phone, email</p></article>
          <article><div>👤</div><h3>Decision maker</h3><p>decision_maker_name, decision_maker_role, decision_maker_email</p></article>
          <article><div>🎯</div><h3>Commercial fit</h3><p>priority_score, potential_service_fit, opportunity_description</p></article>
          <article><div>📞</div><h3>Multi-contact ready</h3><p>Additional emails, mobile numbers and contact roles can be enriched after promotion.</p></article>
        </div>
      </aside>

      {selectedImport && (
        <div className={styles.importBatchModalBackdrop}>
          <section className={styles.importBatchModal}>
            <div className={styles.importBatchModalHeader}>
              <div>
                <span>Import batch command record</span>
                <h2>{selectedImport.name || 'Import batch'}</h2>
                <p>{selectedImport.segment || selectedImport.source || 'CSV intake'} · {selectedImport.status || 'staged'}</p>
              </div>
              <button type="button" onClick={() => setSelectedImport(null)}>×</button>
            </div>

            <div className={styles.importBatchModalMetrics}>
              <article><span>Total rows</span><strong>{Number(selectedImport.total_rows || 0)}</strong></article>
              <article><span>Valid rows</span><strong>{Number(selectedImport.valid_rows || 0)}</strong></article>
              <article><span>Promoted</span><strong>{Number(selectedImport.promoted_rows || 0)}</strong></article>
              <article><span>Status</span><strong>{selectedImport.status || 'staged'}</strong></article>
            </div>

            <div className={styles.importBatchModalGrid}>
              <article><h3>Validation readiness</h3><p>Vérifiez les colonnes obligatoires, le segment, les décideurs et la qualité des données avant promotion CRM.</p></article>
              <article><h3>CRM promotion</h3><p>La promotion transforme les lignes validées en prospects exploitables dans le pipeline B2B.</p></article>
              <article><h3>Enrichment after import</h3><p>Ajoutez ensuite plusieurs contacts, emails, mobiles, rôles, opportunités et prochaines actions dans le CRM.</p></article>
            </div>

            <div className={styles.importBatchModalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setSelectedImport(null)}>Close</button>
              <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => promoteImport(selectedImport.id)}>Promote batch</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function sequenceStepsToText(sequence: AnyRow) {
  const steps = Array.isArray(sequence.steps) ? sequence.steps : []
  return steps
    .map((step: AnyRow, index: number) => {
      const channel = step.channel || 'Email'
      const delay = step.delay_days ?? index * 2
      const title = step.task_title || step.instructions || `Step ${index + 1}`
      return `${channel} | J+${delay} | ${title}`
    })
    .join('\n')
}

function parseSequenceSteps(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim())
      const channel = parts[0] || (line.toLowerCase().includes('call') ? 'Phone' : line.toLowerCase().includes('whatsapp') ? 'WhatsApp' : 'Email')
      const delayText = parts[1] || `J+${index * 2}`
      const delay_days = Number(String(delayText).replace(/[^0-9]/g, '')) || index * 2
      const task_title = parts[2] || line
      return {
        step_order: index + 1,
        channel,
        delay_days,
        task_title,
        instructions: task_title,
      }
    })
}

function CampaignsView({ campaigns, sequences, advanceCampaign, busy, openSequenceEditor, openCampaignEditor }: { campaigns: AnyRow[]; sequences: AnyRow[]; advanceCampaign:(id:string)=>void; busy:boolean; openSequenceEditor:(sequence: AnyRow)=>void; openCampaignEditor:(campaign: AnyRow)=>void }) {
  return <section className={styles.grid}><div className={styles.panel}><div className={styles.panelHeader}><div><h2>Campaign execution</h2><p>Avancer les campagnes et générer les prochaines tâches de séquence.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>Campaign</th><th>Status</th><th>Enrolled</th><th>Objective</th><th>Action</th></tr></thead><tbody>{campaigns.map((row)=><tr key={row.id}><td><strong>{row.name}</strong><small>{row.segment}</small></td><td><span className={styles.badge}>{row.status}</span></td><td>{row.enrolled_count || 0}</td><td>{row.objective || '—'}</td><td><div className={styles.rowActions}><button disabled={busy} onClick={() => openCampaignEditor(row)}>Open / Edit</button><button className={styles.secondaryButton} disabled={busy} onClick={() => advanceCampaign(row.id)}>Advance</button></div></td></tr>)}{!campaigns.length && <tr><td colSpan={5}>Aucune campagne. Créez une séquence multi-touch.</td></tr>}</tbody></table></div></div><aside className={styles.panel}><div className={styles.panelHeader}><div><h2>Sequences</h2><p>Email, WhatsApp, call, LinkedIn par ordre d’exécution.</p></div></div><div className={styles.cards}>{sequences.map(seq=><div className={styles.card} key={seq.id}><h3>{seq.name}</h3><p>{seq.objective || seq.segment}</p><div className={styles.sequenceMeta}><span>{seq.status || 'Active'}</span><span>{Array.isArray(seq.steps) ? seq.steps.length : 0} steps</span></div><button className={styles.secondaryButton} onClick={() => openSequenceEditor(seq)}>Open / Edit</button></div>)}{!sequences.length && <div className={styles.card}><h3>Recommended 14-day rhythm</h3><p>Day 0 email, Day 2 WhatsApp, Day 4 call, Day 7 recap, Day 10 LinkedIn, Day 14 reactivation.</p></div>}</div></aside></section>
}
function AutomationView({ rules, prospects }: { rules: AnyRow[]; prospects: AnyRow[] }) {
  const top = [...prospects].sort((a,b)=>Number(b.composite_score||0)-Number(a.composite_score||0)).slice(0,8)
  return <section className={styles.grid}><div className={styles.panel}><div className={styles.panelHeader}><div><h2>Automation rules</h2><p>Règles actives pour relances, priorités, onboarding et discipline commerciale.</p></div></div><div className={styles.cards}>{rules.map(rule=><div className={styles.card} key={rule.id}><h3>{rule.name}</h3><p>{rule.description || rule.trigger_key}</p><span className={styles.badge}>{rule.is_active ? 'Active' : 'Inactive'}</span></div>)}{!rules.length && <div className={styles.card}><h3>No rules</h3><p>Create your first automation rule.</p></div>}</div></div><aside className={styles.panel}><div className={styles.panelHeader}><div><h2>Top scored prospects</h2><p>Priorité calculée par fit, urgence, décision et revenus.</p></div></div><div className={styles.cards}>{top.map(p=><div className={styles.card} key={p.id}><h3>{p.name}</h3><p>{p.sector} · {p.city || '—'}</p><span className={styles.badge}>Score {p.composite_score || 0}</span></div>)}{!top.length && <div className={styles.card}><h3>No scored prospects</h3><p>Run scoring after importing or creating prospects.</p></div>}</div></aside></section>
}
function ModalShell({ title, subtitle, children, onClose, onSubmit, busy }: { title:string; subtitle:string; children:React.ReactNode; onClose:()=>void; onSubmit:()=>void; busy:boolean }) {
  return <div className={styles.modalBackdrop}><section className={styles.modal}><header className={styles.modalHeader}><div><span className={styles.eyebrow}>Corporate execution modal</span><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}>×</button></header><div className={styles.modalBody}>{children}</div><footer className={styles.modalFooter}><button className={styles.secondaryButton} onClick={onClose}>Annuler</button><button className={styles.primaryButton} disabled={busy} onClick={onSubmit}>{busy ? 'Saving…' : 'Enregistrer'}</button></footer></section></div>
}
function ImportModal({ form, setForm, onClose, onSubmit, busy }: any) { return <ModalShell title="Créer import B2B" subtitle="Importer une liste structurée et la valider avant promotion CRM." onClose={onClose} onSubmit={onSubmit} busy={busy}><div className={styles.formGrid}>{field('Nom import','name',form,setForm)}{select('Segment','segment',['hospitality','pediatric','mixed'],form,setForm)}{select('Secteur par défaut','default_sector',['Hotel','Resort','Pediatric clinic','Pediatrician','Child development center','Other'],form,setForm)}{field('Ville par défaut','default_city',form,setForm)}{select('Priorité','default_priority',['A','B','C'],form,setForm)}{field('Notes','notes',form,setForm)}{area('CSV rows','rows',form,setForm,'full')}</div></ModalShell> }
function CampaignModal({ form, setForm, onClose, onSubmit, busy }: any) { return <ModalShell title="Créer campagne" subtitle="Définir objectif, segment, cadence et période de campagne." onClose={onClose} onSubmit={onSubmit} busy={busy}><div className={styles.formGrid}>{field('Nom','name',form,setForm)}{select('Segment','segment',['hospitality','pediatric','mixed'],form,setForm)}{select('Status','status',['Draft','Active','Paused','Completed'],form,setForm)}{field('Target count','target_count',form,setForm)}{field('Start date/time','start_at',form,setForm)}{field('End date/time','end_at',form,setForm)}{area('Objective','objective',form,setForm,'full')}{area('Notes','notes',form,setForm,'full')}</div></ModalShell> }
function SequenceModal({ form, setForm, onClose, onSubmit, busy }: any) { return <ModalShell title="Créer séquence" subtitle="Chaque ligne devient une étape avec canal et tâche associée." onClose={onClose} onSubmit={onSubmit} busy={busy}><div className={styles.formGrid}>{field('Nom','name',form,setForm)}{select('Segment','segment',['hospitality','pediatric','mixed'],form,setForm)}{area('Objectif','objective',form,setForm,'full')}{area('Étapes','steps',form,setForm,'full')}</div></ModalShell> }
function RuleModal({ form, setForm, onClose, onSubmit, busy }: any) { return <ModalShell title="Créer règle automation" subtitle="Conditions JSON et actions JSON pour automatiser relances et discipline." onClose={onClose} onSubmit={onSubmit} busy={busy}><div className={styles.formGrid}>{field('Nom','name',form,setForm)}{field('Trigger key','trigger_key',form,setForm)}{area('Description','description',form,setForm,'full')}{area('Conditions JSON','conditions',form,setForm,'full')}{area('Actions JSON','actions',form,setForm,'full')}</div></ModalShell> }
function field(label:string, key:string, form:any, setForm:any, cls='') { return <label className={`${styles.field} ${cls ? styles[cls] : ''}`}><span>{label}</span><input value={form[key] || ''} onChange={e=>setForm((f:any)=>({...f,[key]:e.target.value}))}/></label> }
function area(label:string, key:string, form:any, setForm:any, cls='') { return <label className={`${styles.field} ${cls ? styles[cls] : ''}`}><span>{label}</span><textarea value={form[key] || ''} onChange={e=>setForm((f:any)=>({...f,[key]:e.target.value}))}/></label> }
function select(label:string, key:string, options:string[], form:any, setForm:any) { return <label className={styles.field}><span>{label}</span><select value={form[key] || options[0]} onChange={e=>setForm((f:any)=>({...f,[key]:e.target.value}))}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label> }
