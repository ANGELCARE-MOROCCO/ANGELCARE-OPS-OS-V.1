'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Layers3, RefreshCcw, UploadCloud } from 'lucide-react'
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
  experience_blueprints: 'code,concept,title_fr,subtitle_fr,hero_statement_fr,accent,icon,audience,version_number,zero_typing_promise_fr,ai_composition_profile,status\nEXP-CUSTOM,family_care,Studio garde premium,Configuration catégorie,Choisissez un scénario puis uniquement dates et horaires,rose,HeartHandshake,b2c,1,Aucun texte obligatoire,"{\"purpose\":\"Composer depuis le catalogue local\"}",active',
  experience_sections: 'section_code,title_fr,description_fr,layout,sort_order,status\nbeneficiary,Profil bénéficiaire,Choix contrôlés du profil,profile,100,active',
  experience_fields: 'section_code,field_code,label_fr,description_fr,field_type,required,default_value,min_value,max_value,unit,semantic,sort_order,status\nbeneficiary,age_band,Tranche d’âge,Choix sans saisie,single,yes,"\"age_3_5\"",,,,ans,age,100,active',
  experience_options: 'section_code,field_code,option_code,label_fr,description_fr,sort_order,status\nbeneficiary,age_band,age_3_5,3–5 ans,Profil préscolaire,100,active',
  experience_presets: 'preset_code,name_fr,description_fr,badge_fr,mode,universe,field_values,default_start_time,default_end_time,default_day_count,scenario_count,max_activities_per_day,max_options,sort_order,status\nfull_day,Journée complète,Configuration préremplie,Recommandé,single_mission,b2c,"{\"age_band\":\"age_3_5\",\"meal\":true}",08:00,16:00,1,3,6,4,100,active',
}

async function readFile(file: File) { return file.text() }

