'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CirclePause, CirclePlay, Radio, RefreshCw } from 'lucide-react'

type PulseItem = {
  id: string
  label: string
  detail: string
  href: string
  time?: string | null
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'
}

function text(value: unknown, fallback = '') { return value === null || value === undefined || value === '' ? fallback : String(value) }
function timeLabel(value: unknown) {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function unique(items: PulseItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true }).slice(0, 18)
}

function mapSnapshot(snapshot: any): PulseItem[] {
  const history = Array.isArray(snapshot?.history) ? snapshot.history : []
  const alerts = Array.isArray(snapshot?.alerts) ? snapshot.alerts : []
  const incidents = Array.isArray(snapshot?.incidents) ? snapshot.incidents : []
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : []
  const missions = Array.isArray(snapshot?.missions) ? snapshot.missions : []

  return unique([
    ...alerts.map((row: any, index: number) => ({
      id: `alert-${text(row.id, String(index))}`,
      label: text(row.title, 'Alerte opérationnelle'),
      detail: text(row.body || row.summary || row.type, 'Action requise'),
      href: row.missionId ? `/carelink-ops/missions/${row.missionId}` : '/carelink-ops/notifications',
      time: timeLabel(row.createdAt || row.created_at || row.updatedAt),
      tone: text(row.priority || row.severity).toLowerCase().includes('critical') ? 'rose' as const : 'amber' as const,
    })),
    ...incidents.map((row: any, index: number) => ({
      id: `incident-${text(row.id, String(index))}`,
      label: text(row.title, 'Incident'),
      detail: text(row.summary || row.status || row.city, 'Suivi incident'),
      href: '/carelink-ops/incidents',
      time: timeLabel(row.createdAt || row.created_at || row.updatedAt),
      tone: 'rose' as const,
    })),
    ...history.map((row: any, index: number) => ({
      id: `history-${text(row.id, String(index))}-${text(row.createdAt || row.created_at)}`,
      label: text(row.action, 'Événement CARELINK').replaceAll('_', ' '),
      detail: [row.entityType || row.entity_type, row.actorName || row.actor_name].filter(Boolean).join(' · ') || 'Traçabilité opérationnelle',
      href: '/carelink-ops/audit',
      time: timeLabel(row.createdAt || row.created_at),
      tone: 'violet' as const,
    })),
    ...messages.filter((row: any) => row.unread || row.isUnread || row.status === 'unread').map((row: any, index: number) => ({
      id: `message-${text(row.id, String(index))}`,
      label: text(row.title || row.subject, 'Nouveau message'),
      detail: text(row.body, 'Message dispatch'),
      href: '/carelink-ops/messages',
      time: timeLabel(row.createdAt || row.created_at || row.lastMessageAt),
      tone: 'blue' as const,
    })),
    ...missions.filter((row: any) => {
      const status = text(row.status || row.lifecycleStage || row.lifecycle_stage).toLowerCase()
      return status.includes('progress') || status.includes('route') || status.includes('risk') || status.includes('report')
    }).map((row: any, index: number) => ({
      id: `mission-${text(row.id, String(index))}-${text(row.status)}`,
      label: text(row.code || row.missionCode || row.reference, 'Mission active'),
      detail: [row.status || row.lifecycleStage, row.city || row.zone, row.caregiverName].filter(Boolean).join(' · '),
      href: row.id ? `/carelink-ops/missions/${row.id}` : '/carelink-ops/missions',
      time: timeLabel(row.updatedAt || row.updated_at || row.scheduledStart),
      tone: text(row.status).toLowerCase().includes('risk') ? 'rose' as const : 'emerald' as const,
    })),
  ])
}

const toneClass: Record<PulseItem['tone'], string> = {
  blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', violet: 'bg-violet-500',
}

export function CareLinkOpsLivePulseBar() {
  const [items, setItems] = useState<PulseItem[]>([])
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setInterval> | null = null
    async function refresh() {
      try {
        const response = await fetch('/api/carelink/ops/control-room', { cache: 'no-store', headers: { Accept: 'application/json' } })
        const payload = await response.json().catch(() => null)
        if (!active) return
        if (!response.ok || !payload) throw new Error(payload?.error || 'Flux CARELINK indisponible')
        setItems(mapSnapshot(payload))
        setError('')
      } catch (cause) {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Flux CARELINK indisponible')
      } finally {
        if (active) setLoading(false)
      }
    }
    refresh()
    timer = setInterval(refresh, 30000)
    return () => { active = false; if (timer) clearInterval(timer) }
  }, [])

  const repeated = useMemo(() => items.length ? [...items, ...items] : items, [items])

  return (
    <div className="relative flex h-11 items-center overflow-hidden border-b border-slate-200 bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="relative z-10 flex h-full shrink-0 items-center gap-2 border-r border-white/10 bg-slate-950 px-4 sm:px-5">
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
        <Radio size={14} className="text-emerald-300" />
        <span className="hidden text-[10px] font-black uppercase tracking-[0.22em] sm:inline">Pulse live</span>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        {loading ? <div className="flex items-center gap-2 px-5 text-xs font-bold text-slate-300"><RefreshCw size={13} className="animate-spin" /> Synchronisation des événements CARELINK…</div> : null}
        {!loading && error ? <div className="flex items-center gap-2 px-5 text-xs font-bold text-amber-200"><AlertTriangle size={14} /> {error}</div> : null}
        {!loading && !error && !items.length ? <div className="px-5 text-xs font-bold text-slate-300">Aucun événement live actuellement. Le flux reste connecté aux données CARELINK réelles.</div> : null}
        {!loading && !error && items.length ? (
          <div className={`carelink-pulse-track flex w-max items-center ${paused ? 'carelink-pulse-paused' : ''}`}>
            {repeated.map((item, index) => (
              <Link key={`${item.id}-${index}`} href={item.href} className="group flex h-11 items-center gap-2.5 border-r border-white/10 px-5 transition hover:bg-white/10">
                <span className={`h-1.5 w-1.5 rounded-full ${toneClass[item.tone]}`} />
                <span className="whitespace-nowrap text-[11px] font-black text-white">{item.label}</span>
                <span className="max-w-[260px] truncate text-[11px] font-semibold text-slate-300">{item.detail}</span>
                {item.time ? <span className="whitespace-nowrap text-[10px] font-black text-slate-500">{item.time}</span> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <button type="button" onClick={() => setPaused((value) => !value)} className="relative z-10 grid h-full w-12 shrink-0 place-items-center border-l border-white/10 bg-slate-950 text-slate-300 transition hover:text-white" aria-label={paused ? 'Reprendre le flux' : 'Mettre le flux en pause'}>
        {paused ? <CirclePlay size={16} /> : <CirclePause size={16} />}
      </button>

      <style>{`
        .carelink-pulse-track { animation: carelinkPulseScroll 46s linear infinite; }
        .carelink-pulse-track.carelink-pulse-paused { animation-play-state: paused; }
        @keyframes carelinkPulseScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .carelink-pulse-track { animation: none !important; } }
      `}</style>
    </div>
  )
}
