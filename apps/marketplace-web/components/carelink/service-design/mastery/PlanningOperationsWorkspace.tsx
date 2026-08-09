import { Bot, CalendarClock, FileStack, Settings2 } from 'lucide-react'
import { masteryClient } from '@/lib/service-design-mastery/server'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'

type Kind = 'templates' | 'runs' | 'settings'
type Row = Record<string, any>

function State({ value }: { value: unknown }) { const text=String(value||'active'); return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-700">{text.replaceAll('_',' ')}</span> }
function Empty({ children }: { children: any }) { return <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">{children}</div> }

export async function PlanningOperationsWorkspace({ kind }: { kind: Kind }) {
  await requireHomeServiceAccess('homeservice_design.view')
  const client = await masteryClient(false)
  let rows: Row[] = []
  let secondary: Row[] = []
  let title = ''
  let description = ''
  let Icon = FileStack

  if (kind === 'templates') {
    const [templates, progressions] = await Promise.all([
      client.from('hsd_planning_templates').select('*').order('created_at', { ascending: false }).limit(150),
      client.from('hsd_progression_templates').select('*').order('created_at', { ascending: false }).limit(150),
    ])
    if (templates.error) throw templates.error
    if (progressions.error) throw progressions.error
    rows = templates.data || []
    secondary = progressions.data || []
    title = 'Bibliothèque de modèles réels'
    description = 'Modèles de planning et progressions réellement enregistrés dans le schéma UMZ2.'
    Icon = FileStack
  } else if (kind === 'runs') {
    const [runs, failures] = await Promise.all([
      client.from('hsd_generation_runs').select('*').order('started_at', { ascending: false }).limit(150),
      client.from('hsd_generation_run_failures').select('*').order('created_at', { ascending: false }).limit(150),
    ])
    if (runs.error) throw runs.error
    if (failures.error) throw failures.error
    rows = runs.data || []
    secondary = failures.data || []
    title = 'Registre réel des compositions'
    description = 'Route fournisseur, modèle réellement retourné, durée, tokens et échecs de chaque exécution.'
    Icon = Bot
  } else {
    const [categories, activities, capacity, templates] = await Promise.all([
      client.from('hsd_service_categories').select('id,status').limit(1000),
      client.from('hsd_activity_library').select('id,status').limit(1000),
      client.from('hsd_capacity_rules').select('id,status').limit(1000),
      client.from('hsd_planning_templates').select('id,status').limit(1000),
    ])
    if (categories.error) throw categories.error
    if (activities.error) throw activities.error
    if (capacity.error) throw capacity.error
    if (templates.error) throw templates.error
    rows = [
      { id: 'categories', name: 'Catégories de service', count: categories.data?.length || 0, status: 'registered' },
      { id: 'activities', name: 'Activités locales', count: activities.data?.length || 0, status: 'registered' },
      { id: 'capacity', name: 'Règles de capacité', count: capacity.data?.length || 0, status: 'registered' },
      { id: 'templates', name: 'Modèles de planning', count: templates.data?.length || 0, status: 'registered' },
    ]
    title = 'Configuration opérationnelle du planning'
    description = 'État réel des sources utilisées par le moteur. Aucun paramètre fictif ou valeur de démonstration.'
    Icon = Settings2
  }

  return <div className="space-y-6"><section className="relative overflow-hidden rounded-[38px] border border-slate-800 bg-[linear-gradient(135deg,#07162e,#10325b_58%,#176b8a)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,.24)]"><div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"/><div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-cyan-300"><Icon size={21}/></span><div><p className="text-[9px] font-black uppercase tracking-[.28em] text-cyan-300">Mission Plan Studio · vérité opérationnelle</p><h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">{title}</h1></div></div><p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-300">{description}</p></section>
  <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,.055)] sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">{kind === 'runs' ? 'Exécutions' : kind === 'templates' ? 'Modèles de planning' : 'Couverture de configuration'}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{rows.length} entrée(s) réelle(s).</p></div><CalendarClock className="text-blue-600"/></div>{rows.length ? <div className="mt-5 space-y-3">{rows.map((row) => <article key={row.id} className="grid gap-3 rounded-[22px] border border-slate-200 p-4 md:grid-cols-[1fr_auto]"><div><p className="font-black text-slate-950">{row.name || row.task || row.code || row.id}</p><p className="mt-1 text-xs font-semibold text-slate-500">{row.provider_route ? `${row.provider_route} · modèle ${row.actual_model || 'non retourné'}` : row.description || row.configuration ? JSON.stringify(row.configuration || row.description) : row.count != null ? `${row.count} élément(s)` : `Créé le ${row.created_at || '—'}`}</p>{row.failure_message ? <p className="mt-2 text-xs font-bold text-rose-700">{row.failure_message}</p> : null}</div><div className="flex items-center gap-3"><State value={row.status}/>{row.duration_ms != null ? <span className="text-xs font-black text-slate-500">{row.duration_ms} ms</span> : null}</div></article>)}</div> : <div className="mt-5"><Empty>Aucune entrée réelle enregistrée.</Empty></div>}</section>
  {secondary.length ? <section className="rounded-[30px] border border-slate-200 bg-white p-6"><h2 className="text-lg font-black">{kind === 'runs' ? 'Échecs explicites' : 'Progressions enregistrées'}</h2><div className="mt-4 space-y-3">{secondary.map((row) => <article key={row.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex justify-between gap-4"><div><p className="font-black">{row.name || row.error_code || row.code}</p><p className="mt-1 text-xs font-semibold text-slate-500">{row.error_message || row.description || 'Donnée enregistrée.'}</p></div><State value={row.status || (row.retryable ? 'retryable' : 'recorded')}/></div></article>)}</div></section> : null}</div>
}
