"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Archive, ArrowRightLeft, Bell, BellOff, Bot, CheckCheck, ChevronDown, CircleUserRound,
  Clock3, Copy, FileText, Filter, Inbox, Languages, MessageCircleMore, MoreHorizontal,
  Paperclip, PhoneOff, Pin, PinOff, Plus, RotateCcw, Search, Send, ShieldAlert,
  Sparkles, Tag, Trash2, UserRoundCheck, UsersRound,
} from "lucide-react"
import type { AcWhatsAppConversation, AcWhatsAppMessage } from "@/lib/ac-whatsapp/types"
import {
  cx, EmptyState, LoadingPanel, ModalFrame, NoticeBanner, SectionTitle, StatusPill,
  Surface, SurfaceHeader,
} from "./ACWhatsAppUI"
import { acApi, formatDateTime, formatRelative, friendlyAcError, initials, useAcWhatsApp } from "./useAcWhatsApp"
import { VoiceMessagePlayer, VoiceMessageStudio } from "./VoiceMessageStudio"

type ConversationDetail = {
  conversation: AcWhatsAppConversation
  messages: AcWhatsAppMessage[]
  events: Array<Record<string, any>>
  contextLinks: Array<Record<string, any>>
  followups: Array<Record<string, any>>
}
type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }

const smartViews = [
  { id: "all", label: "Toutes", icon: Inbox },
  { id: "unassigned", label: "Non attribuées", icon: UsersRound },
  { id: "unread", label: "Non lues", icon: MessageCircleMore },
  { id: "waiting", label: "Attente client", icon: Clock3 },
  { id: "escalated", label: "Escalades", icon: ShieldAlert },
  { id: "resolved", label: "Résolues", icon: Archive },
]

function labelIds(conversation?: AcWhatsAppConversation | null) {
  return new Set((conversation?.labels || []).map((row: any) => String(row.label_id || row.label?.id || "")).filter(Boolean))
}

