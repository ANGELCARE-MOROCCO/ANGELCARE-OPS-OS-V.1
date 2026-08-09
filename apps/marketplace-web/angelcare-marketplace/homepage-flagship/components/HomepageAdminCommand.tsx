"use client"

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Activity, Archive, BarChart3, Boxes, CalendarClock, CheckCircle2, ChevronRight, Eye, FileImage, Globe2, Layers3, LayoutDashboard, Loader2, Megaphone, Monitor, MousePointerClick, Plus, RefreshCw, Save, Smartphone, Tablet, Target } from 'lucide-react'
import type { HomepageAdminData, HomepageAdminKind, HomepageAdminRecord } from '../types'
import styles from '../homepage-admin.module.css'

const tabs = [
  ['overview','Vue commandement',LayoutDashboard],['hero','Hero',Megaphone],['campaigns','Campagnes',Megaphone],['sections','Sections',Layers3],['collections','Collections',Boxes],['placements','Placements',Target],['audiences','Audiences',Activity],['territories','Territoires',Globe2],['media','Médias',FileImage],['preview','Preview',Eye],['analytics','Analytics',BarChart3],
] as const

function apiKind(mode: string): HomepageAdminKind | null {
  if (mode === 'hero' || mode === 'campaigns') return 'campaigns'
  if (mode === 'sections') return 'sections'
  if (mode === 'collections') return 'collections'
  if (mode === 'placements') return 'placements'
  if (mode === 'audiences') return 'audience-rules'
  if (mode === 'territories') return 'territory-rules'
  if (mode === 'media') return 'assets'
  return null
}

function rowsFor(data: HomepageAdminData, mode: string): HomepageAdminRecord[] {
  if (mode === 'hero' || mode === 'campaigns') return data.campaigns
  if (mode === 'sections') return data.sections
  if (mode === 'collections') return data.collections
  if (mode === 'placements') return data.placements
  if (mode === 'audiences' || mode === 'territories') return data.rules.filter((row) => mode === 'audiences' ? Boolean(row.audience) : Boolean(row.territory_id))
  if (mode === 'media') return data.assets
  return []
}


function statusOptions(mode: string): string[] {
  if (mode === 'hero' || mode === 'campaigns') return ['draft','asset_required','configured','review_pending','approved','scheduled','active','paused','expired','archived']
  if (mode === 'placements') return ['configured','eligible','scheduled','active','suppressed','expired','archived']
  return ['draft','review_pending','approved','scheduled','active','paused','archived']
}

function titleOf(row: HomepageAdminRecord): string { return String(row.title || row.name || row.campaign_key || row.section_key || row.collection_key || row.placement_key || row.rule_key || row.asset_key || row.id) }
function detailOf(row: HomepageAdminRecord): string { return String(row.subtitle || row.section_type || row.selection_method || row.audience || row.asset_type || row.locale || 'Homepage orchestration') }

