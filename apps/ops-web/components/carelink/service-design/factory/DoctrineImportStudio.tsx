'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Layers3, UploadCloud } from 'lucide-react'
import type { FactoryCataloguePayload, DirectImportResult } from '@/types/homeservice-factory'
import { DIRECT_IMPORT_TYPES } from '@/lib/homeservice-factory/constants'
import { FactoryHero, FactorySurface, PrimaryButton, Signal, cx } from './FactoryUI'

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

export function DoctrineImportStudio({ catalogue, initialCategoryId, embedded = false }: { catalogue: FactoryCataloguePayload; initialCategoryId?: string; embedded?: boolean }) {
  const [importType, setImportType] = useState('doctrine_rules')
  const [categoryId, setCategoryId] = useState(initialCategoryId || catalogue.categories[0]?.id || '')
  const [fileName, setFileName] = useState('doctrine_rules.csv')
  const [content, setContent] = useState(templates.doctrine_rules)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<DirectImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const definition = DIRECT_IMPORT_TYPES.find((item) => item.code === importType)
  const lines = useMemo(() => content.trim() ? content.trim().split(/\r?\n/).length - 1 : 0, [content])

  function selectType(value: string) { setImportType(value); setFileName(`${value}.csv`); setContent(templates[value] || ''); setResult(null); setError(null) }
  function downloadTemplate() {
    const blob = new Blob([templates[importType] || ''], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${importType}_homeservice.csv`; anchor.click(); URL.revokeObjectURL(url)
  }
  async function apply() {
    setBusy(true); setResult(null); setError(null)
    try {
      const response = await fetch('/api/carelink-ops/service-design/factory/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ importType, categoryId: definition?.categoryRequired ? categoryId : null, fileName, content }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Échec de l’import.')
      setResult(payload.data)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Échec de l’import.') }
    finally { setBusy(false) }
  }

  return <div className="space-y-6">{embedded ? null : <FactoryHero eyebrow="Doctrine & Catalogue Import Studio" title="Importer exactement ce dont vous avez besoin." description="Choisissez une catégorie, choisissez une ressource précise, chargez son CSV et appliquez immédiatement les lignes valides. Pas de staging obligatoire, pas de board, pas de validation générale du dossier. Les ressources importées deviennent disponibles pour la composition de brouillons." />}
    {error ? <Signal tone="rose" title="Import interrompu" detail={error} /> : null}
    {result ? <Signal tone={result.rejectedRows ? 'amber' : 'emerald'} title={`${result.appliedRows}/${result.totalRows} ligne(s) appliquée(s)`} detail={result.rejectedRows ? `${result.rejectedRows} ligne(s) rejetée(s). Consultez le détail ci-dessous.` : 'Les données sont immédiatement disponibles dans la Factory.'} /> : null}
    <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <FactorySurface title="1. Ressource ciblée" subtitle="Un import = un objectif clair."><div className="space-y-2">{DIRECT_IMPORT_TYPES.map((item) => <button key={item.code} onClick={() => selectType(item.code)} className={cx('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-xs font-black', importType === item.code ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200')}><span>{item.label}</span><span className={cx('rounded-full px-2 py-1 text-[8px] uppercase', importType === item.code ? 'bg-white/15' : 'bg-slate-100 text-slate-500')}>{item.categoryRequired ? 'par catégorie' : 'global'}</span></button>)}</div></FactorySurface>
      <div className="space-y-6"><FactorySurface title="2. Catégorie et fichier" subtitle="La catégorie sélectionnée est appliquée aux lignes qui n’ont pas de category_code.">
        {definition?.categoryRequired ? <label className="block space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Catégorie cible</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black"><option value="">Sélectionner</option>{catalogue.categories.map((item) => <option key={item.id} value={item.id}>{item.commercialName} · {item.code}</option>)}</select></label> : <Signal tone="blue" title="Référentiel global" detail="Cette ressource peut être reliée à plusieurs catégories grâce aux codes présents dans le CSV." />}
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={downloadTemplate} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-800"><Download size={15} /> Télécharger le modèle exact</button><label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700"><UploadCloud size={15} /> Charger mon CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readFile(file).then((text) => { setFileName(file.name); setContent(text) }) }} /></label></div>
      </FactorySurface>
      <FactorySurface title="3. Prévisualisation et application" subtitle={`${lines} ligne(s) détectée(s) dans ${fileName}.`} action={<PrimaryButton disabled={busy || !content.trim() || Boolean(definition?.categoryRequired && !categoryId)} onClick={() => void apply()}><CheckCircle2 size={15} />{busy ? 'Application…' : 'Appliquer maintenant'}</PrimaryButton>}>
        <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400"><ClipboardPaste size={14} /> Édition directe autorisée avant application</div><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} spellCheck={false} className="w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[11px] leading-5 text-slate-100 outline-none focus:border-blue-400" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><FileSpreadsheet size={17} className="text-blue-600" /><p className="mt-2 text-xs font-black">Lignes valides appliquées</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Disponibles immédiatement pour la Factory.</p></div><div className="rounded-2xl bg-slate-50 p-4"><Layers3 size={17} className="text-violet-600" /><p className="mt-2 text-xs font-black">Upsert intelligent</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Met à jour par code ou crée la ressource.</p></div><div className="rounded-2xl bg-slate-50 p-4"><CheckCircle2 size={17} className="text-emerald-600" /><p className="mt-2 text-xs font-black">Erreurs ligne par ligne</p><p className="mt-1 text-[11px] font-semibold text-slate-500">Les autres lignes ne sont pas bloquées.</p></div></div>
        {result?.errors.length ? <div className="mt-5 space-y-2">{result.errors.map((item) => <div key={`${item.row}-${item.message}`} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900">Ligne {item.row}: {item.message}</div>)}</div> : null}
      </FactorySurface></div>
    </section>
  </div>
}
