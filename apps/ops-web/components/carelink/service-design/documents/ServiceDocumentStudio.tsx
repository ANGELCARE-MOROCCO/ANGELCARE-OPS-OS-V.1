'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck2,
  FileStack,
  Loader2,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DocumentPreview } from './DocumentPreview'
import { paginateServiceDocument } from './previewLayout'
import { SERVICE_DOCUMENT_SECTION_LABELS, SERVICE_DOCUMENT_TEMPLATES, getServiceDocumentTemplate } from './templateRegistry'
import { blankServiceDocumentSource } from './sourceNormalization'
import type {
  ServiceDocumentAudience,
  ServiceDocumentConfidentiality,
  ServiceDocumentDensity,
  ServiceDocumentOrientation,
  ServiceDocumentSectionKey,
  ServiceDocumentSettings,
  ServiceDocumentSource,
  ServiceDocumentSourceKind,
  ServiceDocumentTemplateId,
} from './types'

interface ServiceDocumentStudioProps {
  sourceKind?: ServiceDocumentSourceKind
  sourceId?: string
  initialSource?: ServiceDocumentSource | null
  initialTemplateId?: ServiceDocumentTemplateId
}

const audienceLabels: Record<ServiceDocumentAudience, string> = { customer: 'Client', operations: 'Opérations', commercial: 'Commercial', executive: 'Direction' }
const confidentialityLabels: Record<ServiceDocumentConfidentiality, string> = { public: 'Public', internal: 'Interne', confidential: 'Confidentiel', restricted: 'Restreint' }
const densityLabels: Record<ServiceDocumentDensity, string> = { compact: 'Compact', standard: 'Standard', detailed: 'Détaillé' }
const orientationLabels: Record<ServiceDocumentOrientation, string> = { portrait: 'Portrait', landscape: 'Paysage' }

function cls(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' ') }
function titleForKind(kind: ServiceDocumentSourceKind) {
  return kind === 'plan' ? 'Production documentaire du plan technique' : kind === 'sellable' ? 'Production documentaire du sellable' : kind === 'handoff' ? 'Production documentaire CARELINK' : kind === 'executive' ? 'Production documentaire exécutive' : 'Studio documentaire Service Design'
}

