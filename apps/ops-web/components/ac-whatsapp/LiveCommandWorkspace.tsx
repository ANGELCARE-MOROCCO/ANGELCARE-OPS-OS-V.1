"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Archive, ArrowRightLeft, Bot, CheckCheck, ChevronDown, CircleUserRound, Clock3,
  FileText, Filter, Inbox, Languages, MessageCircleMore, MoreHorizontal, Paperclip,
  Phone, Plus, Search, Send, ShieldAlert, Sparkles, Tag, UserRoundCheck, UsersRound,
} from "lucide-react"
import type { AcWhatsAppConversation, AcWhatsAppMessage } from "@/lib/ac-whatsapp/types"
import {
  cx, EmptyState, LoadingPanel, ModalFrame, NoticeBanner, SectionTitle, StatusPill,
  Surface, SurfaceHeader,
} from "./ACWhatsAppUI"
import { acApi, formatDateTime, formatRelative, friendlyAcError, initials, useAcWhatsApp } from "./useAcWhatsApp"

type ConversationDetail = { conversation: AcWhatsAppConversation; messages: AcWhatsAppMessage[]; events: Array<Record<string, any>>; contextLinks: Array<Record<string, any>> }
type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }

const smartViews = [
  { id: "all", label: "Toutes", icon: Inbox },
  { id: "unassigned", label: "Non attribuées", icon: UsersRound },
  { id: "unread", label: "Non lues", icon: MessageCircleMore },
  { id: "waiting", label: "Attente client", icon: Clock3 },
  { id: "escalated", label: "Escalades", icon: ShieldAlert },
  { id: "resolved", label: "Résolues", icon: Archive },
]

