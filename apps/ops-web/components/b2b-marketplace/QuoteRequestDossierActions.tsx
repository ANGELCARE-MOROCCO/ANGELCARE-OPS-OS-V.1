'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { QUOTE_CRM_STATUS_LABELS, QUOTE_CRM_STATUSES, type QuoteCRMStatus } from '@/lib/b2b-marketplace/crm-constants'
import type { QuoteCRMLine, QuoteCRMRequest } from '@/lib/b2b-marketplace/crm'

type Props = { id: string; currentStatus: QuoteCRMStatus; assignedName?: string; phone?: string; email?: string; request?: QuoteCRMRequest; lines?: QuoteCRMLine[] }
type Notice = { type: 'success' | 'error'; text: string }
type EditableLine = { id: string; itemType: string; referenceCode: string; title: string; quantity: number; unitPriceMad: number; personalizationNotes: string; sourcePage?: string; itemSlug?: string }

async function requestJSON(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, cache: 'no-store' })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok || !payload.ok) throw new Error(payload.error || payload.message || 'Action impossible')
  return payload
}

function moneyMad(value: number) { return `${Number(value || 0).toLocaleString('fr-FR')} MAD` }
function cleanPhone(value?: string) { return String(value || '').replace(/[^0-9]/g, '') }