export function HomepageAdminCommand({ initialData, mode }: { initialData: HomepageAdminData; mode: string }) {
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const kind = apiKind(mode)
  const rows = useMemo(() => rowsFor(data, mode), [data, mode])
  const activeCampaigns = data.campaigns.filter((row) => row.status === 'active').length
  const activeSections = data.sections.filter((row) => row.status === 'active').length
  const activeCollections = data.collections.filter((row) => row.status === 'active').length
  const clicks = data.interactions.filter((row) => String(row.event_name).includes('clicked') || String(row.event_name).includes('opened')).length

  async function refresh() {
    if (!kind) return
    setSaving(true); setMessage('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/homepage/${kind}`)
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message || 'Actualisation impossible')
      setData((current) => {
        const next = { ...current }
        if (mode === 'hero' || mode === 'campaigns') next.campaigns = json.data
        else if (mode === 'sections') next.sections = json.data
        else if (mode === 'collections') next.collections = json.data
        else if (mode === 'placements') next.placements = json.data
        else if (mode === 'media') next.assets = json.data
        else next.rules = [...current.rules.filter((row) => mode === 'audiences' ? !row.audience : !row.territory_id), ...json.data]
        return next
      })
      setMessage('Registre actualisé.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur') } finally { setSaving(false) }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!kind) return
    setSaving(true); setMessage('')
    const form = new FormData(event.currentTarget)
    const body: Record<string, unknown> = Object.fromEntries(form.entries())
    for (const key of ['priority','sort_order']) if (key in body) body[key] = Number(body[key])
    for (const key of ['conditions','outcome']) if (typeof body[key] === 'string') { try { body[key] = JSON.parse(String(body[key])) } catch { body[key] = {} } }
    if (mode === 'territories') body.territory_id = data.territoryId
    try {
      const response = await fetch(`/api/angelcare-marketplace/homepage/${kind}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message || 'Création impossible')
      event.currentTarget.reset()
      await refresh()
      setMessage('Élément créé et audité.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur') } finally { setSaving(false) }
  }

  async function changeStatus(row: HomepageAdminRecord, status: string) {
    if (!kind) return
    setSaving(true); setMessage('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/homepage/${kind}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...row, id: row.id, status }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message || 'Transition impossible')
      await refresh(); setMessage(`Statut appliqué : ${status}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur') } finally { setSaving(false) }
  }

  async function archive(row: HomepageAdminRecord) {
    if (!kind || !window.confirm(`Archiver ${titleOf(row)} ?`)) return
    setSaving(true)
    try {
      const response = await fetch(`/api/angelcare-marketplace/homepage/${kind}`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: row.id }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message || 'Archivage impossible')
      await refresh(); setMessage('Élément archivé sans suppression de données.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur') } finally { setSaving(false) }
  }

  return <div className={styles.adminUniverse}>
    <header className={styles.commandHero}>
      <div><span>ANGELCARE HOMEPAGE FLAGSHIP · MERCHANDISING AUTHORITY</span><h1>Piloter le Grand Exchange sans modifier le code.</h1><p>Campagnes, sections, collections, placements, audiences, territoires, médias, preview et preuve analytics dans un seul commandement gouverné.</p></div>
      <div className={styles.heroActions}><Link href="/angelcare-marketplace/fr" target="_blank"><Eye size={17}/>Ouvrir le storefront</Link><button type="button" onClick={refresh} disabled={saving}><RefreshCw size={17}/>Actualiser</button></div>
    </header>

    <section className={styles.metrics}>{[
      ['Campagnes actives',activeCampaigns,'publication window'],['Sections actives',activeSections,'orchestration'],['Collections actives',activeCollections,'merchandising'],['Interactions',data.interactions.length,'preuves collectées'],['Ouvertures / clics',clicks,'conversion signals'],['Catalogue',data.catalogItems.filter((item)=>item.status==='published').length,'objets publiés'],
    ].map(([label,value,hint]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</section>

    <nav className={styles.tabs}>{tabs.map(([key,label,Icon]) => <Link key={key} href={key === 'overview' ? '/angelcare-marketplace/admin/experience/homepage' : `/angelcare-marketplace/admin/experience/homepage/${key}`} data-active={mode === key}><Icon size={15}/>{label}</Link>)}</nav>

    {message ? <div className={styles.message}><CheckCircle2 size={17}/>{message}</div> : null}

    {mode === 'overview' ? <Overview data={data}/> : null}
    {mode === 'preview' ? <PreviewPanel/> : null}
    {mode === 'analytics' ? <AnalyticsPanel interactions={data.interactions}/> : null}
    {kind ? <section className={styles.workspaceGrid}><div className={styles.registry}><div className={styles.panelHead}><div><h2>{tabs.find(([key])=>key===mode)?.[1] || 'Registre'}</h2><p>{rows.length} enregistrements · publication et archivage auditables</p></div><button type="button" onClick={refresh} disabled={saving}>{saving ? <Loader2 className={styles.spin} size={16}/> : <RefreshCw size={16}/>}</button></div><div className={styles.recordList}>{rows.map((row) => <article key={row.id}><div className={styles.recordIcon}>{mode === 'media' ? <FileImage/> : mode === 'placements' ? <Target/> : mode === 'sections' ? <Layers3/> : <Megaphone/>}</div><div><h3>{titleOf(row)}</h3><p>{detailOf(row)}</p><small>{String(row.locale || 'global')} · {String(row.status || 'configured')} · {row.updated_at ? new Date(String(row.updated_at)).toLocaleString('fr-FR') : '—'}</small></div><div className={styles.rowActions}><select value={String(row.status || statusOptions(mode)[0])} onChange={(event: ChangeEvent<HTMLSelectElement>)=>changeStatus(row,event.target.value)}>{statusOptions(mode).map((status)=><option value={status} key={status}>{status}</option>)}</select><button type="button" onClick={()=>archive(row)} aria-label="Archiver"><Archive size={15}/></button></div></article>)}{!rows.length ? <div className={styles.empty}>Aucun enregistrement dans ce registre. Créez le premier élément gouverné.</div> : null}</div></div><CreatePanel mode={mode} data={data} onSubmit={submit} saving={saving}/></section> : null}
  </div>
}

function Overview({ data }: { data: HomepageAdminData }) {
  const campaign = data.campaigns.find((row)=>row.status==='active')
  return <div className={styles.overviewGrid}>
    <section className={styles.releasePanel}><div className={styles.panelHead}><div><h2>État du storefront</h2><p>La publication visible doit réunir campagne, sections, collections, catalogue et territoire.</p></div><CheckCircle2 size={24}/></div><div className={styles.gates}>{[['Hero actif',Boolean(campaign)],['Sections actives',data.sections.some((row)=>row.status==='active')],['Collections actives',data.collections.some((row)=>row.status==='active')],['Catalogue publié',data.catalogItems.some((row)=>row.status==='published')],['Médias gouvernés',data.assets.some((row)=>row.status==='active')]].map(([label,pass])=><div key={String(label)} data-pass={pass}><span>{pass?<CheckCircle2/>:<CalendarClock/>}</span><strong>{label}</strong><small>{pass?'accepté':'à compléter'}</small></div>)}</div></section>
    <section className={styles.activeCampaign}><span>CAMPAGNE PRINCIPALE</span><h2>{String(campaign?.title || 'Aucune campagne active')}</h2><p>{String(campaign?.subtitle || 'Publiez une campagne approuvée avec ses variantes desktop, tablet et mobile.')}</p><div><b>{String(campaign?.locale || '—')}</b><b>{String(campaign?.audience || '—')}</b><b>{String(campaign?.status || 'inactive')}</b></div></section>
    <section className={styles.timelinePanel}><div className={styles.panelHead}><div><h2>Publication runway</h2><p>Ordre conseillé de configuration.</p></div></div>{['Campagnes et assets','Sections et ordre','Collections et objets','Audiences et territoires','Preview FR / EN / AR','Activation et analytics'].map((step,index)=><div className={styles.timelineStep} key={step}><span>0{index+1}</span><strong>{step}</strong><ChevronRight size={16}/></div>)}</section>
  </div>
}

function PreviewPanel() { return <section className={styles.previewPanel}><div className={styles.panelHead}><div><h2>Prévisualisation multi-locale et multi-device</h2><p>Ouvrez chaque surface dans une fenêtre isolée pour la validation contractuelle.</p></div></div><div className={styles.previewGrid}>{(['fr','en','ar'] as const).map((locale)=><article key={locale}><div><Monitor size={24}/><span>{locale.toUpperCase()} · Desktop</span></div><iframe title={`Homepage ${locale}`} src={`/angelcare-marketplace/${locale}`}/><footer><Link href={`/angelcare-marketplace/${locale}`} target="_blank"><Eye size={14}/>Ouvrir</Link><span><Tablet size={14}/><Smartphone size={14}/></span></footer></article>)}</div></section> }

function AnalyticsPanel({ interactions }: { interactions: HomepageAdminRecord[] }) {
  const byEvent = new Map<string,number>(); for (const row of interactions) { const key=String(row.event_name||'unknown'); byEvent.set(key,(byEvent.get(key)||0)+1) }
  return <section className={styles.analyticsPanel}><div className={styles.panelHead}><div><h2>Signals du storefront</h2><p>Événements réels enregistrés par version, locale, territoire, campagne et objet.</p></div><MousePointerClick size={24}/></div><div className={styles.eventGrid}>{[...byEvent.entries()].sort((a,b)=>b[1]-a[1]).slice(0,16).map(([event,count])=><article key={event}><span>{event}</span><strong>{count}</strong><i><b style={{width:`${Math.min(100,count*8)}%`}}/></i></article>)}{!byEvent.size?<div className={styles.empty}>Aucune interaction enregistrée. Les événements apparaîtront après navigation réelle.</div>:null}</div></section>
}

function CreatePanel({ mode, data, onSubmit, saving }: { mode: string; data: HomepageAdminData; onSubmit: (event: FormEvent<HTMLFormElement>)=>void; saving: boolean }) {
  return <aside className={styles.createPanel}><div className={styles.panelHead}><div><h2>Créer dans {mode}</h2><p>Les données sont persistées, auditées et soumises au lifecycle.</p></div><Plus size={22}/></div><form onSubmit={onSubmit}>
    {(mode==='hero'||mode==='campaigns')?<><Field name="campaign_key" label="Clé campagne" required/><Field name="title" label="Titre commercial" required/><Field name="eyebrow" label="Eyebrow"/><TextArea name="subtitle" label="Proposition"/><div className={styles.formTwo}><Field name="primary_cta_label" label="CTA principal" required/><Field name="primary_cta_href" label="Destination" required/></div><Field name="desktop_asset_url" label="Cover desktop" required defaultValue="/angelcare-marketplace/homepage/hero-family-marketplace.svg"/><div className={styles.formTwo}><Field name="tablet_asset_url" label="Cover tablet"/><Field name="mobile_asset_url" label="Cover mobile"/></div><div className={styles.formTwo}><Select name="locale" label="Locale" options={['fr','en','ar']}/><Select name="audience" label="Audience" options={['all','family','organization','professional']}/></div><Field name="priority" label="Priorité" type="number" defaultValue="100"/></>:null}
    {mode==='sections'?<><Field name="section_key" label="Clé section" required/><Field name="title" label="Titre" required/><TextArea name="subtitle" label="Sous-titre"/><div className={styles.formTwo}><Select name="section_type" label="Type" options={['category_exchange','collection_rail','family_showcase','academy_live','b2b_exchange','partner_os','trust_authority','territory_atlas']}/><Select name="layout_variant" label="Layout" options={['mosaic','rail','showcase','command','atlas']}/></div><div className={styles.formTwo}><Select name="locale" label="Locale" options={['fr','en','ar']}/><Field name="sort_order" label="Ordre" type="number" defaultValue="100"/></div></>:null}
    {mode==='collections'?<><Field name="collection_key" label="Clé collection" required/><Field name="title" label="Titre" required/><TextArea name="subtitle" label="Sous-titre"/><div className={styles.formTwo}><Select name="selection_method" label="Méthode" options={['editorial','featured','territory','availability','newest','analytics']}/><Select name="layout_variant" label="Card family" options={['service_cards','product_cards','academy_cards','programme_cards','saas_cards']}/></div><div className={styles.formTwo}><Select name="locale" label="Locale" options={['fr','en','ar']}/><Field name="sort_order" label="Ordre" type="number" defaultValue="100"/></div></>:null}
    {mode==='placements'?<><Field name="placement_key" label="Clé placement" required/><Select name="catalog_item_id" label="Objet catalogue" options={data.catalogItems.filter((item)=>item.status==='published').map((item)=>({value:item.id,label:`${item.name_fr} · ${item.kind}`}))}/><Select name="audience" label="Audience" options={['all','family','organization','professional']}/><div className={styles.formTwo}><Select name="locale" label="Locale" options={['fr','en','ar']}/><Field name="sort_order" label="Ordre" type="number" defaultValue="100"/></div></>:null}
    {mode==='audiences'?<><Field name="rule_key" label="Clé règle" required/><Select name="audience" label="Audience" options={['family','organization','professional','returning_family','anonymous']}/><Select name="locale" label="Locale" options={['fr','en','ar']}/><TextArea name="conditions" label="Conditions JSON" defaultValue="{}"/><TextArea name="outcome" label="Outcome JSON" defaultValue="{}"/></>:null}
    {mode==='territories'?<><Field name="rule_key" label="Clé règle" required/><TextArea name="conditions" label="Conditions JSON" defaultValue="{}"/><TextArea name="outcome" label="Outcome JSON" defaultValue="{}"/><Field name="priority" label="Priorité" type="number" defaultValue="100"/></>:null}
    {mode==='media'?<><Field name="asset_key" label="Clé asset" required/><Select name="asset_type" label="Type" options={['image','video','illustration']}/><Field name="desktop_url" label="URL desktop" required/><div className={styles.formTwo}><Field name="tablet_url" label="URL tablet"/><Field name="mobile_url" label="URL mobile"/></div><Field name="arabic_url" label="Variante arabe"/><TextArea name="alt_text_fr" label="Alt FR"/><Select name="rights_status" label="Droits" options={['owned','licensed','approved','pending']}/></>:null}
    <Select name="status" label="Statut initial" options={statusOptions(mode).filter((status)=>!['paused','expired','suppressed','archived'].includes(status))}/><button type="submit" disabled={saving}>{saving?<Loader2 className={styles.spin} size={17}/>:<Save size={17}/>}Enregistrer</button>
  </form></aside>
}

function Field({name,label,type='text',required=false,defaultValue}: {name:string;label:string;type?:string;required?:boolean;defaultValue?:string}) { return <label className={styles.field}><span>{label}</span><input name={name} type={type} required={required} defaultValue={defaultValue}/></label> }
function TextArea({name,label,defaultValue}: {name:string;label:string;defaultValue?:string}) { return <label className={styles.field}><span>{label}</span><textarea name={name} defaultValue={defaultValue}/></label> }
function Select({name,label,options}: {name:string;label:string;options:Array<string|{value:string;label:string}>}) { return <label className={styles.field}><span>{label}</span><select name={name}>{options.map((option)=>typeof option==='string'?<option key={option} value={option}>{option}</option>:<option key={option.value} value={option.value}>{option.label}</option>)}</select></label> }
