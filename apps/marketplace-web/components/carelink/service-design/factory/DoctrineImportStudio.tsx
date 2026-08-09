'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Files, GitBranch, Layers3, RefreshCcw, UploadCloud } from 'lucide-react'
import type { FactoryCataloguePayload, DirectImportResult } from '@/types/homeservice-factory'
import { DIRECT_IMPORT_TYPES } from '@/lib/homeservice-factory/constants'
import { FactoryHero, FactorySurface, PrimaryButton, Signal, cx } from './FactoryUI'
import { useServiceDesignActions } from '../feedback/ServiceDesignActionCenter'
import { explainServiceDesignError, serviceDesignRequest } from '../feedback/client'

const templates: Record<string, string> = {
  doctrine_rules: 'code,kind,severity,title_fr,description_fr,mandatory,blocking,age_bands,contexts,required_evidence,escalation_route,status\nSAFE_HANDOVER,mandatory,important,Transmission parentale,Confirmer les consignes et contacts,yes,no,all,home_daytime,confirmation,Dispatch,draft',
  capacity_rules: 'minimum_hours,maximum_hours,maximum_consecutive_days,earliest_start_time,latest_end_time,max_beneficiaries_per_agent,minimum_agents,backup_required,supervisor_required,lead_time_hours,weekend_allowed,night_allowed,status\n2,12,14,06:00,23:00,2,1,no,no,24,yes,no,draft',
  activities: 'code,name_fr,description_fr,block_type,objective_codes,category_codes,age_min_months,age_max_months,min_minutes,max_minutes,energy_level,location_type,materials,competency_codes,risk_codes,evidence_codes,repetition_limit_per_day,status\nART_CREATIVE,Atelier créatif,Activité guidée de création,learning,creative_development,CHILD_HOME,36,120,30,90,moderate,indoor,paper|colors,childcare_basic,,activity_note,1,draft',
  features: 'code,name_fr,description_fr,included_by_default,pricing_basis,unit_price_dh,cost_amount_dh,minimum_quantity,maximum_quantity,customer_visible,status\nREPORT_STANDARD,Rapport standard,Compte rendu mission,yes,per_mission,0,0,1,1,yes,draft',
  topups: 'code,name_fr,description_fr,pricing_basis,unit_price_dh,cost_amount_dh,minimum_quantity,maximum_quantity,customer_visible,status\nEXTRA_HOUR,Heure supplémentaire,Extension durée,per_hour,120,70,1,6,yes,draft',
  upsells: 'code,name_fr,description_fr,pricing_basis,unit_price_dh,cost_amount_dh,minimum_quantity,maximum_quantity,customer_visible,status\nPREMIUM_KIT,Kit activité premium,Matériel enrichi,per_mission,180,90,1,1,yes,draft',
  competencies: 'code,name_fr,family,description_fr,evidence_type,renewal_months,status\nCHILDCARE_BASIC,Garde enfant,childcare,Compétence garde à domicile,declaration,,draft',
  materials: 'code,name_fr,description_fr,provider_scope,unit,status\nCRAFT_KIT,Kit créatif,Matériel arts et crafts,angelcare,kit,draft',
  risks: 'code,name_fr,description_fr,severity,trigger_conditions,preventive_controls,required_evidence,stop_work,escalation_route,category_codes,status\nALLERGY,Allergie connue,Vérifier les restrictions,critical,allergy_declared,confirm_parent|avoid_exposure,confirmation,yes,Dispatch sécurité,CHILD_HOME,draft',
  checklists: 'template_code,template_name,item_code,phase,item_label,item_type,mandatory,evidence_required,blocking_if_failed,sort_order,status\nCHILD_HOME_OPEN,Ouverture mission,CONTACT_CONFIRM,arrival,Confirmer contact et consignes,boolean,yes,no,yes,10,draft',
  report_fields: 'template_code,template_name,field_code,section,label,field_type,required,option_values,sort_order,status\nCHILD_HOME_REPORT,Rapport garde,ACTIVITIES,Déroulé,Activités réalisées,multiselect,yes,,10,draft',
  pricing: 'code,customer_segment,pricing_basis,minimum_quantity,unit_price_dh,cost_amount_dh,margin_floor_percent,effective_from,effective_to,status\nCHILD_HOME_HOUR,family,per_hour,1,120,70,30,2026-01-01,,draft',
  experience_blueprints: 'code,concept,title_fr,subtitle_fr,hero_statement_fr,accent,icon,audience,version_number,zero_typing_promise_fr,ai_composition_profile,status\nEXP-CUSTOM,family_care,Studio garde premium,Configuration catégorie,Choisissez un scénario puis uniquement dates et horaires,rose,HeartHandshake,b2c,1,Aucun texte obligatoire,"{""purpose"":""Composer depuis le catalogue local""}",active',
  experience_sections: 'section_code,title_fr,description_fr,layout,sort_order,status\nbeneficiary,Profil bénéficiaire,Choix contrôlés du profil,profile,100,active',
  experience_fields: 'section_code,field_code,label_fr,description_fr,field_type,required,default_value,min_value,max_value,unit,semantic,sort_order,status\nbeneficiary,age_band,Tranche d’âge,Choix sans saisie,single,yes,"""age_3_5""",,,,ans,age,100,active',
  experience_options: 'section_code,field_code,option_code,label_fr,description_fr,sort_order,status\nbeneficiary,age_band,age_3_5,3–5 ans,Profil préscolaire,100,active',
  experience_presets: 'preset_code,name_fr,description_fr,badge_fr,mode,universe,field_values,default_start_time,default_end_time,default_day_count,scenario_count,max_activities_per_day,max_options,sort_order,status\nfull_day,Journée complète,Configuration préremplie,Recommandé,single_mission,b2c,"{""age_band"":""age_3_5"",""meal"":true}",08:00,16:00,1,3,6,4,100,active',
}