function parseCsvPreview(content: string) {
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

export function DoctrineImportStudio({
  catalogue,
  initialCategoryId,
  initialImportType = 'doctrine_rules',
  embedded = false,
  onApplied,
}: {
  catalogue: FactoryCataloguePayload
  initialCategoryId?: string
  initialImportType?: string
  embedded?: boolean
  onApplied?: (result: DirectImportResult) => void
}) {
  const router = useRouter()
  const actions = useServiceDesignActions()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const supportedInitialType = DIRECT_IMPORT_TYPES.some((item) => item.code === initialImportType) ? initialImportType : 'doctrine_rules'
  const resolvedInitialCategory = catalogue.categories.find((item) => item.id === initialCategoryId || item.code === initialCategoryId)?.id || catalogue.categories[0]?.id || ''
  const [importType, setImportType] = useState(supportedInitialType)
  const [categoryId, setCategoryId] = useState(resolvedInitialCategory)
  const [fileName, setFileName] = useState(`${supportedInitialType}.csv`)
  const [content, setContent] = useState(templates[supportedInitialType] || '')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<DirectImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const definition = DIRECT_IMPORT_TYPES.find((item) => item.code === importType)
  const preview = useMemo(() => parseCsvPreview(content), [content])
  const selectedCategory = catalogue.categories.find((item) => item.id === categoryId)

  function selectType(value: string) {
    setImportType(value)
    setFileName(`${value}.csv`)
    setContent(templates[value] || '')
    setResult(null)
    setError(null)
  }

  function downloadTemplate() {
    const blob = new Blob([templates[importType] || ''], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${importType}_homeservice.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function loadSelectedFile(file: File | undefined) {
    if (!file) return
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setError('Le fichier doit être un CSV. Sélectionnez le modèle correspondant puis réessayez.')
      return
    }
    setFileName(file.name)
    setContent(await readFile(file))
    setResult(null)
    setError(null)
  }

  async function apply() {
    const actionId = actions.start({
      title: 'Import ciblé Service Design',
      detail: 'Lecture du CSV et validation ligne par ligne…',
      objectLabel: `${definition?.label || importType}${selectedCategory ? ` · ${selectedCategory.commercialName}` : ''}`,
      progress: 12,
    })
    setBusy(true); setResult(null); setError(null)
    try {
      actions.update(actionId, { progress: 36, currentStep: `${preview.rows.length} ligne(s) détectée(s)` })
      const data = await serviceDesignRequest<DirectImportResult>('/api/carelink-ops/service-design/factory/import', {
        method: 'POST',
        body: JSON.stringify({ importType, categoryId: definition?.categoryRequired ? categoryId : null, fileName, content }),
      }, { timeoutMs: 125_000 })
      actions.update(actionId, { progress: 84, currentStep: 'Actualisation du catalogue local' })
      setResult(data)
      if (data.rejectedRows) {
        actions.fail(actionId, {
          detail: `${data.appliedRows}/${data.totalRows} ligne(s) appliquée(s); ${data.rejectedRows} rejetée(s).`,
          instruction: 'Corrigez les lignes listées puis relancez uniquement le même CSV. Les lignes valides sont déjà disponibles.',
          preserved: 'Les données valides appliquées ne seront pas perdues.',
        })
      } else {
        actions.succeed(actionId, { detail: `${data.appliedRows} ligne(s) appliquée(s). La ressource est immédiatement consommable par la Factory.`, currentStep: 'Import terminé' })
      }
      router.refresh()
      onApplied?.(data)
    } catch (reason) {
      const explained = explainServiceDesignError(reason, 'Échec de l’import.')
      setError(`${explained.message} ${explained.instruction}`)
      actions.fail(actionId, { detail: explained.message, instruction: explained.instruction, preserved: 'Le contenu CSV reste chargé dans l’éditeur.' })
    } finally { setBusy(false) }
  }

  return <div className="space-y-6">
    {embedded ? null : <FactoryHero eyebrow="Doctrine & Catalogue Import Studio" title="Importer exactement ce dont vous avez besoin." description="Choisissez une catégorie, une ressource précise, chargez son CSV puis appliquez immédiatement les lignes valides. Aucun board ou circuit de validation ne bloque l’import." />}
    {error ? <Signal tone="rose" title="Import interrompu" detail={error} /> : null}
    {result ? <Signal tone={result.rejectedRows ? 'amber' : 'emerald'} title={`${result.appliedRows}/${result.totalRows} ligne(s) appliquée(s)`} detail={result.rejectedRows ? `${result.rejectedRows} ligne(s) rejetée(s). Les lignes valides sont déjà disponibles.` : 'Les données sont immédiatement disponibles dans la Factory.'} /> : null}

    <section className="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)]">
      <FactorySurface title="1. Ressource ciblée" subtitle="Un import = un objectif précis.">
        <div className="space-y-2">{DIRECT_IMPORT_TYPES.map((item) => <button key={item.code} type="button" onClick={() => selectType(item.code)} className={cx('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-black transition', importType === item.code ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200')}><span>{item.label}</span><span className={cx('rounded-full px-2 py-1 text-[8px] uppercase', importType === item.code ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}>{item.categoryRequired ? 'par catégorie' : 'global'}</span></button>)}</div>
      </FactorySurface>

      <div className="space-y-6">
        <FactorySurface title="2. Catégorie et fichier" subtitle="Aucun identifiant technique à saisir: choisissez la catégorie synchronisée.">
          {definition?.categoryRequired ? <label className="block space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Catégorie cible</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black"><option value="">Sélectionner</option>{catalogue.categories.map((item) => <option key={item.id} value={item.id}>{item.commercialName} · {item.code}</option>)}</select></label> : <Signal tone="blue" title="Référentiel global" detail="Cette ressource peut être reliée à plusieurs catégories grâce aux codes du CSV." />}

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click() }}
            onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); void loadSelectedFile(event.dataTransfer.files?.[0]) }}
            className={cx('mt-5 cursor-pointer rounded-[26px] border-2 border-dashed p-7 text-center transition', dragging ? 'border-blue-500 bg-blue-50 shadow-[0_18px_50px_rgba(37,99,235,.14)]' : 'border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50')}
          >
            <UploadCloud className="mx-auto text-blue-600" size={34} />
            <p className="mt-3 text-sm font-black text-slate-900">Déposez votre CSV ici ou cliquez pour le sélectionner</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{fileName} · {preview.rows.length} ligne(s) de données</p>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void loadSelectedFile(event.target.files?.[0])} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={downloadTemplate} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-800"><Download size={15} />Télécharger le modèle exact</button><button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><FileSpreadsheet size={15} />Choisir un autre CSV</button></div>
        </FactorySurface>

        <FactorySurface title="3. Prévisualiser, corriger et appliquer" subtitle={`${preview.rows.length} ligne(s) détectée(s) dans ${fileName}.`} action={<PrimaryButton disabled={busy || !content.trim() || Boolean(definition?.categoryRequired && !categoryId)} onClick={() => void apply()}><CheckCircle2 size={15} />{busy ? 'Application…' : 'Appliquer maintenant'}</PrimaryButton>}>
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400"><ClipboardPaste size={14} />Édition directe autorisée avant application</div>
          {preview.headers.length ? <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-full text-left text-[10px]"><thead className="bg-slate-950 text-white"><tr>{preview.headers.slice(0, 10).map((header, index) => <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-2.5 font-black">{header || `Colonne ${index + 1}`}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100">{preview.headers.slice(0, 10).map((_, columnIndex) => <td key={columnIndex} className="max-w-[220px] truncate px-3 py-2 font-semibold text-slate-600">{row[columnIndex] || '—'}</td>)}</tr>)}</tbody></table></div> : <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800"><AlertTriangle size={16} />Aucun en-tête CSV détecté.</div>}
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={12} spellCheck={false} className="w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] leading-5 text-slate-100 outline-none focus:border-blue-400" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><FileSpreadsheet size={17} className="text-blue-600" /><p className="mt-2 text-xs font-black">Application immédiate</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Les lignes valides alimentent la Factory sans détour.</p></div><div className="rounded-2xl bg-slate-50 p-4"><Layers3 size={17} className="text-violet-600" /><p className="mt-2 text-xs font-black">Upsert par code</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Met à jour ou crée la ressource exacte.</p></div><div className="rounded-2xl bg-slate-50 p-4"><CheckCircle2 size={17} className="text-emerald-600" /><p className="mt-2 text-xs font-black">Erreurs explicites</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Chaque ligne rejetée indique la correction à faire.</p></div></div>
          {result?.errors.length ? <div className="mt-5 space-y-2">{result.errors.map((item) => <div key={`${item.row}-${item.message}`} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">Ligne {item.row}: {item.message}</div>)}</div> : null}
          {result ? <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 size={18} className="text-emerald-700" /><div className="mr-auto"><p className="text-xs font-black text-emerald-950">Catalogue actualisé</p><p className="mt-1 text-[11px] font-semibold text-emerald-700">Retournez à la Factory ou actualisez la catégorie active.</p></div><button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black text-emerald-800"><RefreshCcw size={13} />Actualiser</button><Link href={selectedCategory ? `/carelink-ops/service-design/factory/category/${encodeURIComponent(selectedCategory.code)}` : '/carelink-ops/service-design/factory'} className="rounded-xl bg-emerald-700 px-3 py-2 text-[10px] font-black text-white">Retour Factory</Link></div> : null}
        </FactorySurface>
      </div>
    </section>
  </div>
}
