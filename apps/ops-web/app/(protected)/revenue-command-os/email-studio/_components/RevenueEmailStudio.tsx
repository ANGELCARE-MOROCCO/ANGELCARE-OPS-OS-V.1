'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Inbox,
  Loader2,
  LockKeyhole,
  MailCheck,
  MailPlus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  XCircle,
} from 'lucide-react'

type Assignment = {
  assignmentId: string
  mailboxId: string
  mailboxEmail?: string | null
  mailboxName?: string | null
  role?: string
  status?: string
  session_status?: string
  row_state?: string
  security_status?: string
  permissions?: { can_read?: boolean; can_send?: boolean; can_reply?: boolean; can_manage_templates?: boolean; can_view_logs?: boolean }
}

type Workspace = {
  mailboxes: Array<Record<string, any>>
  inbox: Array<Record<string, any>>
  outbox: Array<Record<string, any>>
  drafts: Array<Record<string, any>>
  templates: Array<Record<string, any>>
  audit: Array<Record<string, any>>
  diagnostics?: Record<string, number>
}

type FormState = {
  toEmail: string
  ccEmail: string
  bccEmail: string
  subject: string
  bodyHtml: string
  priority: string
  scheduledAt: string
  tracking: boolean
  templateId: string
  contextType: string
  contextReference: string
  followUpAt: string
}

const EMPTY_FORM: FormState = {
  toEmail: '', ccEmail: '', bccEmail: '', subject: '', bodyHtml: '', priority: 'normal', scheduledAt: '', tracking: true, templateId: '', contextType: 'prospect', contextReference: '', followUpAt: '',
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || `Erreur HTTP ${response.status}`)
  return payload.data as T
}

function statusTone(status: unknown) {
  const value = String(status || '').toLowerCase()
  if (['sent', 'delivered', 'opened', 'succeeded', 'active'].includes(value)) return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (['failed', 'bounced', 'rejected', 'revoked'].includes(value)) return 'bg-rose-50 text-rose-800 border-rose-200'
  if (['scheduled', 'queued', 'sending'].includes(value)) return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

function displayDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR')
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Inbox; label: string; value: number | string; note: string }) {
  return <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_44px_rgba(15,23,42,.055)]"><div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black tracking-[-.04em] text-slate-950">{value}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={19} /></span></div><p className="mt-3 text-[10px] font-bold text-slate-500">{note}</p></article>
}