const EXPERIENCE_ORDER = ['experience_blueprints', 'experience_sections', 'experience_fields', 'experience_options', 'experience_presets'] as const
const EXPERIENCE_TYPES = new Set<string>(EXPERIENCE_ORDER)
type ImportMode = 'update_existing' | 'create_version' | 'replace_draft'
type ExperienceImportResult = DirectImportResult & { blueprintCode?: string | null; blueprintVersion?: number | null }

type ParsedPreview = { headers: string[]; rows: string[][] }
function parseCsvPreview(content: string): ParsedPreview {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(field); field = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field); field = ''
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field)
  if (row.some((value) => value.trim())) rows.push(row)
  return { headers: rows[0] || [], rows: rows.slice(1) }
}

function identifyExperienceType(file: File, content: string) {
  const name = file.name.toLowerCase()
  const headers = parseCsvPreview(content).headers.map((item) => item.trim().toLowerCase())
  if (name.includes('blueprint') || headers.includes('concept')) return 'experience_blueprints'
  if (name.includes('section') || (headers.includes('section_code') && headers.includes('layout') && !headers.includes('field_code'))) return 'experience_sections'
  if (name.includes('field') || headers.includes('field_type')) return 'experience_fields'
  if (name.includes('option') || headers.includes('option_code')) return 'experience_options'
  if (name.includes('preset') || headers.includes('preset_code')) return 'experience_presets'
  return null
}

