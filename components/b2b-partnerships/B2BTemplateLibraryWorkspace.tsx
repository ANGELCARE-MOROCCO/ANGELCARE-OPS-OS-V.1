'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BTemplateLibraryWorkspace.module.css'

type Template = {
  id: string
  name: string
  category: string
  channel: string
  prospect_segment: string
  objective?: string | null
  subject?: string | null
  body: string
  short_body?: string | null
  cta?: string | null
  recommended_next_step?: string | null
  tags?: string[]
  variables?: string[]
  usage_notes?: string | null
  is_active?: boolean
  is_default?: boolean
}

type Prospect = {
  id: string
  name: string
  sector?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  decision_maker_name?: string | null
  decision_maker_email?: string | null
  decision_maker_phone?: string | null
  main_contact_name?: string | null
  status?: string | null
}

type ConfigItem = { config_key: string; label: string; value: string[] | Record<string, unknown> }

type TemplateForm = {
  name: string
  category: string
  channel: string
  prospect_segment: string
  objective: string
  subject: string
  body: string
  short_body: string
  cta: string
  recommended_next_step: string
  usage_notes: string
  tags: string
  variables: string
}

const emptyForm: TemplateForm = {
  name: '',
  category: 'Premier contact',
  channel: 'Email',
  prospect_segment: 'General',
  objective: '',
  subject: '',
  body: '',
  short_body: '',
  cta: '',
  recommended_next_step: '',
  usage_notes: '',
  tags: '',
  variables: 'prospect_name, decision_maker_name, assigned_owner',
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `Request failed: ${url}`)
  return payload.data as T
}

function listFromConfig(config: ConfigItem[], key: string, fallback: string[]) {
  const item = config.find((row) => row.config_key === key)
  return Array.isArray(item?.value) ? item.value.map(String) : fallback
}

function directWhatsApp(phone?: string | null, body?: string) {
  const clean = String(phone || '').replace(/[^0-9]/g, '')
  if (!clean) return '#'
  return `https://wa.me/${clean.startsWith('212') ? clean : clean}?text=${encodeURIComponent(body || '')}`
}

function directMail(email?: string | null, subject?: string, body?: string) {
  if (!email) return '#'
  return `mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`
}

