'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Blocks, BookOpenCheck, CheckCircle2, ChevronRight, FileSpreadsheet, Gauge, ShieldAlert, Sparkles, X } from 'lucide-react'
import type { FactoryCataloguePayload } from '@/types/homeservice-factory'
import { DoctrineImportStudio } from './DoctrineImportStudio'
import { FactoryHero, FactorySurface, Signal, cx } from './FactoryUI'

const tone = (rule: Record<string, unknown>) => Boolean(rule.blocking)
  ? 'border-rose-200 bg-rose-50'
  : Boolean(rule.mandatory)
    ? 'border-blue-200 bg-blue-50'
    : 'border-slate-200 bg-white'

export function DoctrineCommandWorkspace({ catalogue }: { catalogue: FactoryCataloguePayload }) {
  const [categoryId, setCategoryId] = useState(catalogue.categories[0]?.id || '')
  const [query, setQuery] = useState('')
  const [showImport, setShowImport] = useState(false)
  const category = catalogue.categories.find((item) => item.id === categoryId) || catalogue.categories[0]
  const rules = useMemo(() => {
    const source = category?.doctrine || []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return source
    return source.filter((rule) => [rule.code, rule.title_fr, rule.description_fr, rule.kind, rule.severity].some((value) => String(value || '').toLowerCase().includes(normalized)))
  }, [category, query])
  const mandatory = rules.filter((rule) => Boolean(rule.mandatory)).length
  const blocking = rules.filter((rule) => Boolean(rule.blocking)).length

  if (!category) return <Signal tone="amber" title="Catalogue vide" detail="Importez ou créez d’abord une catégorie de service." />

  return <div className="space-y-6">
    <FactoryHero eyebrow="Doctrine opérationnelle directe" title="Une doctrine lisible, ciblée et immédiatement exploitable." description="Consultez les règles réelles de chaque catégorie, identifiez les trous de configuration et importez uniquement la ressource voulue. Une doctrine incomplète avertit la Factory; elle ne bloque plus la création d’un brouillon mission ou package." actions={<><Link href="/carelink-ops/service-design/factory" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-blue-600 px-4 text-xs font-black text-white"><Sparkles size={15}/> Ouvrir la Factory</Link><button type="button" aria-expanded={showImport} onClick={() => setShowImport(true)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white"><FileSpreadsheet size={15}/>Importer une ressource</button></>} />

    <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <FactorySurface title="Catégories locales" subtitle="Choisissez la catégorie dont vous voulez gouverner la doctrine.">
        <div className="space-y-2">{catalogue.categories.map((item) => <button key={item.id} onClick={() => setCategoryId(item.id)} className={cx('flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition', item.id === category.id ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-blue-200')}><span><span className="block text-xs font-black">{item.commercialName}</span><span className={cx('mt-1 block text-[9px] font-black uppercase tracking-[.12em]', item.id === category.id ? 'text-blue-100' : 'text-slate-400')}>{item.code} · v{item.versionNumber}</span></span><ChevronRight size={16}/></button>)}</div>
      </FactorySurface>

      <div className="space-y-5">
        <FactorySurface title={`${category.commercialName} · autorité locale`} subtitle={category.description || 'Doctrine, capacité et ressources directement consommées par la Factory.'}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={<BookOpenCheck size={17}/>} label="Règles" value={category.doctrine.length}/>
            <Metric icon={<CheckCircle2 size={17}/>} label="Obligatoires" value={mandatory}/>
            <Metric icon={<ShieldAlert size={17}/>} label="Bloquantes" value={blocking}/>
            <Metric icon={<Blocks size={17}/>} label="Activités" value={category.activities.length}/>
            <Metric icon={<Gauge size={17}/>} label="Capacité" value={category.capacity ? 'Configurée' : 'À importer'}/>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Readiness title="Doctrine" ready={category.doctrine.length > 0} detail={category.doctrine.length ? `${category.doctrine.length} règle(s) disponibles.` : 'Aucune règle: brouillon possible avec avertissement.'}/>
            <Readiness title="Activités" ready={category.activities.length > 0} detail={category.activities.length ? `${category.activities.length} activité(s) locale(s).` : 'Activités obligatoires pour générer un déroulé.'}/>
            <Readiness title="Tarification" ready={category.priceEntries.length > 0} detail={category.priceEntries.length ? `${category.priceEntries.length} règle(s) tarifaire(s).` : 'Résultat autorisé en « Sur devis ».'}/>
          </div>
        </FactorySurface>

        <FactorySurface title="Registre de doctrine" subtitle="Recherche directe dans les obligations, recommandations, interdictions et preuves de la catégorie." action={<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une règle…" className="min-h-11 rounded-2xl border border-slate-200 px-4 text-xs font-bold outline-none focus:border-blue-400"/>}>
          {rules.length ? <div className="grid gap-3 xl:grid-cols-2">{rules.map((rule) => <article key={String(rule.id || rule.code)} className={cx('rounded-2xl border p-4', tone(rule))}><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-600">{String(rule.kind || 'règle')}</span><div className="flex gap-1">{Boolean(rule.mandatory) ? <span className="rounded-full bg-blue-600 px-2 py-1 text-[8px] font-black uppercase text-white">obligatoire</span> : null}{Boolean(rule.blocking) ? <span className="rounded-full bg-rose-600 px-2 py-1 text-[8px] font-black uppercase text-white">sécurité</span> : null}</div></div><h3 className="mt-3 text-sm font-black text-slate-950">{String(rule.title_fr || rule.code)}</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{String(rule.description_fr || '')}</p><div className="mt-3 border-t border-black/5 pt-3 text-[10px] font-bold text-slate-500">Code {String(rule.code)} · Sévérité {String(rule.severity || 'important')} · v{String(rule.version_number || 1)}</div></article>)}</div> : <Signal tone="amber" title="Aucune règle correspondante" detail="Importez une doctrine ciblée ou retirez le filtre. La Factory restera accessible tant que des activités locales compatibles existent." />}
        </FactorySurface>
      </div>
    </section>

    {showImport ? <div className="fixed inset-0 z-[205] bg-slate-950/45 backdrop-blur-sm" onMouseDown={() => setShowImport(false)}><aside className="ml-auto h-full w-full max-w-[1320px] overflow-y-auto border-l border-slate-200 bg-[#f3f6fb] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><header className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-blue-600">Import ciblé immédiat</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950">{category.commercialName}</h2><p className="mt-1 text-xs font-semibold text-slate-500">La catégorie est présélectionnée. Les lignes valides alimentent immédiatement la Factory.</p></div><button type="button" onClick={() => setShowImport(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm" aria-label="Fermer l’import"><X size={17}/></button></header><div className="p-5 sm:p-7"><DoctrineImportStudio catalogue={catalogue} initialCategoryId={category.id} initialImportType="doctrine_rules" embedded /></div></aside></div> : null}
  </div>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) { return <div className="rounded-2xl bg-slate-50 p-4"><div className="text-blue-600">{icon}</div><p className="mt-3 text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</p></div> }
function Readiness({ title, ready, detail }: { title: string; ready: boolean; detail: string }) { return <div className={cx('rounded-2xl border p-4', ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50')}><div className="flex items-center gap-2">{ready ? <CheckCircle2 size={16} className="text-emerald-700"/> : <AlertTriangle size={16} className="text-amber-700"/>}<p className="text-xs font-black">{title}</p></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">{detail}</p></div> }