export default function QuoteRequestDossierActions({ id, currentStatus, assignedName, phone, email, request, lines = [] }: Props) {
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [lineDrafts, setLineDrafts] = useState<EditableLine[]>(() => lines.map((line) => ({ id: line.id, itemType: line.itemType || 'product', referenceCode: line.referenceCode || '', title: line.title || '', quantity: Number(line.quantity || 1), unitPriceMad: Number(line.unitPriceMad || line.estimatedUnitPriceMad || 0), personalizationNotes: line.personalizationNotes || line.description || '', sourcePage: line.sourcePage || '', itemSlug: line.itemSlug || '' })))
  const computedTotal = useMemo(() => lineDrafts.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPriceMad || 0), 0), [lineDrafts])

  async function run(label: string, fn: () => Promise<unknown>, opts: { reload?: boolean; redirect?: string } = {}) {
    setNotice(null)
    try {
      await fn()
      setNotice({ type: 'success', text: `${label} confirmé — données synchronisées.` })
      if (opts.redirect) setTimeout(() => router.push(opts.redirect!), 600)
      else if (opts.reload !== false) setTimeout(() => router.refresh(), 550)
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Action impossible' })
    }
  }

  function statusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(() => { void run('Statut mis à jour', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status: String(form.get('status') || ''), note: String(form.get('note') || '') }) })) })
  }

  function noteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = String(new FormData(event.currentTarget).get('note') || '')
    startTransition(() => { void run('Note ajoutée', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/notes`, { method: 'POST', body: JSON.stringify({ note, noteType: 'internal' }) })) })
  }

  function assignSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    startTransition(() => { void run('Assignation mise à jour', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/assign`, { method: 'POST', body: JSON.stringify({ assignedName: String(form.get('assignedName') || ''), priority: String(form.get('priority') || 'normal'), nextAction: String(form.get('nextAction') || ''), followUpAt: String(form.get('followUpAt') || '') }) })) })
  }

  function requestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = { school_name: String(form.get('school_name') || ''), contact_name: String(form.get('contact_name') || ''), phone: String(form.get('phone') || ''), email: String(form.get('email') || ''), city: String(form.get('city') || ''), message: String(form.get('message') || ''), internal_summary: String(form.get('internal_summary') || ''), estimated_total_mad: computedTotal }
    startTransition(() => { void run('Dossier client sauvegardé', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}`, { method: 'PATCH', body: JSON.stringify(body) })) })
  }

  function activity(type: string, title: string) { startTransition(() => { void run(title, () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/activity`, { method: 'POST', body: JSON.stringify({ activityType: type, title, description: title }) }), { reload: false }) }) }
  function updateLine(index: number, patch: Partial<EditableLine>) { setLineDrafts((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item))) }

  function saveLine(line: EditableLine) {
    startTransition(() => { void run(`Ligne ${line.referenceCode || line.title} sauvegardée`, () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/lines/${line.id}`, { method: 'PATCH', body: JSON.stringify({ item_type: line.itemType, reference_code: line.referenceCode, title: line.title, quantity: Number(line.quantity || 1), unit_price_mad: Number(line.unitPriceMad || 0), estimated_unit_price_mad: Number(line.unitPriceMad || 0), total_mad: Number(line.quantity || 1) * Number(line.unitPriceMad || 0), personalization_notes: line.personalizationNotes, source_page: line.sourcePage, item_slug: line.itemSlug }) })) })
  }

  function deleteLine(line: EditableLine) {
    if (!window.confirm(`Supprimer définitivement la ligne ${line.referenceCode || line.title} ?`)) return
    startTransition(() => { void run('Ligne supprimée', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/lines/${line.id}`, { method: 'DELETE' })) })
  }

  function addLine() {
    startTransition(() => { void run('Nouvelle ligne ajoutée', async () => {
      const payload = await requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/lines`, { method: 'POST', body: JSON.stringify({ item_type: 'product', reference_code: 'À-COMPLÉTER', title: 'Nouvelle ligne devis', quantity: 1, unit_price_mad: 0, estimated_unit_price_mad: 0, total_mad: 0, personalization_notes: '' }) })
      const created = payload.data
      setLineDrafts((items) => [...items, { id: created.id, itemType: created.item_type || 'product', referenceCode: created.reference_code || 'À-COMPLÉTER', title: created.title || 'Nouvelle ligne devis', quantity: Number(created.quantity || 1), unitPriceMad: Number(created.unit_price_mad || created.estimated_unit_price_mad || 0), personalizationNotes: created.personalization_notes || '', sourcePage: created.source_page || '', itemSlug: created.item_slug || '' }])
    }, { reload: false }) })
  }

  function deleteRequest() {
    if (deleteConfirm !== 'SUPPRIMER') { setNotice({ type: 'error', text: 'Tapez SUPPRIMER pour confirmer la suppression permanente du dossier.' }); return }
    if (!window.confirm('Suppression permanente du dossier CRM, lignes, notes, historique et propositions. Continuer ?')) return
    startTransition(() => { void run('Dossier supprimé définitivement', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}`, { method: 'DELETE' }), { redirect: '/admin/b2b-marketplace/quote-requests' }) })
  }

  function prepareAndPrint() {
    startTransition(() => { void run('Devis A4 préparé', async () => {
      await requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/devis`, { method: 'POST', body: JSON.stringify({ print: true, total_mad: computedTotal }) })
      window.open(`/devis-b2b/${id}`, '_blank', 'noopener,noreferrer')
    }, { reload: false }) })
  }

  const whatsapp = phone ? `https://wa.me/${cleanPhone(phone)}` : '#'

  return (
    <div className="grid gap-5">
      {notice ? <div className={`rounded-2xl px-4 py-3 text-sm font-black ${notice.type === 'error' ? 'border border-rose-200 bg-rose-50 text-rose-800' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{notice.text}</div> : null}
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={phone ? `tel:${phone}` : '#'} onClick={() => activity('call_click', 'Appel client lancé')} className="rounded-2xl bg-[#0f2f5f] px-4 py-3 text-center text-sm font-black text-white">Appeler</a>
        <a href={whatsapp} target="_blank" onClick={() => activity('whatsapp_click', 'WhatsApp client ouvert')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white">WhatsApp</a>
        <a href={email ? `mailto:${email}` : '#'} onClick={() => activity('email_click', 'Email client ouvert')} className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white">Email</a>
      </div>

      <section className="rounded-[28px] border border-[#dbe7f6] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f2f5f]">Dossier commercial</div><h3 className="mt-1 text-lg font-black text-slate-950">Modifier & sauvegarder les détails client</h3></div><button type="button" onClick={prepareAndPrint} disabled={isPending} className="rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15 disabled:opacity-60">Préparer / imprimer devis A4</button></div>
        <form onSubmit={requestSubmit} className="mt-4 grid gap-3">
          <input name="school_name" defaultValue={request?.schoolName || ''} placeholder="Crèche / établissement" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" />
          <div className="grid gap-3 md:grid-cols-2"><input name="contact_name" defaultValue={request?.contactName || ''} placeholder="Nom contact" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><input name="city" defaultValue={request?.city || ''} placeholder="Ville" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><input name="phone" defaultValue={request?.phone || ''} placeholder="Téléphone" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><input name="email" defaultValue={request?.email || ''} placeholder="Email" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /></div>
          <textarea name="message" defaultValue={request?.message || ''} rows={3} placeholder="Message client / besoin exprimé" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" />
          <textarea name="internal_summary" defaultValue={request?.internalSummary || ''} rows={3} placeholder="Résumé commercial interne" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" />
          <button disabled={isPending} className="rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{isPending ? 'Synchronisation...' : 'Sauvegarder dossier'}</button>
        </form>
      </section>

      <form onSubmit={statusSubmit} className="rounded-[28px] border border-[#dbe7f6] bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Changer le statut</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><select name="status" defaultValue={currentStatus} className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none">{QUOTE_CRM_STATUSES.map((status) => <option key={status} value={status}>{QUOTE_CRM_STATUS_LABELS[status]}</option>)}</select><input name="note" placeholder="Note de changement de statut" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /></div><button disabled={isPending} className="mt-3 rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white disabled:opacity-60">Sauvegarder statut</button></form>
      <form onSubmit={assignSubmit} className="rounded-[28px] border border-[#dbe7f6] bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Assignation & prochaine action</h3><div className="mt-4 grid gap-3 md:grid-cols-2"><input name="assignedName" defaultValue={assignedName || ''} placeholder="Assigné à" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><select name="priority" defaultValue={request?.priority || 'normal'} className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none"><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option><option value="low">Basse</option></select><input name="nextAction" defaultValue={request?.nextAction || ''} placeholder="Prochaine action" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><input name="followUpAt" type="datetime-local" className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /></div><button disabled={isPending} className="mt-3 rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white disabled:opacity-60">Enregistrer</button></form>
      <section className="rounded-[28px] border border-[#dbe7f6] bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0f2f5f]">Lignes devis</div><h3 className="mt-1 text-lg font-black text-slate-950">Modifier produits, formations, prix, quantités</h3></div><div className="text-right"><div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Total synchronisé</div><div className="text-xl font-black text-slate-950">{moneyMad(computedTotal)}</div></div></div><div className="mt-4 grid gap-4">{lineDrafts.map((line, index) => <div key={line.id} className="rounded-[22px] border border-[#edf2f8] bg-[#f9fbfe] p-4"><div className="grid gap-3 md:grid-cols-[0.7fr_0.9fr_1.4fr]"><select value={line.itemType} onChange={(e) => updateLine(index, { itemType: e.target.value })} className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950"><option value="product">Produit</option><option value="training">Formation</option><option value="pack">Pack</option><option value="custom">Sur-mesure</option></select><input value={line.referenceCode} onChange={(e) => updateLine(index, { referenceCode: e.target.value })} className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950" /><input value={line.title} onChange={(e) => updateLine(index, { title: e.target.value })} className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950" /></div><div className="mt-3 grid gap-3 md:grid-cols-[0.5fr_0.7fr_1fr_auto_auto]"><input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(index, { quantity: Number(e.target.value || 1) })} className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950" /><input type="number" min="0" value={line.unitPriceMad} onChange={(e) => updateLine(index, { unitPriceMad: Number(e.target.value || 0) })} className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950" /><input value={line.personalizationNotes} onChange={(e) => updateLine(index, { personalizationNotes: e.target.value })} placeholder="Notes / personnalisation" className="rounded-2xl border border-[#dbe7f6] bg-white px-4 py-3 text-sm font-bold text-slate-950" /><button type="button" onClick={() => saveLine(line)} disabled={isPending} className="rounded-full bg-[#0f2f5f] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Sauvegarder ligne</button><button type="button" onClick={() => deleteLine(line)} disabled={isPending} className="rounded-full bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-60">Supprimer</button></div><div className="mt-2 text-xs font-black text-slate-500">Sous-total: {moneyMad(Number(line.quantity || 0) * Number(line.unitPriceMad || 0))}</div></div>)}</div><button type="button" onClick={addLine} disabled={isPending} className="mt-4 rounded-full bg-[#fff8e8] px-5 py-3 text-sm font-black text-[#8a5a08] disabled:opacity-60">+ Ajouter une ligne devis</button></section>
      <form onSubmit={noteSubmit} className="rounded-[28px] border border-[#dbe7f6] bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-950">Ajouter une note interne</h3><textarea name="note" required rows={4} placeholder="Compte-rendu appel, précision client, décision commerciale..." className="mt-4 w-full rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-950 outline-none" /><button disabled={isPending} className="mt-3 rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white disabled:opacity-60">Ajouter note</button></form>
      <button disabled={isPending} onClick={() => startTransition(() => { void run('Dossier converti', () => requestJSON(`/api/b2b-marketplace/admin/quote-requests/${id}/convert-proposal`, { method: 'POST', body: JSON.stringify({ total_mad: computedTotal }) })) })} className="rounded-[22px] border border-[#d8a84a]/40 bg-[#fff8e8] px-5 py-4 text-sm font-black text-[#8a5a08] disabled:opacity-60">Convertir en proposition commerciale</button>
      <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5"><h3 className="text-lg font-black text-rose-900">Suppression permanente</h3><p className="mt-2 text-sm font-bold text-rose-700">Tapez SUPPRIMER puis confirmez pour effacer le dossier et ses lignes.</p><div className="mt-4 flex gap-3"><input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="SUPPRIMER" className="min-w-0 flex-1 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-950" /><button type="button" onClick={deleteRequest} disabled={isPending} className="rounded-full bg-rose-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60">Supprimer définitivement</button></div></section>
    </div>
  )
}
