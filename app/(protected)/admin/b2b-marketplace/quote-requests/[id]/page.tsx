import Link from 'next/link'
import { notFound } from 'next/navigation'
import QuoteRequestDossierActions from '@/components/b2b-marketplace/QuoteRequestDossierActions'
import { getQuoteDossier, QUOTE_CRM_STATUS_LABELS } from '@/lib/b2b-marketplace/crm'
import { moneyMad } from '@/lib/b2b-marketplace/repository'

export const dynamic = 'force-dynamic'

function statusPill(status: string) {
  if (status === 'accepted') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (status === 'lost' || status === 'archived') return 'bg-slate-100 text-slate-600 border-slate-200'
  if (status === 'new_request' || status === 'to_qualify') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dossier = await getQuoteDossier(id)
  if (!dossier) notFound()
  const { request, lines, notes, statusHistory, activities } = dossier

  return (
    <main className="min-h-screen bg-[#f4f8fd] px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/b2b-marketplace/quote-requests" className="text-sm font-black text-[#0f2f5f]">← CRM & demandes B2B</Link>
          <div className="flex flex-wrap gap-2">
            {request.originUrl ? <a href={request.originUrl} target="_blank" className="rounded-full border border-[#d7e3f3] bg-white px-4 py-2 text-xs font-black text-[#0f2f5f]">Source front</a> : null}
            <span className="rounded-full border border-[#d7e3f3] bg-white px-4 py-2 text-xs font-black text-[#0f2f5f]">Dossier audit-ready</span>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[42px] border border-[#dbe7f6] bg-white p-7 shadow-sm">
          <div className="rounded-[34px] bg-[#071f44] p-8 text-white shadow-2xl shadow-blue-950/20">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">{request.quoteReference}</span>
                  <span className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${statusPill(request.status)}`}>{QUOTE_CRM_STATUS_LABELS[request.status]}</span>
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{request.schoolName}</h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">{request.message || 'Demande B2B marketplace à qualifier et convertir en devis/proposition AngelCare.'}</p>
              </div>
              <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                <div className="text-sm font-bold text-blue-100">Valeur indicative</div>
                <div className="mt-2 text-4xl font-black">{moneyMad(lines.reduce((sum, line) => sum + line.totalMad, 0) || request.estimatedTotalMad)}</div>
                <div className="mt-3 text-sm font-bold text-blue-100">{lines.length} lignes • {request.city}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="grid gap-5">
            <section className="rounded-[30px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Identité client</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Contact</dt><dd className="font-black text-slate-950">{request.contactName}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Téléphone</dt><dd className="font-black text-slate-950">{request.phone}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Email</dt><dd className="font-black text-slate-950">{request.email}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Ville</dt><dd className="font-black text-slate-950">{request.city}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Source</dt><dd className="font-black text-slate-950">{request.source}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Assigné</dt><dd className="font-black text-slate-950">{request.assignedName || 'Non assigné'}</dd></div>
              </dl>
            </section>
            <QuoteRequestDossierActions id={request.id} currentStatus={request.status} assignedName={request.assignedName} phone={request.phone} email={request.email} request={request} lines={lines} />
          </aside>

          <section className="grid gap-6">
            <div className="rounded-[30px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-slate-950">Sélection demandée</h2>
                <span className="rounded-full bg-[#eef4ff] px-4 py-2 text-xs font-black text-[#0f2f5f]">{lines.length} lignes</span>
              </div>
              <div className="mt-5 grid gap-3">
                {lines.map((line) => (
                  <div key={line.id} className="grid gap-3 rounded-[24px] border border-[#edf2f8] bg-[#f9fbfe] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-[#0f2f5f]">{line.itemType} • {line.referenceCode}</div>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{line.title}</h3>
                      {line.personalizationNotes ? <p className="mt-1 text-sm font-bold text-slate-500">{line.personalizationNotes}</p> : null}
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700">Qté {line.quantity}</div>
                    <div className="text-right text-lg font-black text-[#0f2f5f]">{moneyMad(line.totalMad)}</div>
                  </div>
                ))}
                {!lines.length ? <div className="rounded-[24px] border border-dashed border-[#cbdced] p-6 text-center text-sm font-bold text-slate-500">Aucune ligne enregistrée.</div> : null}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[30px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">Notes internes</h2>
                <div className="mt-5 grid gap-3">
                  {notes.map((note) => <div key={note.id} className="rounded-[22px] border border-[#edf2f8] bg-[#f9fbfe] p-4"><p className="text-sm font-bold leading-6 text-slate-700">{note.note}</p><div className="mt-2 text-xs font-black text-slate-400">{note.createdByName || 'AngelCare'} • {note.createdAt ? new Date(note.createdAt).toLocaleString('fr-FR') : ''}</div></div>)}
                  {!notes.length ? <p className="text-sm font-bold text-slate-500">Aucune note pour le moment.</p> : null}
                </div>
              </section>

              <section className="rounded-[30px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-slate-950">Timeline activité</h2>
                <div className="mt-5 grid gap-3">
                  {[...activities, ...statusHistory.map((s) => ({ id: s.id, title: `Statut: ${s.fromStatus || '—'} → ${s.toStatus}`, description: s.note, createdAt: s.createdAt, activityType: 'status' }))].slice(0, 12).map((item) => <div key={item.id} className="rounded-[22px] border border-[#edf2f8] bg-[#f9fbfe] p-4"><div className="text-sm font-black text-slate-950">{item.title}</div><p className="mt-1 text-xs font-bold text-slate-500">{item.description}</p><div className="mt-2 text-xs font-black text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR') : ''}</div></div>)}
                  {!activities.length && !statusHistory.length ? <p className="text-sm font-bold text-slate-500">Aucune activité enregistrée.</p> : null}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