export function DoctrineImportStudio({ catalogue, initialCategoryId, initialImportType = 'doctrine_rules', embedded = false, onApplied }: {
  catalogue: FactoryCataloguePayload
  initialCategoryId?: string
  initialImportType?: string
  embedded?: boolean
  onApplied?: (result: DirectImportResult) => void
}) {
  const router = useRouter()
  const actions = useServiceDesignActions()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bundleInputRef = useRef<HTMLInputElement | null>(null)
  const supportedInitialType = DIRECT_IMPORT_TYPES.some((item) => item.code === initialImportType) ? initialImportType : 'doctrine_rules'
  const resolvedInitialCategory = catalogue.categories.find((item) => item.id === initialCategoryId || item.code === initialCategoryId)?.id || catalogue.categories[0]?.id || ''
  const [importType, setImportType] = useState(supportedInitialType)
  const [categoryId, setCategoryId] = useState(resolvedInitialCategory)
  const [fileName, setFileName] = useState(`${supportedInitialType}.csv`)
  const [content, setContent] = useState(templates[supportedInitialType] || '')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<ExperienceImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('update_existing')
  const [bundleSummary, setBundleSummary] = useState<string | null>(null)
  const definition = DIRECT_IMPORT_TYPES.find((item) => item.code === importType)
  const preview = useMemo(() => parseCsvPreview(content), [content])
  const selectedCategory = catalogue.categories.find((item) => item.id === categoryId)
  const isExperience = EXPERIENCE_TYPES.has(importType)

  function selectType(value: string) {
    setImportType(value); setFileName(`${value}.csv`); setContent(templates[value] || '')
    setResult(null); setError(null); setBundleSummary(null)
  }

  function downloadTemplate() {
    const blob = new Blob([templates[importType] || ''], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `${importType}_homeservice.csv`; anchor.click(); URL.revokeObjectURL(url)
  }

  async function loadSelectedFile(file: File | undefined) {
    if (!file) return
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') { setError('Le fichier doit être un CSV. Sélectionnez le modèle correspondant puis réessayez.'); return }
    setFileName(file.name); setContent(await file.text()); setResult(null); setError(null); setBundleSummary(null)
  }

  async function postImport(type: string, name: string, csvContent: string) {
    return serviceDesignRequest<ExperienceImportResult>('/api/carelink-ops/service-design/factory/import', {
      method: 'POST',
      body: JSON.stringify({ importType: type, categoryId: DIRECT_IMPORT_TYPES.find((item) => item.code === type)?.categoryRequired ? categoryId : null, fileName: name, content: csvContent, importMode }),
    }, { timeoutMs: 125_000 })
  }

  async function apply() {
    const actionId = actions.start({ title: isExperience ? 'Import expérience catégorie' : 'Import ciblé Service Design', detail: 'Lecture du CSV et validation ligne par ligne…', objectLabel: `${definition?.label || importType}${selectedCategory ? ` · ${selectedCategory.commercialName}` : ''}`, progress: 12 })
    setBusy(true); setResult(null); setError(null); setBundleSummary(null)
    try {
      actions.update(actionId, { progress: 36, currentStep: `${preview.rows.length} ligne(s) détectée(s)` })
      const data = await postImport(importType, fileName, content)
      actions.update(actionId, { progress: 84, currentStep: 'Actualisation du catalogue local' })
      setResult(data)
      if (data.rejectedRows) actions.fail(actionId, { detail: `${data.appliedRows}/${data.totalRows} ligne(s) appliquée(s); ${data.rejectedRows} rejetée(s).`, instruction: 'Ouvrez les erreurs ci-dessous, corrigez les lignes indiquées puis relancez ce CSV.', preserved: 'Les lignes appliquées restent enregistrées et le CSV reste chargé.' })
      else actions.succeed(actionId, { detail: `${data.appliedRows} ligne(s) appliquée(s). La ressource est immédiatement consommable par la Factory.`, currentStep: 'Import terminé' })
      router.refresh(); onApplied?.(data)
    } catch (reason) {
      const explained = explainServiceDesignError(reason, 'Échec de l’import.')
      setError(`${explained.message} ${explained.instruction}`)
      actions.fail(actionId, { detail: explained.message, instruction: explained.instruction, preserved: explained.preserved || 'Le contenu CSV reste chargé dans l’éditeur.' })
    } finally { setBusy(false) }
  }

  async function applyExperienceBundle(files: FileList | null) {
    if (!files?.length) return
    if (!categoryId) { setError('Sélectionnez la catégorie cible avant l’import de l’expérience complète.'); return }
    const actionId = actions.start({ title: 'Import expérience complète', detail: 'Identification des cinq fichiers et vérification des dépendances…', objectLabel: selectedCategory?.commercialName, progress: 5 })
    setBusy(true); setError(null); setResult(null); setBundleSummary(null)
    try {
      const entries = await Promise.all(Array.from(files).map(async (file) => ({ file, content: await file.text() })))
      const identified = entries.map((entry) => ({ ...entry, type: identifyExperienceType(entry.file, entry.content) }))
      const unknown = identified.filter((entry) => !entry.type)
      if (unknown.length) throw new Error(`Fichier non reconnu: ${unknown.map((entry) => entry.file.name).join(', ')}.`)
      const byType = new Map(identified.map((entry) => [entry.type as string, entry]))
      const missing = EXPERIENCE_ORDER.filter((type) => !byType.has(type))
      if (missing.length) throw new Error(`Le pack est incomplet. Fichier(s) manquant(s): ${missing.join(', ')}.`)
      const totals: Array<{ type: string; applied: number; rejected: number }> = []
      for (let index = 0; index < EXPERIENCE_ORDER.length; index += 1) {
        const type = EXPERIENCE_ORDER[index]
        const entry = byType.get(type)!
        actions.update(actionId, { progress: 10 + index * 17, currentStep: `${index + 1}/5 · ${DIRECT_IMPORT_TYPES.find((item) => item.code === type)?.label || type}` })
        const data = await postImport(type, entry.file.name, entry.content)
        totals.push({ type, applied: data.appliedRows, rejected: data.rejectedRows })
        if (data.rejectedRows) throw new Error(`${entry.file.name}: ${data.rejectedRows} ligne(s) rejetée(s). Corrigez ce fichier avant de poursuivre.`)
      }
      const totalApplied = totals.reduce((sum, item) => sum + item.applied, 0)
      const summary = `${totalApplied} enregistrement(s) appliqué(s): blueprint, sections, champs, options et scénarios.`
      setBundleSummary(summary)
      actions.succeed(actionId, { detail: summary, currentStep: 'Expérience complète disponible dans la Factory' })
      router.refresh()
    } catch (reason) {
      const explained = explainServiceDesignError(reason, 'Échec de l’import de l’expérience complète.')
      setError(`${explained.message} ${explained.instruction}`)
      actions.fail(actionId, { detail: explained.message, instruction: 'Corrigez le fichier indiqué puis relancez les cinq fichiers. Les upserts déjà réussis sont idempotents.', preserved: 'Aucun doublon de blueprint V1 ne sera créé.' })
    } finally { setBusy(false); if (bundleInputRef.current) bundleInputRef.current.value = '' }
  }

  return <div className="space-y-6">
    {embedded ? null : <FactoryHero eyebrow="Doctrine & Catalogue Import Studio" title="Importer exactement ce dont vous avez besoin." description="Choisissez une catégorie, une ressource précise, chargez son CSV puis appliquez immédiatement les lignes valides. Les blueprints existants sont résolus par catégorie, code et version sans doublon." />}
    {error ? <Signal tone="rose" title="Import interrompu" detail={error} /> : null}
    {result ? <Signal tone={result.rejectedRows ? 'amber' : 'emerald'} title={`${result.appliedRows}/${result.totalRows} ligne(s) appliquée(s)`} detail={result.rejectedRows ? `${result.rejectedRows} ligne(s) rejetée(s). Consultez les corrections exactes ci-dessous.` : `Catalogue actualisé${result.blueprintCode ? ` · ${result.blueprintCode} V${result.blueprintVersion || 1}` : ''}.`} /> : null}
    {bundleSummary ? <Signal tone="emerald" title="Expérience complète importée" detail={bundleSummary} /> : null}

    <section className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
      <FactorySurface title="1. Ressource ciblée" subtitle="Un import = un objectif précis.">
        <div className="space-y-2">{DIRECT_IMPORT_TYPES.map((item) => <button key={item.code} type="button" onClick={() => selectType(item.code)} className={cx('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-black transition', importType === item.code ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200')}><span>{item.label}</span><span className={cx('rounded-full px-2 py-1 text-[8px] uppercase', importType === item.code ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}>{item.categoryRequired ? 'par catégorie' : 'global'}</span></button>)}</div>
        <div className="mt-5 rounded-[22px] border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-start gap-3"><Files size={18} className="mt-0.5 shrink-0 text-violet-700" /><div><p className="text-xs font-black text-violet-950">Importer l’expérience complète</p><p className="mt-1 text-[11px] font-semibold leading-5 text-violet-700">Sélectionnez ensemble les fichiers 12 à 16. L’ordre et les parents sont résolus automatiquement.</p></div></div>
          <button type="button" disabled={busy || !categoryId} onClick={() => bundleInputRef.current?.click()} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-3 text-[10px] font-black text-white disabled:opacity-45"><Layers3 size={14} />Choisir les 5 CSV</button>
          <input ref={bundleInputRef} type="file" multiple accept=".csv,text/csv" className="hidden" onChange={(event) => void applyExperienceBundle(event.target.files)} />
        </div>
      </FactorySurface>

      <div className="space-y-6">
        <FactorySurface title="2. Catégorie et fichier" subtitle="Aucun identifiant technique à saisir: choisissez la catégorie synchronisée.">
          {definition?.categoryRequired ? <label className="block space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Catégorie cible</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900"><option value="">Sélectionner</option>{catalogue.categories.map((item) => <option key={item.id} value={item.id}>{item.commercialName} · {item.code}</option>)}</select></label> : <Signal tone="blue" title="Référentiel global" detail="Cette ressource peut être reliée à plusieurs catégories grâce aux codes du CSV." />}

          {isExperience ? <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Mode d’import du blueprint">
            {([
              ['update_existing', 'Mettre à jour V1', 'Résout et met à jour la version existante.'],
              ['create_version', 'Créer une version', 'Crée explicitement la prochaine version.'],
              ['replace_draft', 'Remplacer le brouillon', 'Réservé à une version brouillon non publiée.'],
            ] as const).map(([value, label, detail]) => <button key={value} type="button" role="radio" aria-checked={importMode === value} onClick={() => setImportMode(value)} className={cx('rounded-2xl border p-3 text-left transition', importMode === value ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-200')}><span className="flex items-center gap-2 text-[10px] font-black text-slate-950"><GitBranch size={13} className="text-violet-600" />{label}</span><span className="mt-1 block text-[10px] font-semibold leading-4 text-slate-500">{detail}</span></button>)}
          </div> : null}

          <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click() }} onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={(event) => { event.preventDefault(); setDragging(false) }} onDrop={(event) => { event.preventDefault(); setDragging(false); void loadSelectedFile(event.dataTransfer.files?.[0]) }} className={cx('mt-5 cursor-pointer rounded-[26px] border-2 border-dashed p-7 text-center transition', dragging ? 'border-blue-500 bg-blue-50 shadow-[0_18px_50px_rgba(37,99,235,.14)]' : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50')}>
            <UploadCloud className="mx-auto text-blue-600" size={34} /><p className="mt-3 text-sm font-black text-slate-900">Déposez votre CSV ici ou cliquez pour le sélectionner</p><p className="mt-1 break-all text-xs font-semibold text-slate-600">{fileName} · {preview.rows.length} ligne(s) de données</p><input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void loadSelectedFile(event.target.files?.[0])} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadTemplate} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-800"><Download size={15} />Télécharger le modèle exact</button><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><FileSpreadsheet size={15} />Choisir un autre CSV</button></div>
        </FactorySurface>

        <FactorySurface title="3. Prévisualiser, corriger et appliquer" subtitle={`${preview.rows.length} ligne(s) détectée(s) dans ${fileName}.`} action={<PrimaryButton disabled={busy || !content.trim() || Boolean(definition?.categoryRequired && !categoryId)} onClick={() => void apply()}><CheckCircle2 size={15} />{busy ? 'Application…' : 'Appliquer maintenant'}</PrimaryButton>}>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><ClipboardPaste size={14} />Édition directe autorisée avant application</div>
          {preview.headers.length ? <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-left text-[10px]"><thead className="bg-slate-950 text-white"><tr>{preview.headers.slice(0, 10).map((header, index) => <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-2.5 font-black">{header || `Colonne ${index + 1}`}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100">{preview.headers.slice(0, 10).map((_, columnIndex) => <td key={columnIndex} className="max-w-[220px] truncate px-3 py-2 font-semibold text-slate-700">{row[columnIndex] || '—'}</td>)}</tr>)}</tbody></table></div> : <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800"><AlertTriangle size={16} />Aucun en-tête CSV détecté.</div>}
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} spellCheck={false} className="w-full rounded-2xl border border-slate-700 bg-[#081326] p-4 font-mono text-[11px] leading-5 text-slate-100 caret-cyan-300 outline-none focus:border-blue-400" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><FileSpreadsheet size={17} className="text-blue-600" /><p className="mt-2 text-xs font-black">Application immédiate</p><p className="mt-1 text-[11px] font-semibold text-slate-600">Les lignes valides alimentent la Factory sans détour.</p></div><div className="rounded-2xl bg-slate-50 p-4"><Layers3 size={17} className="text-violet-600" /><p className="mt-2 text-xs font-black">Upsert hiérarchique</p><p className="mt-1 text-[11px] font-semibold text-slate-600">Blueprint, section, champ, option et preset sont résolus par codes stables.</p></div><div className="rounded-2xl bg-slate-50 p-4"><CheckCircle2 size={17} className="text-emerald-600" /><p className="mt-2 text-xs font-black">Erreurs exactes</p><p className="mt-1 text-[11px] font-semibold text-slate-600">Chaque rejet indique la ligne, le parent manquant et l’action requise.</p></div></div>
          {result?.errors.length ? <div className="mt-5 space-y-2">{result.errors.map((item) => <div key={`${item.row}-${item.message}`} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold leading-5 text-rose-950">Ligne {item.row}: {item.message}</div>)}</div> : null}
          {result ? <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-700" /><div className="mr-auto"><p className="text-xs font-black text-emerald-950">Catalogue actualisé</p><p className="mt-1 text-[11px] font-semibold text-emerald-800">Retournez à la Factory ou actualisez la catégorie active.</p></div><button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black text-emerald-800"><RefreshCcw size={13} />Actualiser</button><Link href={selectedCategory ? `/carelink-ops/service-design/factory/category/${encodeURIComponent(selectedCategory.code)}` : '/carelink-ops/service-design/factory'} className="rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-black text-white">Retour Factory</Link></div> : null}
        </FactorySurface>
      </div>
    </section>
  </div>
}