export default function LiveCommandWorkspace() {
  const searchParams = useSearchParams()
  const { data, loading, error, refresh } = useAcWhatsApp(12000)
  const [view, setView] = useState("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("conversation"))
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [composer, setComposer] = useState("")
  const [sending, setSending] = useState(false)
  const [noteMode, setNoteMode] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState("")
  const [aiBusy, setAiBusy] = useState(false)

  const conversations = data?.conversations || []
  const selected = detail?.conversation || conversations.find((row) => row.id === selectedId) || null

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return conversations.filter((row) => {
      const viewMatch = view === "all"
        || (view === "unread" && row.unread_count > 0)
        || (view === "waiting" && row.status === "waiting_customer")
        || row.status === view
      if (!viewMatch) return false
      if (!needle) return true
      return [row.contact?.display_name, row.contact?.organization_name, row.contact?.phone_number_e164, row.last_message_preview, row.subject]
        .some((value) => String(value || "").toLowerCase().includes(needle))
    })
  }, [conversations, query, view])

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    let active = true
    setDetailLoading(true)
    acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`)
      .then((next) => { if (active) setDetail(next) })
      .catch((cause) => { if (active) setNotice({ ...friendlyAcError(cause), tone: "danger" }) })
      .finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [selectedId])

  async function updateConversation(patch: Record<string, unknown>, success: string) {
    if (!selectedId) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "PATCH", body: JSON.stringify({ ...patch, reason: success }) })
      setNotice({ tone: "success", title: success, description: "La conversation a été mise à jour et tracée dans l’audit AngelCare." })
      await Promise.all([refresh(), acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`).then(setDetail)])
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  async function sendMessage() {
    const text = composer.trim()
    if (!selectedId || !text || sending) return
    if (noteMode) {
      setNotice({ tone: "warning", title: "Note interne protégée", description: "Le backend actuel ne publie pas encore l’endpoint de notes internes. Le texte reste dans le composeur et ne sera jamais envoyé au client." })
      return
    }
    setSending(true)
    try {
      await acApi("/api/ac-whatsapp/messages/send", { method: "POST", body: JSON.stringify({ conversationId: selectedId, text, messageType: "text" }) })
      setComposer("")
      const next = await acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`)
      setDetail(next)
      await refresh()
      setNotice({ tone: "success", title: "Message pris en charge", description: "Le message a été remis au transport OpenWA ou placé dans la file durable de reprise." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setSending(false) }
  }

  async function runAi(mode: "reply" | "summary" | "translate" | "next_action") {
    if (!selectedId || aiBusy) return
    setAiBusy(true); setAiOpen(true); setAiResult("")
    try {
      const result = await acApi<any>("/api/ac-whatsapp/ai/assist", { method: "POST", body: JSON.stringify({ conversationId: selectedId, action: mode, sourceText: composer }) })
      const text = String(result?.text || result?.content || result?.reply || result?.result || JSON.stringify(result, null, 2))
      setAiResult(text)
      if (mode === "reply" || mode === "translate") setComposer(text)
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setAiBusy(false) }
  }

  if (loading && !data) return <LoadingPanel label="Ouverture du Live Command" />

  const openCount = conversations.filter((row) => !["resolved", "closed", "archived"].includes(row.status)).length
  const waitingCount = conversations.filter((row) => row.status === "waiting_customer").length
  const escalationCount = conversations.filter((row) => row.status === "escalated").length
  const unassignedCount = conversations.filter((row) => row.status === "unassigned" || !row.assigned_user_id).length

  return <div className="space-y-5">
    <SectionTitle eyebrow="Master Workspace 01 · Live Command" title="Le centre nerveux de chaque conversation AngelCare." description="Comprendre, répondre, attribuer, décider et convertir depuis une seule surface live — sans perdre le contexte client ni la responsabilité humaine." action={<button type="button" onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-rose-600/20"><Plus className="h-4 w-4" />Nouvelle conversation</button>} />

    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)} /> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <PulseCard label="À traiter maintenant" value={openCount} detail="Conversations ouvertes" icon={MessageCircleMore} tone="slate" />
      <PulseCard label="Sans propriétaire" value={unassignedCount} detail="Attribution nécessaire" icon={UsersRound} tone="amber" />
      <PulseCard label="Attente client" value={waitingCount} detail="Réponses envoyées" icon={Clock3} tone="blue" />
      <PulseCard label="Escalations" value={escalationCount} detail="Intervention requise" icon={ShieldAlert} tone="rose" />
    </div>

    <section className="grid min-h-[720px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,.07)] xl:grid-cols-[330px_minmax(480px,1fr)_340px]">
      <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-200 p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, numéro, organisation…" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-[10px] font-bold outline-none focus:border-slate-400" /></div><div className="mt-3 flex gap-1.5 overflow-x-auto">{smartViews.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setView(item.id)} className={cx("flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black", view === item.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-500")}><Icon className="h-3 w-3" />{item.label}</button> })}</div></div>
        <div className="flex items-center justify-between px-4 py-3"><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">File intelligente</p><span className="rounded-full bg-white px-2 py-1 text-[8px] font-black text-slate-500 ring-1 ring-slate-200">{filtered.length}</span></div>
        <div className="max-h-[610px] overflow-y-auto px-2 pb-3">{filtered.length ? filtered.map((row) => <ConversationRow key={row.id} row={row} active={row.id === selectedId} onClick={() => setSelectedId(row.id)} />) : <EmptyState compact title="Aucune conversation" description="Cette file se remplira automatiquement selon les états live et les filtres sélectionnés." icon={Filter} />}</div>
      </aside>

      <main className="flex min-w-0 flex-col border-b border-slate-200 xl:border-b-0 xl:border-r">
        {selected ? <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{initials(selected.contact?.display_name)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-black text-slate-950">{selected.contact?.display_name || selected.contact?.phone_number_e164 || "Contact WhatsApp"}</h2><StatusPill status={selected.status} compact /></div><p className="mt-1 truncate text-[9px] font-semibold text-slate-500">{[selected.contact?.organization_name, selected.contact?.phone_number_e164, selected.account?.name].filter(Boolean).join(" · ")}</p></div></div><div className="flex items-center gap-2"><button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600"><Phone className="h-4 w-4" /></button><button type="button" onClick={() => void updateConversation({ status: "resolved" }, "Conversation résolue")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[9px] font-black text-emerald-700"><CheckCheck className="h-4 w-4" />Résoudre</button><button className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600"><MoreHorizontal className="h-4 w-4" /></button></div></div>
          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#fff_22%,#fff_100%)] px-4 py-5"><div className="mx-auto max-w-3xl space-y-3">{detailLoading ? <div className="grid min-h-64 place-items-center text-[10px] font-black text-slate-400">Chargement sécurisé de la chronologie…</div> : detail?.messages.length ? detail.messages.map((message) => <MessageBubble key={message.id} message={message} />) : <EmptyState compact title="Conversation prête" description="Aucun message n’est encore enregistré. Utilisez le composeur pour initier le contact." icon={MessageCircleMore} />}</div></div>
          <div className="border-t border-slate-200 bg-white p-4"><div className="mx-auto max-w-3xl"><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-1"><button type="button" onClick={() => setNoteMode(false)} className={cx("rounded-lg px-2.5 py-1.5 text-[8px] font-black", !noteMode ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500")}>Message client</button><button type="button" onClick={() => setNoteMode(true)} className={cx("rounded-lg px-2.5 py-1.5 text-[8px] font-black", noteMode ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500")}>Note interne</button></div><span className="text-[8px] font-bold text-slate-400">Compte : {selected.account?.name || "—"}</span></div><div className={cx("rounded-[22px] border p-2", noteMode ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)]")}><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendMessage() }} rows={3} placeholder={noteMode ? "Note interne — jamais envoyée au contact" : "Rédiger une réponse claire et utile…"} className="w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold leading-6 text-slate-800 outline-none placeholder:text-slate-300" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-1 pt-2"><div className="flex items-center gap-1"><ComposerButton icon={Paperclip} label="Joindre" /><ComposerButton icon={FileText} label="Modèle" /><button type="button" onClick={() => void runAi("reply")} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-2.5 py-2 text-[8px] font-black text-violet-700"><Sparkles className="h-3.5 w-3.5" />Réponse IA</button></div><button type="button" onClick={() => void sendMessage()} disabled={!composer.trim() || sending} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40"><Send className="h-3.5 w-3.5" />{sending ? "Envoi…" : noteMode ? "Conserver la note" : "Envoyer"}</button></div></div><p className="mt-2 text-right text-[8px] font-bold text-slate-400">⌘/Ctrl + Entrée pour envoyer · actions auditées</p></div></div>
        </> : <EmptyState title="Sélectionnez une conversation" description="La conversation, son dossier relationnel et les actions disponibles apparaîtront ici." icon={MessageCircleMore} />}
      </main>

      <aside className="bg-slate-50/65 p-4">{selected ? <div className="space-y-4"><Surface className="p-4"><SurfaceHeader eyebrow="Relationship intelligence" title="Dossier instantané" icon={CircleUserRound} /><div className="mt-4 space-y-3"><InfoLine label="Type" value={selected.contact?.contact_type || "Contact"} /><InfoLine label="Priorité" value={selected.priority || selected.contact?.priority} /><InfoLine label="Étape" value={selected.contact?.lead_stage || "Non qualifiée"} /><InfoLine label="Sentiment" value={selected.sentiment || selected.contact?.sentiment || "Non analysé"} /><InfoLine label="Ville" value={selected.contact?.city || "Non renseignée"} /></div><div className="mt-4 flex flex-wrap gap-1.5">{(selected.contact?.tags || []).length ? selected.contact?.tags.map((tag) => <span key={tag} className="rounded-lg bg-slate-100 px-2 py-1 text-[8px] font-black text-slate-600">#{tag}</span>) : <span className="text-[9px] font-semibold text-slate-400">Aucun tag relationnel</span>}</div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="Commandes" title="Prochaine décision" icon={UserRoundCheck} /><div className="mt-4 grid grid-cols-2 gap-2"><MiniAction label="M’attribuer" icon={UserRoundCheck} onClick={() => void updateConversation({ assigned_user_id: data?.actor.id, status: "assigned" }, "Conversation attribuée")} /><MiniAction label="Escalader" icon={ShieldAlert} onClick={() => void updateConversation({ status: "escalated" }, "Conversation escaladée")} /><MiniAction label="Attente client" icon={Clock3} onClick={() => void updateConversation({ status: "waiting_customer" }, "Conversation placée en attente client")} /><MiniAction label="Transférer" icon={ArrowRightLeft} onClick={() => setNotice({ tone: "info", title: "Transfert contrôlé", description: "Utilisez Team Operations pour choisir un opérateur selon capacité, compétence et file." })} /></div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="AC Intelligence" title="Assistance contextualisée" icon={Bot} /><div className="mt-4 space-y-2"><AiAction label="Résumer la conversation" icon={FileText} onClick={() => void runAi("summary")} /><AiAction label="Traduire / harmoniser" icon={Languages} onClick={() => void runAi("translate")} /><AiAction label="Recommander l’action suivante" icon={Sparkles} onClick={() => void runAi("next_action")} /></div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="Traçabilité" title="Événements récents" icon={Tag} /><div className="mt-4 space-y-3">{(detail?.events || []).slice(0, 6).map((event, index) => <div key={event.id || index} className="relative border-l border-slate-200 pl-3"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-slate-400" /><p className="text-[9px] font-black text-slate-700">{String(event.event_type || "Événement").replaceAll("_", " ")}</p><p className="mt-1 text-[8px] font-semibold text-slate-400">{formatRelative(event.created_at)}</p></div>)}{!detail?.events.length ? <p className="text-[9px] font-semibold text-slate-400">Aucun événement enregistré.</p> : null}</div></Surface>
      </div> : null}</aside>
    </section>

    {newOpen && data ? <NewConversationModal data={data} onClose={() => setNewOpen(false)} onCreated={async (id) => { setNewOpen(false); setSelectedId(id); await refresh(); setNotice({ tone: "success", title: "Conversation créée", description: "Le dossier est prêt dans Live Command." }) }} /> : null}
    {aiOpen ? <ModalFrame title="AC Intelligence · Assistance" eyebrow="Human-in-the-loop" description="La suggestion reste sous contrôle humain et ne part jamais automatiquement." onClose={() => setAiOpen(false)} footer={<div className="flex justify-end"><button type="button" onClick={() => setAiOpen(false)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Revenir à la conversation</button></div>}><div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-[8px] font-black uppercase tracking-[.16em] text-violet-700">Résultat proposé</p><div className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-800">{aiBusy ? "Analyse de la conversation et du contexte…" : aiResult || "Aucune proposition disponible."}</div></div></ModalFrame> : null}
  </div>
}

function PulseCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof MessageCircleMore; tone: "slate" | "amber" | "blue" | "rose" }) { const color = { slate: "bg-slate-950", amber: "bg-amber-500", blue: "bg-blue-600", rose: "bg-rose-600" }[tone]; return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-[9px] font-semibold text-slate-500">{detail}</p></div><div className={cx("grid h-10 w-10 place-items-center rounded-2xl text-white", color)}><Icon className="h-4 w-4" /></div></div></div> }
function ConversationRow({ row, active, onClick }: { row: AcWhatsAppConversation; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={cx("mb-1.5 flex w-full gap-3 rounded-[18px] border p-3 text-left transition", active ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-transparent bg-white hover:border-slate-200")}><div className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[10px] font-black", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")}>{initials(row.contact?.display_name)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[10px] font-black">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact"}</p><span className={cx("shrink-0 text-[8px] font-bold", active ? "text-white/45" : "text-slate-400")}>{formatRelative(row.last_message_at)}</span></div><p className={cx("mt-1 truncate text-[9px] font-semibold", active ? "text-white/55" : "text-slate-500")}>{row.last_message_preview || "Nouvelle conversation"}</p><div className="mt-2 flex items-center justify-between gap-2"><span className={cx("truncate text-[8px] font-black", active ? "text-rose-300" : "text-slate-400")}>{row.queue?.name || row.account?.name || "File générale"}</span>{row.unread_count ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[8px] font-black text-white">{row.unread_count}</span> : <StatusPill status={row.status} compact />}</div></div></button> }
function MessageBubble({ message }: { message: AcWhatsAppMessage }) { const outbound = message.direction === "outbound"; const internal = message.direction === "internal"; return <div className={cx("flex", outbound ? "justify-end" : "justify-start")}><div className={cx("max-w-[82%] rounded-[22px] border px-4 py-3 shadow-sm", outbound ? "rounded-br-md border-slate-900 bg-slate-950 text-white" : internal ? "border-amber-200 bg-amber-50 text-amber-950" : "rounded-bl-md border-slate-200 bg-white text-slate-800")}><div className="whitespace-pre-wrap text-[12px] font-semibold leading-6">{message.body || message.caption || `[${message.message_type}]`}</div><div className={cx("mt-2 flex items-center justify-end gap-2 text-[8px] font-bold", outbound ? "text-white/45" : "text-slate-400")}><span>{formatDateTime(message.sent_at || message.received_at || message.created_at)}</span>{outbound ? <><StatusPill status={message.status} compact />{["delivered", "read"].includes(message.status) ? <CheckCheck className="h-3.5 w-3.5" /> : null}</> : null}</div>{message.error_message ? <p className="mt-2 rounded-lg bg-rose-500/10 px-2 py-1 text-[8px] font-bold text-rose-600">{message.error_message}</p> : null}</div></div> }
function ComposerButton({ icon: Icon, label }: { icon: typeof Paperclip; label: string }) { return <button type="button" className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black text-slate-500 hover:bg-slate-100"><Icon className="h-3.5 w-3.5" />{label}</button> }
function InfoLine({ label, value }: { label: string; value?: string | null }) { return <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0"><span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</span><span className="truncate text-[10px] font-black text-slate-700">{value || "—"}</span></div> }
function MiniAction({ label, icon: Icon, onClick }: { label: string; icon: typeof UserRoundCheck; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-slate-300 hover:bg-white"><Icon className="h-4 w-4 text-slate-700" /><p className="mt-2 text-[9px] font-black text-slate-700">{label}</p></button> }
function AiAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-violet-100 bg-violet-50 px-3 py-2.5 text-left text-[9px] font-black text-violet-700"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button> }

function NewConversationModal({ data, onClose, onCreated }: { data: NonNullable<ReturnType<typeof useAcWhatsApp>["data"]>; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ account_id: data.accounts.find((a) => a.status === "connected")?.id || data.accounts[0]?.id || "", contact_id: "", phone_number_e164: "", display_name: "", organization_name: "", queue_id: data.queues[0]?.id || "", priority: "normal", assign_to_me: true })
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null)
  async function submit() { setBusy(true); try { const created = await acApi<any>("/api/ac-whatsapp/conversations", { method: "POST", body: JSON.stringify(form) }); onCreated(created.id) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setBusy(false) } }
  return <ModalFrame title="Ouvrir une conversation" eyebrow="Provisionnement relationnel" description="Associez le bon compte, le bon contact et la file responsable avant le premier message." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[9px] font-black text-slate-600">Annuler</button><button type="button" onClick={() => void submit()} disabled={busy || !form.account_id || (!form.contact_id && !form.phone_number_e164)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Création…" : "Créer le dossier"}</button></div>}>{notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description} /> : null}<div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Compte WhatsApp"><select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} className="input-premium">{data.accounts.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.status}</option>)}</select></Field><Field label="File responsable"><select value={form.queue_id} onChange={(e) => setForm({ ...form, queue_id: e.target.value })} className="input-premium"><option value="">File générale</option>{data.queues.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Contact existant"><select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })} className="input-premium"><option value="">Créer depuis le numéro</option>{data.contacts.map((row) => <option key={row.id} value={row.id}>{row.display_name || row.phone_number_e164}</option>)}</select></Field><Field label="Numéro E.164"><input value={form.phone_number_e164} onChange={(e) => setForm({ ...form, phone_number_e164: e.target.value })} placeholder="+212…" className="input-premium" /></Field><Field label="Nom du contact"><input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="input-premium" /></Field><Field label="Organisation"><input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} className="input-premium" /></Field></div><style jsx global>{`.input-premium{width:100%;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:11px 12px;font-size:11px;font-weight:700;color:#0f172a;outline:none}.input-premium:focus{border-color:#94a3b8;box-shadow:0 0 0 3px rgba(148,163,184,.13)}`}</style></ModalFrame>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span>{children}</label> }