export default function LiveCommandWorkspace() {
  const searchParams = useSearchParams()
  const { data, loading, error, refresh, setData } = useAcWhatsApp(12000)
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [followupOpen, setFollowupOpen] = useState(false)

  const conversations = data?.conversations || []
  const selected = detail?.conversation || conversations.find((row) => row.id === selectedId) || null
  const selectedMetadata = (selected?.metadata || {}) as Record<string, any>
  const selectedLabels = labelIds(selected)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return conversations
      .filter((row) => {
        const viewMatch = view === "all"
          || (view === "unread" && row.unread_count > 0)
          || (view === "waiting" && row.status === "waiting_customer")
          || row.status === view
        if (!viewMatch) return false
        if (!needle) return true
        return [row.contact?.display_name, row.contact?.organization_name, row.contact?.phone_number_e164, row.last_message_preview, row.subject]
          .some((value) => String(value || "").toLowerCase().includes(needle))
      })
      .sort((a, b) => Number(Boolean((b.metadata as any)?.pinned)) - Number(Boolean((a.metadata as any)?.pinned)))
  }, [conversations, query, view])

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  useEffect(() => {
    if (!selectedId) { setDetail(null); return }
    let active = true
    const row = conversations.find((item) => item.id === selectedId)
    setDetailLoading(true)
    ;(async () => {
      try {
        if (row && row.unread_count > 0) {
          const readAt = new Date().toISOString()
          setData((current) => current ? {
            ...current,
            conversations: current.conversations.map((item) => item.id === selectedId ? { ...item, unread_count: 0, last_read_at: readAt, last_read_by_user_id: current.actor.id } : item),
            counts: { ...current.counts, unread: Math.max(0, (current.counts.unread || 0) - row.unread_count) },
          } : current)
          await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "PATCH", body: JSON.stringify({ action: "mark_read", reason: "Conversation ouverte dans Live Command" }) })
        }
        const next = await acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`)
        if (active) setDetail(next)
      } catch (cause) {
        if (active) {
          setNotice({ ...friendlyAcError(cause), tone: "danger" })
          refresh().catch(() => undefined)
        }
      } finally {
        if (active) setDetailLoading(false)
      }
    })()
    return () => { active = false }
  }, [selectedId, conversations, refresh, setData])

  async function reloadSelected() {
    if (!selectedId) return
    const [next] = await Promise.all([
      acApi<ConversationDetail>(`/api/ac-whatsapp/conversations/${selectedId}`),
      refresh(),
    ])
    setDetail(next)
  }

  async function conversationAction(action: string, payload: Record<string, unknown> = {}, success?: string) {
    if (!selectedId) return
    try {
      const updated = await acApi<AcWhatsAppConversation>(`/api/ac-whatsapp/conversations/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...payload, reason: success || action }),
      })
      setDetail((current) => current ? { ...current, conversation: { ...current.conversation, ...updated } } : current)
      setMenuOpen(false)
      await reloadSelected()
      setNotice({ tone: "success", title: success || "Conversation mise à jour", description: "L’action a été enregistrée, synchronisée et ajoutée à la traçabilité AngelCare." })
    } catch (cause) {
      setNotice({ ...friendlyAcError(cause), tone: "danger" })
    }
  }

  async function updateConversation(patch: Record<string, unknown>, success: string) {
    if (!selectedId) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "PATCH", body: JSON.stringify({ ...patch, reason: success }) })
      await reloadSelected()
      setNotice({ tone: "success", title: success, description: "La conversation a été mise à jour et tracée dans l’audit AngelCare." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  async function sendMessage() {
    const text = composer.trim()
    if (!selectedId || !text || sending) return
    setSending(true)
    try {
      await acApi("/api/ac-whatsapp/messages/send", { method: "POST", body: JSON.stringify({ conversationId: selectedId, text, messageType: noteMode ? "internal" : "text", internalNote: noteMode }) })
      setComposer("")
      await reloadSelected()
      setNotice({ tone: "success", title: noteMode ? "Note interne conservée" : "Message pris en charge", description: noteMode ? "La note est visible uniquement par les utilisateurs AngelCare autorisés et porte votre identité réelle." : "Le message a été remis au transport OpenWA ou placé dans la file durable de reprise." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setSending(false) }
  }

  async function runAi(mode: "reply" | "summary" | "translate" | "next_action") {
    if (!selectedId || aiBusy) return
    setAiBusy(true); setAiOpen(true); setAiResult("")
    try {
      const result = await acApi<any>("/api/ac-whatsapp/ai/assist", { method: "POST", body: JSON.stringify({ conversationId: selectedId, action: mode, sourceText: composer }) })
      const text = String(result?.text || result?.content || result?.reply || result?.result || JSON.stringify(result, null, 2))
      setAiResult(text)
      if (mode === "reply" || mode === "translate") setComposer(text)
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setAiBusy(false) }
  }

  async function toggleLabel(id: string) {
    const next = new Set(selectedLabels)
    if (next.has(id)) next.delete(id); else next.add(id)
    await conversationAction("set_labels", { label_ids: [...next] }, "Étiquettes mises à jour")
  }

  async function permanentDelete() {
    if (!selectedId || !deleteReason.trim()) return
    try {
      await acApi(`/api/ac-whatsapp/conversations/${selectedId}`, { method: "DELETE", body: JSON.stringify({ confirm: "PERMANENT_DELETE", reason: deleteReason.trim() }) })
      setDeleteOpen(false); setDeleteReason(""); setSelectedId(null); setDetail(null)
      await refresh()
      setNotice({ tone: "success", title: "Conversation supprimée", description: "La suppression administrative a été exécutée et auditée." })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  if (loading && !data) return <LoadingPanel label="Ouverture du Live Command" />

  const openCount = conversations.filter((row) => !["resolved", "closed", "archived"].includes(row.status)).length
  const waitingCount = conversations.filter((row) => row.status === "waiting_customer").length
  const escalationCount = conversations.filter((row) => row.status === "escalated").length
  const unassignedCount = conversations.filter((row) => row.status === "unassigned" || !row.assigned_user_id).length
  const canDelete = Boolean(data?.actor.permissions.includes("ac-whatsapp.message.delete") || data?.actor.permissions.includes("ac-whatsapp.*") || data?.actor.permissions.includes("*"))

  return <div className="space-y-5">
    <SectionTitle eyebrow="Master Workspace 01 · Live Command" title="Le centre nerveux de chaque conversation AngelCare." description="Comprendre, répondre, attribuer, décider et convertir depuis une seule surface live — avec identité humaine, états cohérents et actions gouvernées." action={<button type="button" onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-[10px] font-black text-white shadow-lg shadow-rose-600/20"><Plus className="h-4 w-4" />Nouvelle conversation</button>} />

    {error ? <NoticeBanner tone="danger" {...friendlyAcError(error)} /> : null}
    {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} reference={notice.reference} onClose={() => setNotice(null)} /> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <PulseCard label="À traiter maintenant" value={openCount} detail="Conversations ouvertes" icon={MessageCircleMore} tone="slate" />
      <PulseCard label="Sans propriétaire" value={unassignedCount} detail="Attribution nécessaire" icon={UsersRound} tone="amber" />
      <PulseCard label="Attente client" value={waitingCount} detail="Réponses envoyées" icon={Clock3} tone="blue" />
      <PulseCard label="Escalations" value={escalationCount} detail="Intervention requise" icon={ShieldAlert} tone="rose" />
    </div>

    <section className="grid min-h-[720px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,.07)] xl:grid-cols-[350px_minmax(500px,1fr)_340px]">
      <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-200 p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, numéro, organisation…" className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-[11px] font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-600" /></div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto">{smartViews.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setView(item.id)} className={cx("flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-black", view === item.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-500")}><Icon className="h-3.5 w-3.5" />{item.label}</button> })}</div>
        </div>
        <div className="flex items-center justify-between px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-600">File intelligente</p><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-900 ring-1 ring-slate-300">{filtered.length}</span></div>
        <div className="max-h-[610px] overflow-y-auto px-2 pb-3">{filtered.length ? filtered.map((row) => <ConversationRow key={row.id} row={row} active={row.id === selectedId} onClick={() => setSelectedId(row.id)} />) : <EmptyState compact title="Aucune conversation" description="Cette file se remplira automatiquement selon les états live et les filtres sélectionnés." icon={Filter} />}</div>
      </aside>

      <main className="flex min-w-0 flex-col border-b border-slate-200 xl:border-b-0 xl:border-r">
        {selected ? <>
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex min-w-0 items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{initials(selected.contact?.display_name)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-black text-slate-950">{selected.contact?.display_name || selected.contact?.phone_number_e164 || "Contact non identifié"}</h2><StatusPill status={selected.status} compact />{selectedMetadata.pinned ? <StatusPill status="pinned" compact /> : null}{selectedMetadata.muted ? <StatusPill status="muted" compact /> : null}</div><p className="mt-1 truncate text-[9px] font-bold text-slate-600">{[selected.contact?.organization_name, selected.contact?.phone_number_e164, selected.account?.name].filter(Boolean).join(" · ")}</p><p className="mt-1 text-[8px] font-bold text-slate-500">Responsable : {String((selected.assigned_user as any)?.display_name || (selected.assigned_user as any)?.full_name || data?.actor.name || "Opérateur non résolu")}</p></div></div>
            <div className="flex items-center gap-2">
              <button type="button" disabled title="Les appels WhatsApp ne sont pas pris en charge par le runtime OpenWA actuel" className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3 text-[9px] font-black text-slate-600 opacity-80"><PhoneOff className="h-4 w-4" />Appels indisponibles</button>
              <button type="button" onClick={() => void conversationAction(selected.status === "resolved" ? "reopen" : "resolve", {}, selected.status === "resolved" ? "Conversation rouverte" : "Conversation résolue")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-100 px-3 text-[9px] font-black text-emerald-950"><CheckCheck className="h-4 w-4" />{selected.status === "resolved" ? "Rouvrir" : "Résoudre"}</button>
              <div className="relative"><button type="button" aria-label="Plus d’actions" onClick={() => setMenuOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white text-slate-900 hover:bg-slate-100"><MoreHorizontal className="h-4 w-4" /></button>{menuOpen ? <ConversationMenu conversation={selected} labels={data?.labelsCatalog || []} selectedLabels={selectedLabels} canDelete={canDelete} onAction={(action, payload, success) => void conversationAction(action, payload, success)} onToggleLabel={(id) => void toggleLabel(id)} onAssign={() => { setMenuOpen(false); setAssignmentOpen(true) }} onFollowup={() => { setMenuOpen(false); setFollowupOpen(true) }} onInternalNote={() => { setMenuOpen(false); setNoteMode(true) }} onSync={() => { setMenuOpen(false); reloadSelected().then(() => setNotice({ tone: "success", title: "Conversation synchronisée", description: "Les messages, identités, états et actions ont été actualisés." })).catch((cause) => setNotice({ ...friendlyAcError(cause), tone: "danger" })) }} onDelete={() => { setMenuOpen(false); setDeleteOpen(true) }} onCopy={() => { void navigator.clipboard.writeText(selected.contact?.phone_number_e164 || selected.remote_chat_id); setMenuOpen(false); setNotice({ tone: "success", title: "Numéro copié", description: "Le numéro du contact a été copié dans le presse-papiers." }) }} /> : null}</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#fff_22%,#fff_100%)] px-4 py-5"><div className="mx-auto max-w-3xl space-y-3">{detailLoading ? <div className="grid min-h-64 place-items-center text-[10px] font-black text-slate-600">Chargement sécurisé de la chronologie…</div> : detail?.messages.length ? detail.messages.map((message) => <MessageBubble key={message.id} message={message} />) : <EmptyState compact title="Conversation prête" description="Aucun message n’est encore enregistré. Utilisez le composeur pour initier le contact." icon={MessageCircleMore} />}</div></div>
          <div className="border-t border-slate-200 bg-white p-4"><div className="mx-auto max-w-3xl"><div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-1"><button type="button" onClick={() => setNoteMode(false)} className={cx("rounded-lg border px-3 py-1.5 text-[9px] font-black", !noteMode ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800")}>Message client</button><button type="button" onClick={() => setNoteMode(true)} className={cx("rounded-lg border px-3 py-1.5 text-[9px] font-black", noteMode ? "border-amber-500 bg-amber-500 text-slate-950" : "border-slate-300 bg-white text-slate-800")}>Note interne</button></div><span className="text-[8px] font-bold text-slate-600">Auteur : {data?.actor.name} · Compte : {selected.account?.name || "—"}</span></div><div className={cx("rounded-[22px] border p-2", noteMode ? "border-amber-400 bg-amber-50" : "border-slate-300 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)]")}><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void sendMessage() }} rows={3} placeholder={noteMode ? "Note interne — jamais envoyée au contact" : "Rédiger une réponse claire et utile…"} className="w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold leading-6 text-slate-950 outline-none placeholder:text-slate-500" /><div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-1 pt-2"><div className="flex items-center gap-1"><ComposerButton icon={Paperclip} label="Joindre" /><ComposerButton icon={FileText} label="Modèle" /><VoiceMessageStudio conversationId={selected.id} disabled={noteMode || sending} onSent={reloadSelected} onSuccess={(title, description) => setNotice({ tone: "success", title, description })} onError={(title, description) => setNotice({ tone: "danger", title, description })} /><button type="button" onClick={() => void runAi("reply")} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-100 px-2.5 py-2 text-[9px] font-black text-violet-950"><Sparkles className="h-3.5 w-3.5" />Réponse IA</button></div><button type="button" onClick={() => void sendMessage()} disabled={!composer.trim() || sending} className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[9px] font-black disabled:cursor-not-allowed disabled:opacity-40", noteMode ? "bg-amber-500 text-slate-950" : "bg-rose-600 text-white")}><Send className="h-3.5 w-3.5" />{sending ? "Enregistrement…" : noteMode ? "Conserver la note" : "Envoyer"}</button></div></div><p className="mt-2 text-right text-[8px] font-bold text-slate-600">⌘/Ctrl + Entrée · chaque message conserve l’identité réelle de son auteur</p></div></div>
        </> : <EmptyState title="Sélectionnez une conversation" description="La conversation, son dossier relationnel et les actions disponibles apparaîtront ici." icon={MessageCircleMore} />}
      </main>

      <aside className="bg-slate-50/65 p-4">{selected ? <div className="space-y-4"><Surface className="p-4"><SurfaceHeader eyebrow="Relationship intelligence" title="Dossier instantané" icon={CircleUserRound} /><div className="mt-4 space-y-3"><InfoLine label="Type" value={humanValue(selected.contact?.contact_type, "Contact non qualifié")} /><InfoLine label="Priorité" value={humanValue(selected.priority || selected.contact?.priority, "Normale")} /><InfoLine label="Étape" value={humanValue(selected.contact?.lead_stage, "Non qualifiée")} /><InfoLine label="Sentiment" value={humanValue(selected.sentiment || selected.contact?.sentiment, "Non analysé")} /><InfoLine label="Ville" value={humanValue(selected.contact?.city, "Non renseignée")} /></div><div className="mt-4 flex flex-wrap gap-1.5">{(selected.labels || []).length ? selected.labels?.map((entry: any) => <span key={entry.label?.id || entry.label_id} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[8px] font-black text-slate-950">{entry.label?.name}</span>) : <span className="text-[9px] font-semibold text-slate-600">Aucune étiquette relationnelle</span>}</div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="Commandes" title="Prochaine décision" icon={UserRoundCheck} /><div className="mt-4 grid grid-cols-2 gap-2"><MiniAction label="M’attribuer" icon={UserRoundCheck} onClick={() => void conversationAction("assign", { assigned_user_id: data?.actor.id }, "Conversation attribuée")} /><MiniAction label="Escalader" icon={ShieldAlert} onClick={() => void updateConversation({ status: "escalated" }, "Conversation escaladée")} /><MiniAction label="Attente client" icon={Clock3} onClick={() => void updateConversation({ status: "waiting_customer" }, "Conversation placée en attente client")} /><MiniAction label="Transférer" icon={ArrowRightLeft} onClick={() => setNotice({ tone: "info", title: "Transfert contrôlé", description: "Utilisez Team Operations pour choisir un opérateur selon capacité, compétence et file." })} /></div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="AC Intelligence" title="Assistance contextualisée" icon={Bot} /><div className="mt-4 space-y-2"><AiAction label="Résumer la conversation" icon={FileText} onClick={() => void runAi("summary")} /><AiAction label="Traduire / harmoniser" icon={Languages} onClick={() => void runAi("translate")} /><AiAction label="Recommander l’action suivante" icon={Sparkles} onClick={() => void runAi("next_action")} /></div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="Engagements" title="Relances planifiées" icon={Clock3} action={<button type="button" onClick={() => setFollowupOpen(true)} className="rounded-xl border border-blue-300 bg-blue-100 px-3 py-2 text-[8px] font-black text-blue-950">Créer</button>} /><div className="mt-4 space-y-2">{(detail?.followups || []).filter((task) => task.status === "open").slice(0, 4).map((task) => <div key={task.id} className="rounded-xl border border-slate-300 bg-white p-3"><div className="flex items-start justify-between gap-2"><p className="text-[9px] font-black text-slate-950">{task.title}</p><StatusPill status={task.priority || "normal"} compact /></div><p className="mt-1 text-[8px] font-bold text-slate-600">Échéance · {formatDateTime(task.due_at)}</p></div>)}{!(detail?.followups || []).some((task) => task.status === "open") ? <p className="text-[9px] font-semibold text-slate-600">Aucune relance ouverte.</p> : null}</div></Surface>
        <Surface className="p-4"><SurfaceHeader eyebrow="Traçabilité" title="Événements récents" icon={Tag} /><div className="mt-4 space-y-3">{(detail?.events || []).slice(0, 6).map((event, index) => <div key={event.id || index} className="relative border-l border-slate-300 pl-3"><span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-slate-700" /><p className="text-[9px] font-black text-slate-900">{String(event.event_type || "Événement").replaceAll("_", " ")}</p><p className="mt-1 text-[8px] font-semibold text-slate-600">{event.actor?.display_name ? `${event.actor.display_name} · ` : ""}{formatRelative(event.created_at)}</p></div>)}{!detail?.events.length ? <p className="text-[9px] font-semibold text-slate-600">Aucun événement enregistré.</p> : null}</div></Surface>
      </div> : null}</aside>
    </section>

    {newOpen && data ? <NewConversationModal data={data} onClose={() => setNewOpen(false)} onCreated={async (id) => { setNewOpen(false); setSelectedId(id); await refresh(); setNotice({ tone: "success", title: "Conversation créée", description: "Le dossier est prêt dans Live Command." }) }} /> : null}
    {aiOpen ? <ModalFrame title="AC Intelligence · Assistance" eyebrow="Human-in-the-loop" description="La suggestion reste sous contrôle humain et ne part jamais automatiquement." onClose={() => setAiOpen(false)} footer={<div className="flex justify-end"><button type="button" onClick={() => setAiOpen(false)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white">Revenir à la conversation</button></div>}><div className="rounded-2xl border border-violet-300 bg-violet-100 p-4"><p className="text-[8px] font-black uppercase tracking-[.16em] text-violet-950">Résultat proposé</p><div className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-950">{aiBusy ? "Analyse de la conversation et du contexte…" : aiResult || "Aucune proposition disponible."}</div></div></ModalFrame> : null}
    {assignmentOpen && selected && data ? <AssignmentModal conversation={selected} users={data.users || []} queues={data.queues || []} onClose={() => setAssignmentOpen(false)} onSave={async (payload) => { await conversationAction("transfer", payload, "Responsabilité mise à jour"); setAssignmentOpen(false) }} /> : null}
    {followupOpen && selected ? <FollowupModal conversation={selected} actorId={data?.actor.id || ""} onClose={() => setFollowupOpen(false)} onSave={async (payload) => { await conversationAction("create_followup", payload, "Relance planifiée"); setFollowupOpen(false) }} /> : null}
    {deleteOpen ? <ModalFrame title="Suppression administrative" eyebrow="Action irréversible" description="L’archivage est recommandé. La suppression permanente efface la conversation et ses messages du périmètre AC WhatsApp." onClose={() => setDeleteOpen(false)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleteOpen(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={!deleteReason.trim()} onClick={() => void permanentDelete()} className="rounded-xl bg-rose-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Supprimer définitivement</button></div>}><label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[.12em] text-slate-700">Motif obligatoire</span><textarea value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 p-3 text-sm font-semibold text-slate-950 outline-none focus:border-rose-600" placeholder="Justification administrative…" /></label></ModalFrame> : null}
  </div>
}

function ConversationMenu({ conversation, labels, selectedLabels, canDelete, onAction, onToggleLabel, onAssign, onFollowup, onInternalNote, onSync, onDelete, onCopy }: { conversation: AcWhatsAppConversation; labels: Array<Record<string, any>>; selectedLabels: Set<string>; canDelete: boolean; onAction: (action: string, payload?: Record<string, unknown>, success?: string) => void; onToggleLabel: (id: string) => void; onAssign: () => void; onFollowup: () => void; onInternalNote: () => void; onSync: () => void; onDelete: () => void; onCopy: () => void }) {
  const metadata = (conversation.metadata || {}) as Record<string, any>
  const resolved = ["resolved", "closed"].includes(conversation.status)
  return <div className="absolute right-0 top-11 z-40 w-80 rounded-[22px] border border-slate-300 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,.22)]">
    <p className="px-3 pb-2 pt-1 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Commandes de conversation</p>
    <MenuAction icon={conversation.unread_count ? CheckCheck : MessageCircleMore} label={conversation.unread_count ? "Marquer comme lue" : "Marquer comme non lue"} onClick={() => onAction(conversation.unread_count ? "mark_read" : "mark_unread", {}, conversation.unread_count ? "Conversation marquée lue" : "Conversation marquée non lue")} />
    <MenuAction icon={UserRoundCheck} label="Attribuer ou transférer" onClick={onAssign} />
    <MenuAction icon={resolved ? RotateCcw : CheckCheck} label={resolved ? "Rouvrir la conversation" : "Résoudre la conversation"} onClick={() => onAction(resolved ? "reopen" : "resolve", {}, resolved ? "Conversation rouverte" : "Conversation résolue")} />
    <MenuAction icon={Clock3} label="Créer une relance" onClick={onFollowup} />
    <MenuAction icon={FileText} label="Ajouter une note interne" onClick={onInternalNote} />
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Priorité</p>
    <div className="grid grid-cols-3 gap-1 px-1 pb-2">{[["normal","Normale"],["high","Élevée"],["critical","Critique"]].map(([value,label]) => <button key={value} type="button" onClick={() => onAction("", { priority: value }, `Priorité ${String(label).toLowerCase()}`)} className={cx("rounded-lg border px-2 py-2 text-[8px] font-black", conversation.priority === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100")}>{label}</button>)}</div>
    <MenuAction icon={metadata.pinned ? PinOff : Pin} label={metadata.pinned ? "Désépingler" : "Épingler"} onClick={() => onAction(metadata.pinned ? "unpin" : "pin", {}, metadata.pinned ? "Conversation désépinglée" : "Conversation épinglée")} />
    <MenuAction icon={metadata.muted ? Bell : BellOff} label={metadata.muted ? "Réactiver les notifications" : "Mettre en silencieux"} onClick={() => onAction(metadata.muted ? "unmute" : "mute", {}, metadata.muted ? "Notifications réactivées" : "Conversation mise en silencieux")} />
    <MenuAction icon={conversation.status === "archived" ? RotateCcw : Archive} label={conversation.status === "archived" ? "Restaurer" : "Archiver"} onClick={() => onAction(conversation.status === "archived" ? "restore" : "archive", {}, conversation.status === "archived" ? "Conversation restaurée" : "Conversation archivée")} />
    <MenuAction icon={RotateCcw} label="Synchroniser maintenant" onClick={onSync} />
    <MenuAction icon={Copy} label="Copier le numéro" onClick={onCopy} />
    <a href={`/ac-whatsapp/contacts?contact=${encodeURIComponent(conversation.contact_id)}`} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black text-slate-900 hover:bg-slate-100"><CircleUserRound className="h-4 w-4 text-slate-700" />Ouvrir le dossier contact</a>
    <div className="my-2 border-t border-slate-200" />
    <p className="px-3 pb-2 text-[8px] font-black uppercase tracking-[.16em] text-slate-600">Étiquettes</p>
    <div className="max-h-44 overflow-y-auto">{labels.length ? labels.map((label) => <button key={label.id} type="button" onClick={() => onToggleLabel(String(label.id))} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-100"><span className="flex min-w-0 items-center gap-2 text-[9px] font-black text-slate-900"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: String(label.color || "#64748b") }} />{label.name}</span><span className={cx("grid h-5 w-5 place-items-center rounded-md border text-[8px] font-black", selectedLabels.has(String(label.id)) ? "border-slate-950 bg-slate-950 text-white" : "border-slate-300 bg-white text-transparent")}>✓</span></button>) : <p className="px-3 py-2 text-[9px] font-semibold text-slate-600">Aucune étiquette active.</p>}</div>
    {canDelete ? <><div className="my-2 border-t border-slate-200" /><MenuAction icon={Trash2} label="Supprimer définitivement" danger onClick={onDelete} /></> : null}
  </div>
}

function MenuAction({ icon: Icon, label, onClick, danger = false }: { icon: typeof Archive; label: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={cx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-black hover:bg-slate-100", danger ? "text-rose-800" : "text-slate-900")}><Icon className="h-4 w-4" />{label}</button> }
function humanValue(value: unknown, fallback: string) { const raw = String(value || "").trim(); if (!raw || ["unknown", "undefined", "null", "n/a"].includes(raw.toLowerCase())) return fallback; const map: Record<string, string> = { normal: "Normale", high: "Élevée", urgent: "Urgente", vip: "VIP", prospect: "Prospect", customer: "Client", unqualified: "Contact non qualifié", new: "Nouveau" }; return map[raw.toLowerCase()] || raw.replaceAll("_", " ") }
function PulseCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof MessageCircleMore; tone: "slate" | "amber" | "blue" | "rose" }) { const color = { slate: "bg-slate-950", amber: "bg-amber-500", blue: "bg-blue-600", rose: "bg-rose-600" }[tone]; return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-600">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-[9px] font-semibold text-slate-600">{detail}</p></div><div className={cx("grid h-10 w-10 place-items-center rounded-2xl text-white", color)}><Icon className="h-4 w-4" /></div></div></div> }
function ConversationRow({ row, active, onClick }: { row: AcWhatsAppConversation; active: boolean; onClick: () => void }) { const latestSender = row.last_message_sender_display_name_snapshot || (row.last_message_direction === "inbound" ? row.contact?.display_name : row.account?.name); return <button type="button" onClick={onClick} className={cx("mb-2 flex w-full gap-3 rounded-[20px] border p-3.5 text-left transition", active ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_35px_rgba(15,23,42,.18)]" : "border-slate-200 bg-white text-slate-950 hover:border-slate-400")}><div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[11px] font-black", active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-800")}>{initials(row.contact?.display_name)}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-[11px] font-black">{row.contact?.display_name || row.contact?.phone_number_e164 || "Contact non identifié"}</p><span className={cx("shrink-0 text-[8px] font-bold", active ? "text-slate-300" : "text-slate-600")}>{formatRelative(row.last_message_at)}</span></div><p className={cx("mt-1 truncate text-[10px] font-semibold", active ? "text-slate-200" : "text-slate-700")}>{row.last_message_preview || "Nouvelle conversation"}</p><p className={cx("mt-1 truncate text-[8px] font-bold", active ? "text-sky-200" : "text-slate-600")}>{latestSender ? `Dernier message · ${latestSender}` : "Auteur à confirmer"}</p><div className="mt-2 flex items-center justify-between gap-2"><span className={cx("truncate text-[8px] font-black", active ? "text-rose-200" : "text-slate-700")}>{row.queue?.name || row.account?.name || "File générale"}</span>{row.unread_count > 0 && !active ? <span className="grid h-6 min-w-6 place-items-center rounded-full bg-rose-600 px-1.5 text-[9px] font-black text-white">{row.unread_count}</span> : <StatusPill status={row.status} compact />}</div></div></button> }
function MessageBubble({ message }: { message: AcWhatsAppMessage }) {
  const outbound = message.direction === "outbound"
  const internal = message.direction === "internal"
  const voice = ["voice", "audio"].includes(String(message.message_type || "").toLowerCase())
  const identity = message.sender_identity || {
    display_name: message.sender_display_name_snapshot || (outbound ? "Opérateur non résolu" : internal ? "Membre AngelCare" : "Contact non identifié"),
    role: message.sender_role_snapshot || (outbound ? "Membre AngelCare" : internal ? "Note interne" : "Contact"),
    type: message.sender_type || message.direction,
    origin: message.message_origin,
  }
  return <div className={cx("flex", outbound ? "justify-end" : "justify-start")}>
    <div className={cx("max-w-[84%] rounded-[22px] border px-4 py-3 shadow-sm", outbound ? "rounded-br-md border-slate-900 bg-slate-950 text-white" : internal ? "border-amber-400 bg-amber-100 text-slate-950" : "rounded-bl-md border-slate-300 bg-white text-slate-950")}>
      <div className={cx("mb-2 flex flex-wrap items-center gap-2 border-b pb-2", outbound ? "border-white/15" : internal ? "border-amber-300" : "border-slate-200")}>
        <span className={cx("text-[9px] font-black", outbound ? "text-sky-200" : "text-slate-950")}>{identity.display_name}</span>
        <span className={cx("text-[8px] font-bold", outbound ? "text-slate-300" : "text-slate-600")}>{identity.role}</span>
        {message.campaign_name_snapshot ? <span className="rounded-md bg-violet-100 px-2 py-1 text-[7px] font-black text-violet-950">{message.campaign_name_snapshot}</span> : null}
        {message.responsible_identity?.display_name ? <span className={cx("text-[7px] font-bold", outbound ? "text-slate-300" : "text-slate-600")}>Responsable : {message.responsible_identity.display_name}</span> : null}
      </div>
      {voice ? <VoiceMessagePlayer message={message} inverted={outbound} /> : <div className="whitespace-pre-wrap text-[12px] font-semibold leading-6">{message.body || message.caption || `[${message.message_type}]`}</div>}
      {voice && (message.caption || message.body) ? <p className={cx("mt-2 text-[9px] font-semibold", outbound ? "text-slate-300" : "text-slate-700")}>{message.caption || message.body}</p> : null}
      <div className={cx("mt-2 flex items-center justify-end gap-2 text-[8px] font-bold", outbound ? "text-slate-300" : "text-slate-600")}>
        <span>{formatDateTime(message.sent_at || message.received_at || message.created_at)}</span>
        {outbound ? <><StatusPill status={message.status} compact />{["delivered", "read"].includes(message.status) ? <CheckCheck className="h-3.5 w-3.5" /> : null}</> : null}
      </div>
      {message.error_message ? <p className="mt-2 rounded-lg border border-rose-300 bg-rose-100 px-2 py-1 text-[8px] font-bold text-rose-950">{message.error_message}</p> : null}
    </div>
  </div>
}
function ComposerButton({ icon: Icon, label }: { icon: typeof Paperclip; label: string }) { return <button type="button" className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[8px] font-black text-slate-700 hover:bg-slate-100"><Icon className="h-3.5 w-3.5" />{label}</button> }
function InfoLine({ label, value }: { label: string; value?: string | null }) { return <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5 last:border-0"><span className="text-[8px] font-black uppercase tracking-[.12em] text-slate-600">{label}</span><span className="truncate text-[10px] font-black text-slate-950">{value || "—"}</span></div> }
function MiniAction({ label, icon: Icon, onClick }: { label: string; icon: typeof UserRoundCheck; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-2xl border border-slate-300 bg-white p-3 text-left hover:border-slate-500 hover:bg-slate-50"><Icon className="h-4 w-4 text-slate-900" /><p className="mt-2 text-[9px] font-black text-slate-900">{label}</p></button> }
function AiAction({ label, icon: Icon, onClick }: { label: string; icon: typeof Sparkles; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-violet-300 bg-violet-100 px-3 py-2.5 text-left text-[9px] font-black text-violet-950"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</span><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button> }

const controlClass = "w-full rounded-[14px] border border-slate-300 bg-white px-3 py-2.5 text-[11px] font-bold text-slate-950 outline-none focus:border-slate-600 focus:ring-4 focus:ring-slate-200/60"

function AssignmentModal({ conversation, users, queues, onClose, onSave }: { conversation: AcWhatsAppConversation; users: Array<Record<string, any>>; queues: Array<Record<string, any>>; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const [form, setForm] = useState({ assigned_user_id: conversation.assigned_user_id || "", queue_id: conversation.queue_id || "" })
  const [busy, setBusy] = useState(false)
  return <ModalFrame title="Attribuer ou transférer" eyebrow="Responsabilité opérationnelle" description="Choisissez la file et le responsable en conservant tout le contexte de la conversation." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(form) } finally { setBusy(false) } }} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Enregistrement…" : "Confirmer"}</button></div>}><div className="grid gap-4 md:grid-cols-2"><Field label="File responsable"><select value={form.queue_id} onChange={(event) => setForm({ ...form, queue_id: event.target.value })} className={controlClass}><option value="">File générale</option>{queues.map((queue) => <option key={String(queue.id)} value={String(queue.id)}>{String(queue.name || queue.code)}</option>)}</select></Field><Field label="Opérateur"><select value={form.assigned_user_id} onChange={(event) => setForm({ ...form, assigned_user_id: event.target.value })} className={controlClass}><option value="">Non attribuée</option>{users.map((user) => <option key={String(user.id)} value={String(user.id)}>{String(user.display_name || user.full_name || user.name || user.email || "Opérateur")}</option>)}</select></Field></div></ModalFrame>
}

function FollowupModal({ conversation, actorId, onClose, onSave }: { conversation: AcWhatsAppConversation; actorId: string; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void> }) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000); tomorrow.setSeconds(0, 0)
  const [form, setForm] = useState({ title: `Relancer ${conversation.contact?.display_name || "le contact"}`, notes: "", due_at: tomorrow.toISOString().slice(0, 16), priority: "normal", assigned_user_id: conversation.assigned_user_id || actorId })
  const [busy, setBusy] = useState(false)
  return <ModalFrame title="Créer une relance" eyebrow="Engagement contrôlé" description="La relance devient un engagement daté, attribué et visible dans le dossier relationnel." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" disabled={busy || !form.title.trim() || !form.due_at} onClick={async () => { setBusy(true); try { await onSave({ ...form, due_at: new Date(form.due_at).toISOString() }) } finally { setBusy(false) } }} className="rounded-xl bg-blue-700 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Planification…" : "Planifier"}</button></div>}><div className="grid gap-4"><Field label="Objet"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={controlClass} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Échéance"><input type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} className={controlClass} /></Field><Field label="Priorité"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className={controlClass}><option value="normal">Normale</option><option value="high">Élevée</option><option value="critical">Critique</option></select></Field></div><Field label="Notes"><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} className={cx(controlClass, "min-h-28")} /></Field></div></ModalFrame>
}

function NewConversationModal({ data, onClose, onCreated }: { data: NonNullable<ReturnType<typeof useAcWhatsApp>["data"]>; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ account_id: data.accounts.find((account) => account.status === "connected")?.id || data.accounts[0]?.id || "", contact_id: "", phone_number_e164: "", display_name: "", organization_name: "", queue_id: data.queues[0]?.id || "", priority: "normal", assign_to_me: true })
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<Notice | null>(null)
  async function submit() { setBusy(true); try { const created = await acApi<any>("/api/ac-whatsapp/conversations", { method: "POST", body: JSON.stringify(form) }); onCreated(created.id) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } finally { setBusy(false) } }
  return <ModalFrame title="Ouvrir une conversation" eyebrow="Provisionnement relationnel" description="Associez le bon compte, le bon contact et la file responsable avant le premier message." onClose={onClose} footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-900">Annuler</button><button type="button" onClick={() => void submit()} disabled={busy || !form.account_id || (!form.contact_id && !form.phone_number_e164)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{busy ? "Création…" : "Créer le dossier"}</button></div>}>{notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description} /> : null}<div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Compte WhatsApp"><select value={form.account_id} onChange={(event) => setForm({ ...form, account_id: event.target.value })} className="input-premium">{data.accounts.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.status}</option>)}</select></Field><Field label="File responsable"><select value={form.queue_id} onChange={(event) => setForm({ ...form, queue_id: event.target.value })} className="input-premium"><option value="">File générale</option>{data.queues.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field><Field label="Contact existant"><select value={form.contact_id} onChange={(event) => setForm({ ...form, contact_id: event.target.value })} className="input-premium"><option value="">Créer depuis le numéro</option>{data.contacts.map((row) => <option key={row.id} value={row.id}>{row.display_name || row.phone_number_e164}</option>)}</select></Field><Field label="Numéro E.164"><input value={form.phone_number_e164} onChange={(event) => setForm({ ...form, phone_number_e164: event.target.value })} placeholder="+212…" className="input-premium" /></Field><Field label="Nom du contact"><input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="input-premium" /></Field><Field label="Organisation"><input value={form.organization_name} onChange={(event) => setForm({ ...form, organization_name: event.target.value })} className="input-premium" /></Field></div><style jsx global>{`.input-premium{width:100%;border:1px solid #cbd5e1;border-radius:14px;background:#fff;padding:11px 12px;font-size:11px;font-weight:700;color:#0f172a;outline:none}.input-premium:focus{border-color:#475569;box-shadow:0 0 0 3px rgba(71,85,105,.13)}`}</style></ModalFrame>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[8px] font-black uppercase tracking-[.14em] text-slate-700">{label}</span>{children}</label> }
