"use client"

import { useCallback, useEffect, useState } from "react"
import { Clock3, LoaderCircle, MessageCircleMore, RefreshCw } from "lucide-react"
import type { WhatsAppContextType } from "@/lib/whatsapp-desktop/context-types"

type TimelineEvent = {
  id: string
  event_type: string
  title: string
  detail?: string | null
  created_at: string
  user_id?: string | null
}

type TimelinePayload = {
  sessions: Array<{ id: string; entity_name: string; communication_purpose: string; status: string; created_at: string }>
  events: TimelineEvent[]
}

type Envelope<T> = { ok: boolean; data?: T; error?: string }

function stamp(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function WhatsAppEntityTimeline({
  contextType,
  entityId,
  compact = false,
}: {
  contextType: WhatsAppContextType
  entityId: string
  compact?: boolean
}) {
  const [payload, setPayload] = useState<TimelinePayload>({ sessions: [], events: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/whatsapp-desktop/context/entity-timeline?context_type=${encodeURIComponent(contextType)}&entity_id=${encodeURIComponent(entityId)}`, { cache: "no-store" })
      const body = await response.json().catch(() => null) as Envelope<TimelinePayload> | null
      if (!response.ok || !body?.ok) throw new Error(body?.error || `HTTP_${response.status}`)
      setPayload(body.data || { sessions: [], events: [] })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setLoading(false)
    }
  }, [contextType, entityId])

  useEffect(() => { void load() }, [load])

  return (
    <section className={`rounded-[24px] border border-slate-200 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><MessageCircleMore className="h-4 w-4" /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[.15em] text-emerald-700">Traçabilité WhatsApp</p><h3 className="text-sm font-black text-slate-950">Historique opérationnel déclaré</h3></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40" aria-label="Actualiser l’historique">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</button>
      </div>

      {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p> : null}
      {!loading && !error && !payload.events.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">Aucune activité WhatsApp déclarée pour ce dossier.</p> : null}
      {payload.events.length ? <div className="mt-4 space-y-3">{payload.events.slice(0, compact ? 8 : 25).map((event) => <article key={event.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div className="min-w-0"><p className="text-xs font-black text-slate-900">{event.title}</p>{event.detail ? <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-600">{event.detail}</p> : null}<p className="mt-1 text-[9px] font-black uppercase tracking-[.1em] text-slate-400">{stamp(event.created_at)} · {event.event_type.replace(/_/g, " ")}</p></div></article>)}</div> : null}
      <p className="mt-4 text-[10px] font-semibold leading-4 text-slate-500">Cette chronologie présente les ouvertures, résultats, suivis, transferts et escalades enregistrés par ANGELCARE. Elle ne prétend pas lire l’état de livraison ou de lecture depuis WhatsApp Web.</p>
    </section>
  )
}
