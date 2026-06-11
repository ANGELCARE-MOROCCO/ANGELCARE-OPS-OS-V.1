'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BEnterpriseIntegrationHub.module.css'

type Prospect = { id:string; name:string; sector?:string; city?:string; phone?:string; email?:string; decision_maker_name?:string; decision_maker_phone?:string; decision_maker_email?:string; priority_score?:string; status?:string; next_action?:string; next_follow_up_at?:string }
type Template = { id:string; name?:string; title?:string; channel?:string; category?:string; subject?:string; body?:string; message_body?:string; segment?:string; is_active?:boolean }
type TimelineRow = { id:string; type:string; title:string; description?:string; created_at?:string; source:string }
type ConfigItem = { id?:string; config_group:string; config_key:string; label:string; value?:any; description?:string; sort_order?:number; is_active?:boolean }

type DirectForm = {
  action_channel: 'Email' | 'WhatsApp' | 'Phone' | 'LinkedIn'
  prospect_id: string
  contact_id: string
  template_id: string
  recipient_name: string
  recipient_phone: string
  recipient_email: string
  subject: string
  message_body: string
  outcome: string
  next_follow_up_at: string
  create_follow_up_task: boolean
  follow_up_start_at: string
  follow_up_end_at: string
  reminder_at: string
  follow_up_title: string
  next_action: string
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const type = response.headers.get('content-type') || ''
  if (!type.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Non-JSON response from ${url} · HTTP ${response.status} · ${text.slice(0, 90).replace(/\s+/g, ' ')}`)
  }
  const payload = await response.json()
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Request failed: ${url}`)
  return payload.data as T
}

