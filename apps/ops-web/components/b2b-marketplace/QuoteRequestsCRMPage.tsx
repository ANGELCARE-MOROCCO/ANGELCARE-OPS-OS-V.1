import Link from 'next/link'
import { QUOTE_CRM_STATUS_LABELS, QUOTE_CRM_STATUSES, listQuoteRequests, getQuoteCRMStats } from '@/lib/b2b-marketplace/crm'
import { moneyMad } from '@/lib/b2b-marketplace/repository'

type SearchParams = Record<string, string | string[] | undefined>

function value(params: SearchParams, key: string) {
  const raw = params[key]
  return Array.isArray(raw) ? raw[0] || '' : raw || ''
}

function statusClass(status: string) {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (status === 'lost' || status === 'archived') return 'bg-slate-100 text-slate-700 border-slate-200'
  if (status === 'new_request' || status === 'to_qualify') return 'bg-blue-50 text-blue-800 border-blue-200'
  if (status === 'quote_sent' || status === 'followup_scheduled') return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-indigo-50 text-indigo-800 border-indigo-200'
}

function priorityClass(priority: string) {
  if (priority === 'urgent') return 'bg-rose-600 text-white'
  if (priority === 'high') return 'bg-orange-100 text-orange-800'
  if (priority === 'low') return 'bg-slate-100 text-slate-600'
  return 'bg-[#eef4ff] text-[#0f2f5f]'
}

export default async function QuoteRequestsCRMPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = {
    status: value(searchParams, 'status'),
    source: value(searchParams, 'source'),
    city: value(searchParams, 'city'),
    priority: value(searchParams, 'priority'),
    assigned: value(searchParams, 'assigned'),
    search: value(searchParams, 'q'),
  }

  let requests = [] as Awaited<ReturnType<typeof listQuoteRequests>>
  let stats = { total: 0, open: 0, accepted: 0, urgent: 0, estimated: 0, byStatus: [] as Array<{ status: string; label: string; count: number }> }
  let error = ''
  try {
    requests = await listQuoteRequests(filters)
    stats = await getQuoteCRMStats()
  } catch (err) {
    error = err instanceof Error ? err.message : 'CRM database unavailable'
  }

  return (
    <main className="min-h-screen bg-[#f4f8fd] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/b2b-marketplace" className="text-sm font-black text-[#0f2f5f]">← Marketplace Admin Studio</Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/b2b-marketplace/quote-cart" target="_blank" className="rounded-full border border-[#d7e3f3] bg-white px-4 py-2 text-xs font-black text-[#0f2f5f] shadow-sm">Tester demande front</Link>
            <Link href="/admin/b2b-marketplace/quote-settings" className="rounded-full border border-[#d7e3f3] bg-white px-4 py-2 text-xs font-black text-[#0f2f5f] shadow-sm">Paramètres devis</Link>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[42px] border border-[#dbe7f6] bg-white p-7 shadow-sm">
          <div className="relative overflow-hidden rounded-[34px] bg-[#071f44] p-8 text-white shadow-2xl shadow-blue-950/20">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute -bottom-24 left-16 h-72 w-72 rounded-full bg-[#d8a84a]/25 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white">CRM & Demandes B2B • Production synced</div>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">Command Center commercial des demandes marketplace</h1>
                <p className="mt-5 max-w-4xl text-lg leading-8 text-white/85">Chaque demande de devis, prix de gros, pack sur-mesure, produit, formation ou message client devient un dossier CRM traité, assigné, suivi et historisé.</p>
              </div>
              <div className="grid gap-3 rounded-[28px] border border-white/15 bg-white/10 p-5 text-white backdrop-blur">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Inbox totale</span><strong className="text-3xl font-black text-white">{stats.total}</strong></div>
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Ouvertes</span><strong className="text-3xl font-black text-white">{stats.open}</strong></div>
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Prioritaires</span><strong className="text-3xl font-black text-white">{stats.urgent}</strong></div>
                <div className="rounded-2xl bg-white/10 p-4 text-sm font-black text-white">Valeur indicative: {moneyMad(stats.estimated)}</div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm font-black text-rose-800">CRM non connecté: {error}. Exécutez la migration SQL CRM puis rechargez.</div>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-5">
          {stats.byStatus.map((item) => (
            <Link key={item.status} href={`/admin/b2b-marketplace/quote-requests?status=${item.status}`} className="rounded-[26px] border border-[#dbe7f6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70">
              <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(item.status)}`}>{item.label}</div>
              <div className="mt-4 text-4xl font-black text-slate-950">{item.count}</div>
              <p className="mt-1 text-xs font-bold text-slate-500">dossiers</p>
            </Link>
          ))}
        </section>

        <section className="mt-6 rounded-[34px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
          <form className="grid gap-3 md:grid-cols-6">
            <input name="q" defaultValue={filters.search} placeholder="Recherche ref, crèche, contact, email, téléphone..." className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-[#0f2f5f] md:col-span-2" />
            <select name="status" defaultValue={filters.status || 'all'} className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-[#0f2f5f]">
              <option value="all">Tous statuts</option>
              {QUOTE_CRM_STATUSES.map((status) => <option key={status} value={status}>{QUOTE_CRM_STATUS_LABELS[status]}</option>)}
            </select>
            <select name="priority" defaultValue={filters.priority || 'all'} className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-[#0f2f5f]">
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option><option value="high">Haute</option><option value="normal">Normale</option><option value="low">Basse</option>
            </select>
            <input name="city" defaultValue={filters.city} placeholder="Ville" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-[#0f2f5f]" />
            <button className="rounded-2xl bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15">Filtrer</button>
          </form>
        </section>

        <section className="mt-6 grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="group grid gap-5 rounded-[32px] border border-[#dbe7f6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 lg:grid-cols-[1.2fr_0.8fr_0.75fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0f2f5f]">{request.quoteReference}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${priorityClass(request.priority)}`}>{request.priority}</span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(request.status)}`}>{QUOTE_CRM_STATUS_LABELS[request.status]}</span>
                </div>
                <h2 className="mt-3 text-2xl font-black text-slate-950">{request.schoolName}</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">{request.contactName} • {request.city} • {request.source}</p>
                {request.message ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{request.message}</p> : null}
              </div>
              <div className="rounded-[24px] border border-[#edf2f8] bg-[#f9fbfe] p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Contact</div>
                <div className="mt-2 text-sm font-black text-slate-950">{request.phone}</div>
                <div className="mt-1 text-sm font-bold text-slate-500">{request.email}</div>
              </div>
              <div className="rounded-[24px] border border-[#edf2f8] bg-[#f9fbfe] p-4">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Valeur / suite</div>
                <div className="mt-2 text-xl font-black text-[#0f2f5f]">{moneyMad(request.estimatedTotalMad)}</div>
                <div className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{request.nextAction || 'À qualifier'}</div>
              </div>
              <Link href={`/admin/b2b-marketplace/quote-requests/${request.id}`} className="rounded-full bg-[#0f2f5f] px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-blue-950/15 transition group-hover:-translate-y-0.5">Ouvrir dossier →</Link>
            </article>
          ))}
          {!requests.length && !error ? (
            <div className="rounded-[32px] border border-dashed border-[#cbdced] bg-white p-10 text-center">
              <h2 className="text-2xl font-black text-slate-950">Aucune demande trouvée</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">Les demandes front arriveront ici après soumission du panier B2B.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