export default function B2BTemplateLibraryWorkspace() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [config, setConfig] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState('all')
  const [segment, setSegment] = useState('all')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Template | null>(null)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [composer, setComposer] = useState<{ template: Template; prospect?: Prospect | null; rendered?: any } | null>(null)
  const [busy, setBusy] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [templateRows, prospectRows, configRows] = await Promise.all([
        readJson<Template[]>('/api/b2b-partnerships/templates'),
        readJson<Prospect[]>('/api/b2b-partnerships/prospects?limit=120'),
        readJson<ConfigItem[]>('/api/b2b-partnerships/config'),
      ])
      setTemplates(templateRows)
      setProspects(prospectRows)
      setConfig(configRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load template library.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const channels = listFromConfig(config, 'outreach_channels', ['Email', 'WhatsApp', 'Phone', 'LinkedIn'])
  const segments = listFromConfig(config, 'prospect_segments', ['Hotels & Resorts', 'Cliniques pédiatriques', 'General'])
  const categories = listFromConfig(config, 'template_categories', ['Premier contact', 'Relance', 'Call script'])

  const filtered = useMemo(() => templates.filter((tpl) => {
    const matchQuery = !query || `${tpl.name} ${tpl.body} ${tpl.subject || ''}`.toLowerCase().includes(query.toLowerCase())
    const matchChannel = channel === 'all' || tpl.channel === channel
    const matchSegment = segment === 'all' || tpl.prospect_segment === segment
    const matchCategory = category === 'all' || tpl.category === category
    return matchQuery && matchChannel && matchSegment && matchCategory
  }), [templates, query, channel, segment, category])

  const stats = {
    total: templates.length,
    email: templates.filter((t) => t.channel === 'Email').length,
    whatsapp: templates.filter((t) => t.channel === 'WhatsApp').length,
    calls: templates.filter((t) => t.channel === 'Phone').length,
    defaults: templates.filter((t) => t.is_default).length,
  }

  async function saveTemplate() {
    setBusy(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
        variables: form.variables.split(',').map((x) => x.trim()).filter(Boolean),
      }
      const response = await fetch('/api/b2b-partnerships/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to create template.')
      setForm(emptyForm)
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save template.')
    } finally {
      setBusy(false)
    }
  }

  async function prepare(template: Template, prospect?: Prospect | null) {
    setBusy(true)
    try {
      const response = await fetch('/api/b2b-partnerships/communication/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id, prospect_id: prospect?.id }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to prepare template.')
      setComposer({ template, prospect, rendered: result.data })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to prepare communication.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.kicker}>Communication Engine</span>
          <h1>Bibliothèque scripts, emails & WhatsApp</h1>
          <p>Templates français premium prêts à sélectionner selon segment prospect, canal, objectif commercial et prochaine action.</p>
          <div className={styles.actions}>
            <button onClick={() => setSelected({ id: 'new', ...emptyForm, is_active: true } as any)}>Créer template</button>
            <button onClick={loadAll} className={styles.secondary}>Synchroniser</button>
          </div>
        </div>
        <aside className={styles.heroPanel}>
          <strong>Direct actions</strong>
          <p>Call, email, WhatsApp et LinkedIn sont préparés depuis les détails prospects et loggés dans la trajectoire commerciale.</p>
        </aside>
      </section>

      {error && <section className={styles.error}><strong>À vérifier</strong><span>{error}</span><button onClick={loadAll}>Réessayer</button></section>}

      <section className={styles.statsGrid}>
        <Metric label="Templates actifs" value={stats.total} />
        <Metric label="Emails" value={stats.email} />
        <Metric label="WhatsApp" value={stats.whatsapp} />
        <Metric label="Call scripts" value={stats.calls} />
        <Metric label="Par défaut" value={stats.defaults} />
      </section>

      <section className={styles.controlBar}>
        <input placeholder="Rechercher template, objectif, message..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="all">Tous canaux</option>{channels.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={segment} onChange={(e) => setSegment(e.target.value)}><option value="all">Tous segments</option>{segments.map((x) => <option key={x}>{x}</option>)}</select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">Toutes catégories</option>{categories.map((x) => <option key={x}>{x}</option>)}</select>
      </section>

      <section className={styles.gridLayout}>
        <div className={styles.templateList}>
          {loading ? <Empty title="Chargement bibliothèque" text="Synchronisation des scripts et templates." /> : filtered.map((template) => (
            <article key={template.id} className={styles.templateCard}>
              <div className={styles.cardTop}><span>{template.channel}</span><em>{template.prospect_segment}</em></div>
              <h3>{template.name}</h3>
              <p>{template.objective || template.usage_notes || 'Template prêt pour exécution commerciale.'}</p>
              {template.subject && <small>Objet : {template.subject}</small>}
              <div className={styles.cardActions}>
                <button onClick={() => setSelected(template)}>Voir / modifier</button>
                <button onClick={() => prepare(template, prospects[0])} className={styles.secondary}>Composer</button>
              </div>
            </article>
          ))}
          {!loading && !filtered.length && <Empty title="Aucun template trouvé" text="Créez un template ou élargissez vos filtres." />}
        </div>

        <aside className={styles.prospectPanel}>
          <span className={styles.kicker}>Prospect-aware actions</span>
          <h2>Choisir prospect & lancer action</h2>
          <p>Sélectionnez un prospect pour préparer automatiquement email, WhatsApp ou script d’appel.</p>
          <div className={styles.prospectList}>
            {prospects.slice(0, 10).map((p) => (
              <div key={p.id} className={styles.prospectRow}>
                <div><strong>{p.name}</strong><small>{p.sector || 'Segment'} · {p.city || 'Ville'}</small></div>
                <div className={styles.microActions}>
                  <a href={p.phone ? `tel:${p.phone}` : '#'}>Call</a>
                  <a href={directMail(p.decision_maker_email || p.email, 'ANGELCARE x ' + p.name, '')}>Email</a>
                  <a href={directWhatsApp(p.decision_maker_phone || p.phone, 'Bonjour, je vous contacte au nom d’ANGELCARE...')} target="_blank">WhatsApp</a>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {selected && selected.id === 'new' && <TemplateModal form={form} setForm={setForm} onClose={() => setSelected(null)} onSave={saveTemplate} busy={busy} categories={categories} channels={channels} segments={segments} />}
      {selected && selected.id !== 'new' && <PreviewModal template={selected} prospects={prospects} onClose={() => setSelected(null)} onPrepare={prepare} />}
      {composer && <ComposerModal data={composer} onClose={() => setComposer(null)} />}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) { return <article className={styles.metric}><span>{label}</span><strong>{value}</strong></article> }
function Empty({ title, text }: { title: string; text: string }) { return <div className={styles.empty}><strong>{title}</strong><p>{text}</p></div> }

function TemplateModal({ form, setForm, onClose, onSave, busy, categories, channels, segments }: any) {
  const set = (key: keyof TemplateForm, value: string) => setForm((prev: TemplateForm) => ({ ...prev, [key]: value }))
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.kicker}>Template factory</span><h2>Nouveau template corporate</h2><p>Créez un script prêt à l’emploi avec objectif, CTA, variables et notes d’usage.</p></div><button onClick={onClose}>×</button></header><div className={styles.modalGrid}>
    <label>Nom<input value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
    <label>Canal<select value={form.channel} onChange={(e) => set('channel', e.target.value)}>{channels.map((x: string) => <option key={x}>{x}</option>)}</select></label>
    <label>Catégorie<select value={form.category} onChange={(e) => set('category', e.target.value)}>{categories.map((x: string) => <option key={x}>{x}</option>)}</select></label>
    <label>Segment<select value={form.prospect_segment} onChange={(e) => set('prospect_segment', e.target.value)}>{segments.map((x: string) => <option key={x}>{x}</option>)}</select></label>
    <label className={styles.wide}>Objectif<textarea value={form.objective} onChange={(e) => set('objective', e.target.value)} /></label>
    <label className={styles.wide}>Objet email<input value={form.subject} onChange={(e) => set('subject', e.target.value)} /></label>
    <label className={styles.wide}>Message principal<textarea rows={10} value={form.body} onChange={(e) => set('body', e.target.value)} /></label>
    <label>CTA<input value={form.cta} onChange={(e) => set('cta', e.target.value)} /></label>
    <label>Prochaine étape<input value={form.recommended_next_step} onChange={(e) => set('recommended_next_step', e.target.value)} /></label>
    <label className={styles.wide}>Variables<input value={form.variables} onChange={(e) => set('variables', e.target.value)} /></label>
  </div><footer><button onClick={onClose} className={styles.secondary}>Annuler</button><button onClick={onSave} disabled={busy}>{busy ? 'Enregistrement...' : 'Créer template'}</button></footer></section></div>
}

function PreviewModal({ template, prospects, onClose, onPrepare }: { template: Template; prospects: Prospect[]; onClose: () => void; onPrepare: (template: Template, prospect?: Prospect | null) => void }) {
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.kicker}>{template.channel} · {template.category}</span><h2>{template.name}</h2><p>{template.objective || 'Template prêt pour exécution.'}</p></div><button onClick={onClose}>×</button></header><div className={styles.previewBody}><h3>{template.subject || 'Sans objet'}</h3><pre>{template.body}</pre><div className={styles.pickGrid}>{prospects.slice(0, 8).map((p) => <button key={p.id} onClick={() => onPrepare(template, p)}>{p.name}<small>{p.sector || 'Segment'}</small></button>)}</div></div><footer><button onClick={onClose}>Fermer</button></footer></section></div>
}

function ComposerModal({ data, onClose }: { data: any; onClose: () => void }) {
  const prospect = data.prospect
  const body = data.rendered?.body || ''
  const subject = data.rendered?.subject || ''
  return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.kicker}>Message prêt</span><h2>{data.template.name}</h2><p>{prospect?.name || 'Prospect non sélectionné'}</p></div><button onClick={onClose}>×</button></header><div className={styles.previewBody}><input value={subject} readOnly /><textarea rows={14} value={body} readOnly /><div className={styles.directActions}><a href={directMail(prospect?.decision_maker_email || prospect?.email, subject, body)}>Ouvrir Email</a><a href={directWhatsApp(prospect?.decision_maker_phone || prospect?.phone, body)} target="_blank">Ouvrir WhatsApp</a><a href={prospect?.phone ? `tel:${prospect.phone}` : '#'}>Appeler</a></div></div><footer><button onClick={onClose}>Fermer</button></footer></section></div>
}