function nowLocalPlus(days = 0) {
  const d = new Date(Date.now() + days * 86400000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function renderTemplate(text: string, prospect?: Prospect) {
  if (!prospect) return text
  return text
    .replaceAll('{{prospect_name}}', prospect.name || '')
    .replaceAll('{{company_name}}', prospect.name || '')
    .replaceAll('{{city}}', prospect.city || '')
    .replaceAll('{{decision_maker_name}}', prospect.decision_maker_name || 'Madame, Monsieur')
    .replaceAll('{{sector}}', prospect.sector || '')
    .replaceAll('{{next_step}}', prospect.next_action || 'un échange de 15 minutes')
}

function channelHref(form: DirectForm) {
  if (form.action_channel === 'Phone' && form.recipient_phone) return `tel:${form.recipient_phone}`
  if (form.action_channel === 'WhatsApp' && form.recipient_phone) return `https://wa.me/${form.recipient_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(form.message_body)}`
  if (form.action_channel === 'Email' && form.recipient_email) return `mailto:${form.recipient_email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.message_body)}`
  return ''
}

const blankForm: DirectForm = { action_channel:'Email', prospect_id:'', contact_id:'', template_id:'', recipient_name:'', recipient_phone:'', recipient_email:'', subject:'', message_body:'', outcome:'Prepared', next_follow_up_at:'', create_follow_up_task:true, follow_up_start_at:'', follow_up_end_at:'', reminder_at:'', follow_up_title:'', next_action:'' }

export default function B2BEnterpriseIntegrationHub() {
  const [prospects,setProspects] = useState<Prospect[]>([])
  const [templates,setTemplates] = useState<Template[]>([])
  const [config,setConfig] = useState<ConfigItem[]>([])
  const [selected,setSelected] = useState<Prospect | null>(null)
  const [timeline,setTimeline] = useState<TimelineRow[]>([])
  const [modal,setModal] = useState<'direct'|'task'|null>(null)
  const [form,setForm] = useState<DirectForm>(blankForm)
  const [error,setError] = useState<string | null>(null)
  const [busy,setBusy] = useState(false)

  async function load() {
    try {
      setError(null)
      const [p,t,c] = await Promise.all([
        readJson<Prospect[]>('/api/b2b-partnerships/prospects?limit=120'),
        readJson<Template[]>('/api/b2b-partnerships/templates').catch(() => []),
        readJson<ConfigItem[]>('/api/b2b-partnerships/config').catch(() => []),
      ])
      setProspects(p)
      setTemplates(t)
      setConfig(c)
      if (!selected && p[0]) setSelected(p[0])
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load integration hub') }
  }

  async function loadTimeline(prospectId: string) {
    try { setTimeline(await readJson<TimelineRow[]>(`/api/b2b-partnerships/prospects/${prospectId}/timeline`)) } catch { setTimeline([]) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (selected?.id) loadTimeline(selected.id) }, [selected?.id])

  const taskStatuses = config.filter((x) => x.config_group === 'task_status')
  const selectedTemplates = useMemo(() => templates.filter((x) => !form.action_channel || String(x.channel || '').toLowerCase().includes(form.action_channel.toLowerCase()) || String(x.category || '').toLowerCase().includes(form.action_channel.toLowerCase())), [templates, form.action_channel])

  function openDirect(channel: DirectForm['action_channel'], prospect: Prospect) {
    setSelected(prospect)
    setForm({ ...blankForm, action_channel: channel, prospect_id: prospect.id, recipient_name: prospect.decision_maker_name || prospect.name, recipient_phone: prospect.decision_maker_phone || prospect.phone || '', recipient_email: prospect.decision_maker_email || prospect.email || '', next_follow_up_at: nowLocalPlus(3), follow_up_start_at: nowLocalPlus(3), follow_up_end_at: nowLocalPlus(3), reminder_at: nowLocalPlus(2), follow_up_title: `Relance ${channel} · ${prospect.name}`, next_action: `Relancer ${prospect.name}` })
    setModal('direct')
  }

  function applyTemplate(id: string) {
    const tpl = templates.find((x) => x.id === id)
    const prospect = prospects.find((x) => x.id === form.prospect_id) || selected || undefined
    const subject = renderTemplate(tpl?.subject || tpl?.title || '', prospect)
    const body = renderTemplate(tpl?.body || tpl?.message_body || '', prospect)
    setForm((f) => ({ ...f, template_id:id, subject: subject || f.subject, message_body: body || f.message_body }))
  }

  async function submitDirect() {
    setBusy(true)
    try {
      const res = await fetch('/api/b2b-partnerships/direct-actions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Unable to log direct action')
      setModal(null)
      await loadTimeline(form.prospect_id)
    } catch(e) { setError(e instanceof Error ? e.message : 'Unable to log direct action') } finally { setBusy(false) }
  }

  return <div className={styles.workspace}>
    <section className={styles.hero}>
      <div>
        <span className={styles.pill}>MEGA H · Enterprise integration</span>
        <h1>Direct actions, timeline & configurable execution</h1>
        <p>Unifie appels, emails, WhatsApp, templates français, tâches planifiées, relances et historique prospect dans une couche corporate exploitable par l’équipe B2B.</p>
      </div>
      <div className={styles.heroActions}>
        <button onClick={() => selected && openDirect('Email', selected)}>Préparer email</button>
        <button onClick={() => selected && openDirect('WhatsApp', selected)}>Préparer WhatsApp</button>
        <button onClick={() => selected && openDirect('Phone', selected)}>Log appel</button>
      </div>
    </section>

    {error && <div className={styles.alert}><strong>Synchronisation à vérifier</strong><span>{error}</span><button onClick={load}>Réessayer</button></div>}

    <section className={styles.grid}>
      <aside className={styles.prospectPanel}>
        <div className={styles.panelHeader}><span>Prospects actifs</span><strong>{prospects.length}</strong></div>
        <div className={styles.prospectList}>{prospects.map((p) => <button key={p.id} className={`${styles.prospectCard} ${selected?.id===p.id ? styles.selected : ''}`} onClick={() => setSelected(p)}>
          <strong>{p.name}</strong><span>{p.sector || '—'} · {p.city || '—'}</span><em>{p.status || 'New'} · Priorité {p.priority_score || 'B'}</em>
        </button>)}</div>
      </aside>

      <main className={styles.commandPanel}>
        {selected ? <>
          <div className={styles.selectedHeader}>
            <div><span>Prospect command card</span><h2>{selected.name}</h2><p>{selected.sector || 'Secteur non renseigné'} · {selected.city || 'Ville non renseignée'}</p></div>
            <div className={styles.directButtons}>
              <button onClick={() => openDirect('Phone', selected)}>📞 Call</button>
              <button onClick={() => openDirect('Email', selected)}>✉️ Email</button>
              <button onClick={() => openDirect('WhatsApp', selected)}>💬 WhatsApp</button>
              <button onClick={() => openDirect('LinkedIn', selected)}>🔗 LinkedIn</button>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div><span>Décideur</span><strong>{selected.decision_maker_name || 'À identifier'}</strong></div>
            <div><span>Email</span><strong>{selected.decision_maker_email || selected.email || '—'}</strong></div>
            <div><span>Téléphone</span><strong>{selected.decision_maker_phone || selected.phone || '—'}</strong></div>
            <div><span>Prochaine action</span><strong>{selected.next_action || 'Définir une action'}</strong></div>
          </div>

          <section className={styles.timelineSection}>
            <div className={styles.sectionTitle}><span>Timeline unifiée</span><button onClick={() => selected.id && loadTimeline(selected.id)}>Rafraîchir</button></div>
            <div className={styles.timeline}>{timeline.length ? timeline.map((row) => <article key={row.id}><span>{row.source}</span><strong>{row.title}</strong><p>{row.description || '—'}</p><small>{row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—'}</small></article>) : <div className={styles.empty}>Aucune activité consolidée pour ce prospect. Lancez un appel, email ou WhatsApp pour alimenter l’historique.</div>}</div>
          </section>
        </> : <div className={styles.empty}>Aucun prospect chargé.</div>}
      </main>

      <aside className={styles.configPanel}>
        <div className={styles.panelHeader}><span>Configuration live</span><strong>{config.length}</strong></div>
        <div className={styles.configList}>{taskStatuses.slice(0,8).map((item) => <div key={`${item.config_group}-${item.config_key}`}><strong>{item.label}</strong><span>{item.description || item.config_key}</span></div>)}</div>
      </aside>
    </section>

    {modal === 'direct' && <div className={styles.modalBackdrop}>
      <section className={styles.megaModal}>
        <header><div><span>Action directe prospect</span><h2>{form.action_channel} · {selected?.name}</h2><p>Choisissez un template, ajustez le message, ouvrez le canal direct et journalisez l’action avec relance.</p></div><button onClick={() => setModal(null)}>×</button></header>
        <div className={styles.modalGrid}>
          <label>Canal<select value={form.action_channel} onChange={(e)=>setForm({...form,action_channel:e.target.value as DirectForm['action_channel']})}><option>Email</option><option>WhatsApp</option><option>Phone</option><option>LinkedIn</option></select></label>
          <label>Template<select value={form.template_id} onChange={(e)=>applyTemplate(e.target.value)}><option value="">Sélectionner un script/template</option>{selectedTemplates.map((t)=><option key={t.id} value={t.id}>{t.name || t.title || t.category}</option>)}</select></label>
          <label>Nom destinataire<input value={form.recipient_name} onChange={(e)=>setForm({...form,recipient_name:e.target.value})}/></label>
          <label>Email<input value={form.recipient_email} onChange={(e)=>setForm({...form,recipient_email:e.target.value})}/></label>
          <label>Téléphone<input value={form.recipient_phone} onChange={(e)=>setForm({...form,recipient_phone:e.target.value})}/></label>
          <label>Résultat<select value={form.outcome} onChange={(e)=>setForm({...form,outcome:e.target.value})}><option>Prepared</option><option>Sent</option><option>Called</option><option>Positive reply</option><option>No response</option><option>Meeting booked</option></select></label>
          <label className={styles.full}>Sujet<input value={form.subject} onChange={(e)=>setForm({...form,subject:e.target.value})}/></label>
          <label className={styles.full}>Message / script<textarea value={form.message_body} onChange={(e)=>setForm({...form,message_body:e.target.value})}/></label>
          <label>Relance le<input type="datetime-local" value={form.next_follow_up_at} onChange={(e)=>setForm({...form,next_follow_up_at:e.target.value})}/></label>
          <label>Début tâche<input type="datetime-local" value={form.follow_up_start_at} onChange={(e)=>setForm({...form,follow_up_start_at:e.target.value})}/></label>
          <label>Fin tâche<input type="datetime-local" value={form.follow_up_end_at} onChange={(e)=>setForm({...form,follow_up_end_at:e.target.value})}/></label>
          <label>Reminder<input type="datetime-local" value={form.reminder_at} onChange={(e)=>setForm({...form,reminder_at:e.target.value})}/></label>
        </div>
        <footer><label className={styles.check}><input type="checkbox" checked={form.create_follow_up_task} onChange={(e)=>setForm({...form,create_follow_up_task:e.target.checked})}/> Créer automatiquement une tâche de relance</label><div>{channelHref(form) && <a className={styles.secondary} href={channelHref(form)} target="_blank">Ouvrir canal</a>}<button disabled={busy} onClick={submitDirect}>{busy?'Enregistrement...':'Journaliser action'}</button></div></footer>
      </section>
    </div>}
  </div>
}