export function ServiceDocumentStudio({ sourceKind = 'custom', sourceId, initialSource, initialTemplateId = 'mission-technical-passport' }: ServiceDocumentStudioProps) {
  const initialTemplate = getServiceDocumentTemplate(initialTemplateId)
  const [source, setSource] = useState<ServiceDocumentSource>(initialSource || blankServiceDocumentSource(sourceKind, sourceId))
  const [loading, setLoading] = useState(Boolean(sourceId && !initialSource))
  const [sourceMessage, setSourceMessage] = useState('')
  const [settings, setSettings] = useState<ServiceDocumentSettings>({
    templateId: initialTemplate.id,
    orientation: initialTemplate.orientation,
    density: initialTemplate.density,
    audience: initialTemplate.audiences[0],
    confidentiality: initialTemplate.audiences.includes('customer') ? 'public' : 'internal',
    sectionOrder: [...initialTemplate.defaultSections],
    hiddenSections: [],
    showLogo: true,
    showLegalFooter: true,
    showSourceReferences: true,
    showBlankApprovalFields: false,
    documentTitle: '',
    documentReference: '',
  })
  const [activePanel, setActivePanel] = useState<'templates' | 'source' | 'sections' | 'output'>('templates')
  const [activePage, setActivePage] = useState(0)
  const [zoom, setZoom] = useState(0.72)
  const [downloading, setDownloading] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState('')
  const [controlsOpen, setControlsOpen] = useState(true)

  const template = useMemo(() => getServiceDocumentTemplate(settings.templateId), [settings.templateId])
  useEffect(() => { const count = paginateServiceDocument(source, settings).length; setActivePage((page) => Math.min(page, Math.max(0, count - 1))) }, [source, settings])

  async function resolveSource() {
    if (!sourceId) return
    setLoading(true)
    setSourceMessage('Résolution de la source réelle…')
    try {
      const response = await fetch(`/api/carelink-ops/service-design/documents/source?kind=${encodeURIComponent(sourceKind)}&id=${encodeURIComponent(sourceId)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body?.ok) throw new Error(body?.error || 'Source non résolue')
      setSource(body.source)
      setSourceMessage(`Source résolue · ${body.resolution?.table || 'registre Service Design'}`)
    } catch (error) {
      setSource((current) => ({ ...current, warnings: Array.from(new Set([...current.warnings, error instanceof Error ? error.message : 'Source non résolue.'])) }))
      setSourceMessage('La source n’a pas pu être résolue. Aucun contenu n’a été inventé.')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (sourceId && !initialSource) void resolveSource() }, [sourceId, sourceKind])

  useEffect(() => {
    try {
      const key = `angelcare.service-design.documents.${sourceKind}.${sourceId || 'custom'}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as { settings?: Partial<ServiceDocumentSettings>; source?: Partial<ServiceDocumentSource> }
        if (parsed.settings) setSettings((current) => ({ ...current, ...parsed.settings }))
        if (parsed.source) setSource((current) => ({ ...current, ...parsed.source }))
      }
    } catch {}
  }, [sourceId, sourceKind])

  function selectTemplate(templateId: ServiceDocumentTemplateId) {
    const next = getServiceDocumentTemplate(templateId)
    setSettings((current) => ({ ...current, templateId: next.id, orientation: next.orientation, density: next.density, audience: next.audiences.includes(current.audience) ? current.audience : next.audiences[0], sectionOrder: [...next.defaultSections], hiddenSections: [] }))
    setActivePage(0)
  }

  function updateSetting<K extends keyof ServiceDocumentSettings>(key: K, value: ServiceDocumentSettings[K]) { setSettings((current) => ({ ...current, [key]: value })) }
  function updateBooleanSetting(key: 'showLogo' | 'showLegalFooter' | 'showSourceReferences' | 'showBlankApprovalFields', value: boolean) { setSettings((current) => ({ ...current, [key]: value })) }
  function toggleSection(key: ServiceDocumentSectionKey) {
    if (template.requiredSections.includes(key)) return
    setSettings((current) => ({ ...current, hiddenSections: current.hiddenSections.includes(key) ? current.hiddenSections.filter((item) => item !== key) : [...current.hiddenSections, key] }))
  }
  function moveSection(key: ServiceDocumentSectionKey, delta: -1 | 1) {
    setSettings((current) => {
      const next = [...current.sectionOrder]
      const index = next.indexOf(key)
      const target = index + delta
      if (index < 0 || target < 0 || target >= next.length) return current
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...current, sectionOrder: next }
    })
  }
  function saveDraft() {
    try {
      localStorage.setItem(`angelcare.service-design.documents.${sourceKind}.${sourceId || 'custom'}`, JSON.stringify({ settings, source }))
      setDownloadMessage('Configuration locale sauvegardée dans ce navigateur.')
    } catch { setDownloadMessage('Le navigateur a refusé la sauvegarde locale.') }
  }
  async function downloadPdf() {
    setDownloading(true)
    setDownloadMessage('Génération du PDF professionnel…')
    try {
      const response = await fetch('/api/carelink-ops/service-design/documents/render', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source: { ...source, raw: undefined }, settings }) })
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error || 'Génération PDF refusée') }
      const blob = await response.blob()
      const href = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = href
      anchor.download = `${(settings.documentReference || source.reference || source.code || 'ANGELCARE-SERVICE-DESIGN').replace(/[^a-zA-Z0-9_-]+/g, '-')}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(href)
      const checksum = response.headers.get('x-document-sha256')
      const fileName = `${(settings.documentReference || source.reference || source.code || 'ANGELCARE-SERVICE-DESIGN').replace(/[^a-zA-Z0-9_-]+/g, '-')}.pdf`
      await fetch('/api/carelink-ops/service-design/product-experience/documents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceType: sourceKind, sourceId: sourceId || source.sourceId || null, templateId: settings.templateId, documentReference: settings.documentReference || source.reference || source.code || 'ANGELCARE-SERVICE-DESIGN', title: settings.documentTitle || source.title || template.name, fileName, checksumSha256: checksum, settings, metadata: { audience: settings.audience, confidentiality: settings.confidentiality, orientation: settings.orientation, density: settings.density } }) }).catch(() => undefined)
      setDownloadMessage(`PDF généré et enregistré dans Mon travail${checksum ? ` · SHA-256 ${checksum.slice(0, 16)}…` : ''}`)
    } catch (error) { setDownloadMessage(error instanceof Error ? error.message : 'Échec explicite de génération PDF.') }
    finally { setDownloading(false) }
  }

  const activeSections = settings.sectionOrder.filter((key) => !settings.hiddenSections.includes(key))
  const previewPages = useMemo(() => paginateServiceDocument(source, settings), [source, settings])
  const pageEstimate = previewPages.length

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,.28)] sm:p-8">
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[50px] border-blue-500/10"/>
      <div className="relative flex flex-wrap items-start justify-between gap-6"><div><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.26em] text-blue-300"><FileStack size={15}/> ANGELCARE · A4 & PDF PRODUCTION STUDIO</div><h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-.045em] sm:text-4xl">{titleForKind(sourceKind)}</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">14 gabarits ISO A4, aperçu paginé, sections extensibles, footers référencés, impression et génération PDF réelle — sans signature ou donnée fictive.</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black">{template.name}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black">{orientationLabels[settings.orientation]}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black">{pageEstimate}+ pages estimées</span><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black text-emerald-200"><ShieldCheck size={12} className="mr-1 inline"/>Source réelle uniquement</span></div></div><div className="grid min-w-[250px] gap-2 rounded-[24px] border border-white/10 bg-white/[.055] p-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-400">Source</span><strong>{source.reference || source.code || sourceId || 'Document libre'}</strong></div><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-400">Version</span><strong>{source.version || 'Non renseignée'}</strong></div><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-400">Statut</span><strong>{source.status || 'Brouillon document'}</strong></div></div></div>
    </section>

    <div className="grid gap-5 2xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className={cls('overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_56px_rgba(15,23,42,.07)]', !controlsOpen && '2xl:hidden')}>
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 p-2">{([['templates','Gabarits'],['source','Source'],['sections','Sections'],['output','Sortie']] as const).map(([key,label]) => <button key={key} onClick={() => setActivePanel(key)} className={cls('rounded-xl px-2 py-2 text-[9px] font-black uppercase tracking-[.12em]', activePanel === key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-white')}>{label}</button>)}</div>
        <div className="max-h-[78vh] overflow-y-auto p-4 [scrollbar-width:thin]">
          {activePanel === 'templates' ? <div className="space-y-3"><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-700">Template catalogue</p><p className="mt-2 text-xs font-semibold leading-5 text-blue-900">Chaque gabarit possède une orientation, une audience, une densité et une architecture de sections maîtrisées.</p></div>{SERVICE_DOCUMENT_TEMPLATES.map((item) => <button key={item.id} onClick={() => selectTemplate(item.id)} className={cls('w-full rounded-[22px] border p-4 text-left transition', settings.templateId === item.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50')}><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">{item.code}</p><p className="mt-1 text-sm font-black text-slate-950">{item.name}</p></div>{settings.templateId === item.id ? <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white"><Check size={14}/></span> : null}</div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{item.description}</p><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase">{orientationLabels[item.orientation]}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase">{densityLabels[item.density]}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase">{item.flexible ? 'Flexible' : 'Contrôlé'}</span></div></button>)}</div> : null}

          {activePanel === 'source' ? <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-900">Résolution source</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-500">{sourceMessage || (sourceId ? 'Le studio peut charger le plan, sellable ou handoff réel depuis Supabase.' : 'Document libre sans source opérationnelle imposée.')}</p>{sourceId ? <button onClick={() => void resolveSource()} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50">{loading ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>} Recharger la source</button> : null}</div>
            <label className="block"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Titre document</span><input value={settings.documentTitle || ''} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSetting('documentTitle', event.target.value)} placeholder={source.title} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-blue-400"/></label>
            <label className="block"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Référence documentaire</span><input value={settings.documentReference || ''} onChange={(event: ChangeEvent<HTMLInputElement>) => updateSetting('documentReference', event.target.value)} placeholder={source.reference || source.code || 'SD-YYYY-0001'} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-blue-400"/></label>
            <label className="block"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Titre source</span><input value={source.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setSource((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-blue-400"/></label>
            <label className="block"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-500">Synthèse exécutive</span><textarea value={source.executiveSummary || ''} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSource((current) => ({ ...current, executiveSummary: event.target.value }))} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-semibold leading-5 outline-none focus:border-blue-400" placeholder="Complément facultatif. Les données structurées restent prioritaires."/></label>
            {source.warnings.length ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-800">Limites explicites</p><ul className="mt-2 grid gap-1 text-[10px] font-semibold text-amber-900">{source.warnings.map((warning, index) => <li key={index}>• {warning}</li>)}</ul></div> : null}</div> : null}

          {activePanel === 'sections' ? <div className="space-y-2"><p className="mb-3 text-xs font-semibold leading-5 text-slate-500">Réordonnez ou masquez les sections optionnelles. Les sections obligatoires du gabarit restent actives.</p>{settings.sectionOrder.map((key, index) => { const hidden = settings.hiddenSections.includes(key); const required = template.requiredSections.includes(key); return <div key={key} className={cls('flex items-center gap-2 rounded-2xl border p-3', hidden ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white')}><button onClick={() => toggleSection(key)} className={cls('grid h-7 w-7 place-items-center rounded-lg border', !hidden ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400')} title={required ? 'Section obligatoire' : hidden ? 'Afficher' : 'Masquer'}>{!hidden ? <Eye size={13}/> : <Minus size={13}/>}</button><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-slate-800">{SERVICE_DOCUMENT_SECTION_LABELS[key]}</p><p className="text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">{required ? 'Obligatoire' : 'Flexible'}</p></div><button onClick={() => moveSection(key,-1)} disabled={index === 0} className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><ArrowUp size={12}/></button><button onClick={() => moveSection(key,1)} disabled={index === settings.sectionOrder.length - 1} className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 disabled:opacity-30"><ArrowDown size={12}/></button></div> })}</div> : null}

          {activePanel === 'output' ? <div className="space-y-4"><SelectBlock label="Orientation" values={['portrait','landscape']} current={settings.orientation} labels={orientationLabels} onChange={(value) => updateSetting('orientation', value as ServiceDocumentOrientation)}/><SelectBlock label="Densité" values={['compact','standard','detailed']} current={settings.density} labels={densityLabels} onChange={(value) => updateSetting('density', value as ServiceDocumentDensity)}/><SelectBlock label="Audience" values={template.audiences} current={settings.audience} labels={audienceLabels} onChange={(value) => updateSetting('audience', value as ServiceDocumentAudience)}/><SelectBlock label="Confidentialité" values={['public','internal','confidential','restricted']} current={settings.confidentiality} labels={confidentialityLabels} onChange={(value) => updateSetting('confidentiality', value as ServiceDocumentConfidentiality)}/>{[['showLogo','Logo officiel ANGELCARE'],['showLegalFooter','Footer légal & contacts'],['showSourceReferences','Références source & version'],['showBlankApprovalFields','Champs de validation vierges']] .map(([key,label]) => <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3"><span className="text-[10px] font-black text-slate-700">{label}</span><input type="checkbox" checked={Boolean(settings[key as keyof ServiceDocumentSettings])} onChange={(event: ChangeEvent<HTMLInputElement>) => updateBooleanSetting(key as 'showLogo' | 'showLegalFooter' | 'showSourceReferences' | 'showBlankApprovalFields', event.target.checked)} className="h-4 w-4 accent-blue-600"/></label>)}</div> : null}
        </div>
      </aside>

      <section className="min-w-0 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-center gap-2"><button onClick={() => setControlsOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-600" title={controlsOpen ? 'Masquer les contrôles' : 'Afficher les contrôles'}>{controlsOpen ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}</button><button onClick={() => setZoom((value) => Math.max(.42, Number((value - .08).toFixed(2))))} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200"><Minus size={15}/></button><span className="min-w-[58px] text-center text-[10px] font-black text-slate-600">{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(1, Number((value + .08).toFixed(2))))} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200"><Plus size={15}/></button><button onClick={() => setZoom(settings.orientation === 'landscape' ? .62 : .72)} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200"><Maximize2 size={15}/></button></div><div className="flex flex-wrap gap-2"><button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-700"><Save size={14}/> Sauvegarder</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black text-slate-700"><Printer size={14}/> Imprimer</button><button onClick={() => void downloadPdf()} disabled={downloading} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-[10px] font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">{downloading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>} Télécharger PDF</button></div></div>
        {downloadMessage ? <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">{downloadMessage}</div> : null}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Aperçu pagination</p><p className="mt-1 text-xs font-black text-slate-900">Page active {activePage + 1} · Gabarit {template.code}</p></div><div className="flex items-center gap-2"><button onClick={() => setActivePage((value) => Math.max(0,value-1))} disabled={activePage === 0} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 disabled:opacity-30"><ChevronLeft size={15}/></button><button onClick={() => setActivePage((value) => Math.min(previewPages.length - 1, value + 1))} disabled={activePage >= previewPages.length - 1} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200"><ChevronRight size={15}/></button></div></div>
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3">{previewPages.map((page) => <button key={page.index} onClick={() => setActivePage(page.index)} className={cls('min-w-[116px] rounded-xl border p-2 text-left transition', activePage === page.index ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-200')}><div className={cls('mx-auto mb-2 border border-slate-300 bg-white shadow-sm', settings.orientation === 'portrait' ? 'h-16 w-11' : 'h-11 w-16')}><div className="m-1 h-1 bg-[var(--doc-accent,#2563eb)]"/><div className="mx-1 mt-1 h-0.5 bg-slate-200"/><div className="mx-1 mt-1 h-0.5 bg-slate-200"/></div><p className="text-[9px] font-black text-slate-800">Page {page.index + 1}</p><p className="mt-1 truncate text-[8px] font-semibold text-slate-500">{page.blocks.map((block) => block.title).join(' · ') || 'Page vide'}</p></button>)}</div>
        <DocumentPreview source={source} settings={settings} zoom={zoom} activePage={activePage}/>
        <div className="grid gap-3 md:grid-cols-3"><div className="rounded-[22px] border border-slate-200 bg-white p-4"><FileCheck2 size={17} className="text-blue-600"/><p className="mt-3 text-sm font-black">Print-safe</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">A4 portrait/paysage, pages séparées, headers et footers répétés.</p></div><div className="rounded-[22px] border border-slate-200 bg-white p-4"><Sparkles size={17} className="text-violet-600"/><p className="mt-3 text-sm font-black">Flexible</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Sections activables, réordonnables et densité adaptable selon l’audience.</p></div><div className="rounded-[22px] border border-slate-200 bg-white p-4"><ShieldCheck size={17} className="text-emerald-600"/><p className="mt-3 text-sm font-black">Attributable</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">Source, version, référence, confidentialité et SHA-256 de sortie.</p></div></div>
      </section>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">Le studio ne crée aucune mission, ne modifie aucun plan et n’ajoute aucune signature préchargée.</p><Link href="/carelink-ops/service-design" className="text-xs font-black text-blue-700">Retour au Service Intelligence Studio</Link></div>
  </div>
}

function SelectBlock({ label, values, current, labels, onChange }: { label: string; values: readonly string[]; current: string; labels: Partial<Record<string,string>>; onChange: (value: string) => void }) {
  return <div><p className="mb-2 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{label}</p><div className="grid grid-cols-2 gap-2">{values.map((value) => <button key={value} onClick={() => onChange(value)} className={cls('rounded-xl border px-3 py-2 text-[10px] font-black', current === value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600')}>{labels[value] || value}</button>)}</div></div>
}