export default function RevenueEmailStudio() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [operatorName, setOperatorName] = useState('Opérateur Revenue OS')
  const [busy, setBusy] = useState(true)
  const [actionBusy, setActionBusy] = useState<'draft' | 'send' | 'schedule' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const selected = useMemo(() => assignments.find((item) => item.mailboxId === selectedId) || null, [assignments, selectedId])
  const unlocked = selected?.session_status === 'active'
  const canSend = Boolean(selected?.permissions?.can_send)

  const loadAssignments = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await requestJson<any>('/api/email-os/access/my-mailboxes')
      const rows: Assignment[] = (data?.assignments || []).filter((item: Assignment) => item.status === 'active')
      setAssignments(rows)
      setOperatorName(data?.operator?.name || 'Opérateur Revenue OS')
      setSelectedId((current) => current && rows.some((item) => item.mailboxId === current)
        ? current
        : rows.find((item) => item.session_status === 'active')?.mailboxId || rows[0]?.mailboxId || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les mailboxes assignées.')
    } finally {
      setBusy(false)
    }
  }, [])

  const loadWorkspace = useCallback(async (mailboxId: string) => {
    if (!mailboxId) return setWorkspace(null)
    const assignment = assignments.find((item) => item.mailboxId === mailboxId)
    if (assignment?.session_status !== 'active') return setWorkspace(null)
    setBusy(true)
    setError(null)
    try {
      setWorkspace(await requestJson<Workspace>(`/api/email-os/enterprise-workspace?mailboxId=${encodeURIComponent(mailboxId)}`))
    } catch (cause) {
      setWorkspace(null)
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le workspace Email OS.')
    } finally {
      setBusy(false)
    }
  }, [assignments])

  useEffect(() => { void loadAssignments() }, [loadAssignments])
  useEffect(() => { if (assignments.length) void loadWorkspace(selectedId) }, [assignments.length, selectedId, loadWorkspace])

  const submit = async (mode: 'draft' | 'send' | 'schedule') => {
    if (!selected || !unlocked || !canSend) return
    if (!form.toEmail.trim() || !form.subject.trim() || !form.bodyHtml.trim()) {
      setError('Destinataire, objet et message sont obligatoires.')
      return
    }
    if (mode === 'schedule' && !form.scheduledAt) {
      setError('Choisissez une date et une heure futures pour la programmation.')
      return
    }
    setActionBusy(mode)
    setError(null)
    setNotice(null)
    try {
      const endpoint = mode === 'send' ? '/api/email-os/compose/send' : '/api/email-os/compose/draft'
      const scheduledAt = mode === 'schedule' ? new Date(form.scheduledAt).toISOString() : undefined
      await requestJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mailboxId: selected.mailboxId,
          toEmail: form.toEmail,
          ccEmail: form.ccEmail,
          bccEmail: form.bccEmail,
          subject: form.subject,
          bodyHtml: form.bodyHtml,
          bodyText: form.bodyHtml.replace(/<[^>]*>/g, ' '),
          priority: form.priority,
          tracking: form.tracking,
          templateId: form.templateId || undefined,
          status: mode === 'schedule' ? 'scheduled' : 'draft',
          scheduledAt,
          diagnostics: { source: 'revenue-command-os', studio: 'revenue-email-studio', businessPurpose: 'revenue-operations', relatedEntity: { type: form.contextType, reference: form.contextReference || null }, nextFollowUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : null },
        }),
      })
      setNotice(mode === 'send' ? 'Email confié à Email OS pour envoi et suivi.' : mode === 'schedule' ? 'Email programmé dans la file Email OS.' : 'Brouillon enregistré dans Email OS.')
      if (mode === 'send' || mode === 'schedule') setForm(EMPTY_FORM)
      await loadWorkspace(selected.mailboxId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action Email OS impossible.')
    } finally {
      setActionBusy(null)
    }
  }

  const outbox = workspace?.outbox || []
  const sent = outbox.filter((row) => ['sent', 'delivered', 'opened'].includes(String(row.status || '').toLowerCase())).length
  const failed = outbox.filter((row) => ['failed', 'bounced', 'rejected'].includes(String(row.status || '').toLowerCase())).length
  const tracked = outbox.filter((row) => Number(row.open_count || row.opens_count || 0) > 0).length

  return <main className="min-h-screen bg-[#f5f8fc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10">
    <section className="mx-auto max-w-[1760px]">
      <header className="relative overflow-hidden rounded-[40px] border border-blue-200 bg-white p-7 shadow-[0_28px_90px_rgba(15,23,42,.08)] sm:p-9">
        <div className="absolute inset-y-0 right-0 w-[38%] bg-gradient-to-bl from-blue-100/80 via-cyan-50/50 to-transparent" />
        <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
          <div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-emerald-800"><CheckCircle2 size={13} /> Email OS opérationnel</span><span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-blue-800">Approval-gated</span></div><p className="mt-6 text-[10px] font-black uppercase tracking-[.2em] text-blue-700">ANGELCARE Revenue Command OS</p><h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Revenue Email Studio</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Composer, programmer, envoyer, contrôler et suivre les emails Revenue OS exclusivement depuis les mailboxes Email OS réellement assignées à l’opérateur.</p></div>
          <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Autorité d’envoi</p><p className="mt-2 text-lg font-black">{operatorName}</p><p className="mt-2 text-xs text-slate-300">Gmail direct désactivé · Calendar désactivé · tracking Email OS conservé</p></div>
        </div>
      </header>

      {error ? <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900"><XCircle className="mt-0.5 shrink-0" size={18} />{error}</div> : null}
      {notice ? <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><CheckCircle2 className="mt-0.5 shrink-0" size={18} />{notice}</div> : null}

      <div className="mt-6 grid gap-6 2xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.06)]">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">Périmètre autorisé</p><h2 className="mt-2 text-xl font-black">Mailboxes assignées</h2></div><button onClick={() => void loadAssignments()} disabled={busy} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50" aria-label="Actualiser"><RefreshCw size={16} className={busy ? 'animate-spin' : ''} /></button></div>
          <div className="mt-5 space-y-3">{assignments.map((item) => <button key={item.mailboxId} onClick={() => setSelectedId(item.mailboxId)} className={`w-full rounded-[22px] border p-4 text-left transition ${selectedId === item.mailboxId ? 'border-blue-400 bg-blue-50 shadow-[0_12px_28px_rgba(37,99,235,.1)]' : 'border-slate-200 bg-white hover:border-blue-200'}`}><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><MailCheck size={17} /></span><span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] ${item.session_status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{item.session_status === 'active' ? 'Déverrouillée' : 'Session requise'}</span></div><p className="mt-3 truncate text-sm font-black">{item.mailboxName || item.mailboxEmail || item.mailboxId}</p><p className="mt-1 truncate text-[10px] font-bold text-slate-500">{item.mailboxEmail || item.mailboxId}</p><p className="mt-3 text-[9px] font-black uppercase tracking-[.12em] text-blue-700">{item.role || 'viewer'} · {item.permissions?.can_send ? 'envoi autorisé' : 'lecture seule'}</p></button>)}</div>
          {!busy && !assignments.length ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><AlertTriangle size={18} className="text-amber-700" /><p className="mt-3 text-sm font-black text-amber-950">Aucune mailbox active assignée</p><p className="mt-2 text-xs leading-5 text-amber-800">Un administrateur Email OS doit d’abord attribuer une mailbox à cet utilisateur.</p></div> : null}
        </aside>

        <div className="space-y-6">
          {selected && !unlocked ? <section className="rounded-[34px] border border-amber-200 bg-amber-50 p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-900 text-white"><LockKeyhole size={20} /></span><div><h2 className="text-xl font-black text-amber-950">Déverrouillage Email OS requis</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-amber-800">La mailbox est bien assignée, mais sa session PIN n’est pas active. Revenue OS ne contourne jamais la sécurité Email OS.</p></div></div><Link href="/email-os/gate" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir le portail Email OS <ArrowUpRight size={15} /></Link></div></section> : null}

          {selected && unlocked && !canSend ? <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><ShieldCheck size={20} className="text-amber-700" /><div><h2 className="font-black text-amber-950">Mailbox en lecture seule</h2><p className="mt-1 text-xs leading-5 text-amber-800">Votre affectation permet la consultation, mais pas l’envoi. Demandez la permission Email OS <code>can_send</code>.</p></div></div></section> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric icon={Inbox} label="Inbox" value={workspace?.inbox?.length || 0} note="Messages visibles dans cette mailbox" /><Metric icon={FilePenLine} label="Brouillons" value={workspace?.drafts?.length || 0} note="Brouillons Email OS persistés" /><Metric icon={Send} label="Envoyés" value={sent} note={`${failed} échec(s) dans la fenêtre`} /><Metric icon={Sparkles} label="Tracking" value={tracked} note="Messages avec ouverture observée" /></div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
            <section className={`rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] sm:p-7 ${!unlocked || !canSend ? 'pointer-events-none opacity-55' : ''}`}>
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-700">Composition gouvernée</p><h2 className="mt-2 text-2xl font-black">Nouvel email Revenue</h2></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><MailPlus size={20} /></span></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Modèle Email OS</span><select value={form.templateId} onChange={(event) => { const template = workspace?.templates?.find((item) => String(item.id) === event.target.value); setForm({ ...form, templateId: event.target.value, subject: template?.subject || form.subject, bodyHtml: template?.body || form.bodyHtml, priority: template?.priority || form.priority }) }} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"><option value="">Sans modèle</option>{(workspace?.templates || []).map((template) => <option key={String(template.id)} value={String(template.id)}>{template.name} · {template.category}</option>)}</select></label><label><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Contexte Revenue</span><select value={form.contextType} onChange={(event) => setForm({ ...form, contextType: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"><option value="prospect">Prospect</option><option value="account">Compte</option><option value="opportunity">Opportunité</option><option value="strategy">Stratégie</option><option value="program">Programme</option><option value="mission">Mission</option></select></label><label><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Référence du dossier</span><input value={form.contextReference} onChange={(event) => setForm({ ...form, contextReference: event.target.value })} placeholder="Code, nom ou référence" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" /></label><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Prochaine relance</span><input type="datetime-local" value={form.followUpAt} onChange={(event) => setForm({ ...form, followUpAt: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" /></label><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Destinataire *</span><input value={form.toEmail} onChange={(event) => setForm({ ...form, toEmail: event.target.value })} type="email" placeholder="contact@entreprise.ma" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label><label><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">CC</span><input value={form.ccEmail} onChange={(event) => setForm({ ...form, ccEmail: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label><label><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">CCI</span><input value={form.bccEmail} onChange={(event) => setForm({ ...form, bccEmail: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" /></label><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Objet *</span><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-blue-500" /></label><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Message *</span><textarea value={form.bodyHtml} onChange={(event) => setForm({ ...form, bodyHtml: event.target.value })} rows={12} placeholder="Rédigez le message commercial, la relance ou le suivi…" className="mt-2 w-full resize-y rounded-[22px] border border-slate-200 px-4 py-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3"><label><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Priorité</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold"><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option></select></label><label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-500">Programmation</span><input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-bold" /></label></div>
              <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" checked={form.tracking} onChange={(event) => setForm({ ...form, tracking: event.target.checked })} className="h-4 w-4" /><span className="text-xs font-bold text-slate-700">Activer le tracking Email OS pour ce message</span></label>
              <div className="mt-6 grid gap-3 sm:grid-cols-3"><button onClick={() => void submit('draft')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{actionBusy === 'draft' ? <Loader2 className="animate-spin" size={15} /> : <FilePenLine size={15} />} Enregistrer brouillon</button><button onClick={() => void submit('schedule')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-800 hover:bg-blue-100 disabled:opacity-50">{actionBusy === 'schedule' ? <Loader2 className="animate-spin" size={15} /> : <CalendarClock size={15} />} Programmer</button><button onClick={() => void submit('send')} disabled={Boolean(actionBusy)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50">{actionBusy === 'send' ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />} Envoyer via Email OS</button></div>
            </section>

            <aside className="rounded-[36px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_26px_76px_rgba(15,23,42,.18)]"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-300">Traçabilité</p><h2 className="mt-2 text-2xl font-black">Derniers envois</h2></div><Clock3 size={21} className="text-blue-300" /></div><div className="mt-6 space-y-3">{outbox.slice(0, 10).map((row) => <article key={String(row.id)} className="rounded-[22px] border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black text-white">{row.subject || '(Sans objet)'}</p><p className="mt-1 truncate text-[10px] text-slate-400">{row.to_email || row.recipient || 'Destinataire indisponible'}</p></div><span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase ${statusTone(row.status)}`}>{row.status || 'unknown'}</span></div><div className="mt-3 flex justify-between text-[9px] font-bold text-slate-400"><span>{displayDate(row.sent_at || row.scheduled_at || row.created_at)}</span><span>{Number(row.open_count || row.opens_count || 0)} ouverture(s)</span></div>{row.last_error ? <p className="mt-2 rounded-xl bg-rose-500/10 p-2 text-[9px] font-bold text-rose-200">{row.last_error}</p> : null}</article>)}</div>{!outbox.length ? <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center"><Send className="mx-auto text-slate-500" /><p className="mt-3 text-sm font-black">Aucun envoi dans cette mailbox</p><p className="mt-2 text-xs leading-5 text-slate-400">Les futurs envois et leurs résultats apparaîtront ici.</p></div> : null}<Link href="/email-os" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/15">Ouvrir Email OS complet <ArrowUpRight size={15} /></Link></aside>
          </div>
        </div>
      </div>
    </section>
  </main>
}
