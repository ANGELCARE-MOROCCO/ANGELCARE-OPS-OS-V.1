'use client'

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleX,
  Clock3,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ActionStatus = 'working' | 'success' | 'error'

export interface ServiceDesignActionRecord {
  id: string
  title: string
  detail: string
  objectLabel?: string
  status: ActionStatus
  progress: number
  currentStep?: string
  instruction?: string
  preserved?: string
  startedAt: number
  completedAt?: number
  visible: boolean
}

interface StartActionInput {
  title: string
  detail: string
  objectLabel?: string
  progress?: number
  currentStep?: string
}

interface CompleteActionInput {
  detail: string
  currentStep?: string
}

interface FailActionInput {
  detail: string
  instruction: string
  preserved?: string
}

interface ServiceDesignActionContextValue {
  start: (input: StartActionInput) => string
  update: (id: string, patch: Partial<Omit<ServiceDesignActionRecord, 'id' | 'startedAt'>>) => void
  succeed: (id: string, input: CompleteActionInput) => void
  fail: (id: string, input: FailActionInput) => void
  dismiss: (id: string) => void
}

const ActionContext = createContext<ServiceDesignActionContextValue | null>(null)

function actionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `sd-action-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ServiceDesignActionProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ServiceDesignActionRecord[]>([])
  const [centreOpen, setCentreOpen] = useState(false)

  const start = useCallback((input: StartActionInput) => {
    const id = actionId()
    const record: ServiceDesignActionRecord = {
      id,
      title: input.title,
      detail: input.detail,
      objectLabel: input.objectLabel,
      status: 'working',
      progress: Math.max(0, Math.min(99, input.progress ?? 6)),
      currentStep: input.currentStep,
      startedAt: Date.now(),
      visible: true,
    }
    setRecords((current) => [record, ...current].slice(0, 40))
    return id
  }, [])

  const update = useCallback((id: string, patch: Partial<Omit<ServiceDesignActionRecord, 'id' | 'startedAt'>>) => {
    setRecords((current) => current.map((record) => record.id === id
      ? { ...record, ...patch, progress: patch.progress == null ? record.progress : Math.max(0, Math.min(100, patch.progress)) }
      : record))
  }, [])

  const succeed = useCallback((id: string, input: CompleteActionInput) => {
    setRecords((current) => current.map((record) => record.id === id ? {
      ...record,
      status: 'success',
      progress: 100,
      detail: input.detail,
      currentStep: input.currentStep || 'Terminé',
      completedAt: Date.now(),
      visible: true,
    } : record))
  }, [])

  const fail = useCallback((id: string, input: FailActionInput) => {
    setRecords((current) => current.map((record) => record.id === id ? {
      ...record,
      status: 'error',
      detail: input.detail,
      instruction: input.instruction,
      preserved: input.preserved,
      completedAt: Date.now(),
      visible: true,
    } : record))
  }, [])

  const dismiss = useCallback((id: string) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, visible: false } : record))
  }, [])

  const value = useMemo(() => ({ start, update, succeed, fail, dismiss }), [dismiss, fail, start, succeed, update])
  const visible = records.filter((record) => record.visible).slice(0, 4)
  const activeCount = records.filter((record) => record.status === 'working').length
  const failedCount = records.filter((record) => record.status === 'error').length

  return <ActionContext.Provider value={value}>
    {children}

    <button
      type="button"
      onClick={() => setCentreOpen((value) => !value)}
      data-service-design-overlay="true" className="fixed right-5 top-[112px] z-[940] inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-700 bg-[#07142b] px-3 text-[10px] font-black uppercase tracking-[.12em] text-white shadow-[0_16px_45px_rgba(15,23,42,.28)] transition hover:-translate-y-0.5"
      aria-expanded={centreOpen}
      aria-label="Ouvrir le centre des actions Service Design"
    >
      {activeCount ? <Loader2 size={14} className="animate-spin text-cyan-300" /> : failedCount ? <AlertTriangle size={14} className="text-rose-300" /> : <Clock3 size={14} className="text-blue-300" />}
      Actions {activeCount || failedCount ? `· ${activeCount + failedCount}` : ''}
      {centreOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
    </button>

    <div data-service-design-overlay="true" className="pointer-events-none fixed right-5 top-[160px] z-[941] flex w-[min(480px,calc(100vw-var(--carelink-sidebar-current-width,0px)-40px))] max-w-[calc(100vw-40px)] flex-col gap-3" aria-live="polite" aria-atomic="false">
      {visible.map((record) => <ActionToast key={record.id} record={record} onDismiss={() => dismiss(record.id)} />)}
    </div>

    {centreOpen ? <ActionCentre records={records} onClose={() => setCentreOpen(false)} onDismiss={dismiss} /> : null}
  </ActionContext.Provider>
}

export function useServiceDesignActions() {
  const context = useContext(ActionContext)
  if (!context) throw new Error('useServiceDesignActions must be used inside ServiceDesignActionProvider.')
  return context
}

function ActionToast({ record, onDismiss }: { record: ServiceDesignActionRecord; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(3000)
  const lastTick = useRef(Date.now())

  useEffect(() => {
    if (record.status !== 'success') return
    lastTick.current = Date.now()
    const timer = window.setInterval(() => {
      if (paused) { lastTick.current = Date.now(); return }
      const now = Date.now()
      const elapsed = now - lastTick.current
      lastTick.current = now
      setRemaining((value) => Math.max(0, value - elapsed))
    }, 80)
    return () => window.clearInterval(timer)
  }, [paused, record.status])

  useEffect(() => {
    if (record.status === 'success' && remaining <= 0) onDismiss()
  }, [onDismiss, record.status, remaining])

  const tone = record.status === 'success'
    ? 'border-emerald-400/35 bg-[#071b20]'
    : record.status === 'error'
      ? 'border-rose-300/45 bg-[#28101d]'
      : 'border-blue-300/35 bg-[#071a36]'
  const progressTone = record.status === 'success' ? 'bg-emerald-400' : record.status === 'error' ? 'bg-rose-400' : 'bg-gradient-to-r from-blue-500 to-cyan-300'
  const Icon = record.status === 'success' ? CheckCircle2 : record.status === 'error' ? CircleX : Loader2

  return <article
    className={`pointer-events-auto relative max-h-[210px] overflow-y-auto rounded-[24px] border ${tone} p-4 text-white shadow-[0_22px_70px_rgba(2,6,23,.38)] backdrop-blur-xl [scrollbar-width:thin]`}
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)}
    onBlur={() => setPaused(false)}
    role={record.status === 'error' ? 'alert' : 'status'}
  >
    <div className="flex items-start gap-3">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${record.status === 'success' ? 'bg-emerald-400/15 text-emerald-300' : record.status === 'error' ? 'bg-rose-400/15 text-rose-300' : 'bg-blue-400/15 text-cyan-300'}`}>
        <Icon size={18} className={record.status === 'working' ? 'animate-spin' : ''} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-300">Service Design · Action live</p>
        <h3 className="mt-1 text-sm font-black leading-5">{record.title}</h3>
        {record.objectLabel ? <p className="mt-1 truncate text-[11px] font-bold text-blue-200">{record.objectLabel}</p> : null}
      </div>
      <button type="button" onClick={onDismiss} className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Fermer la notification"><X size={14} /></button>
    </div>

    <p className="mt-3 text-xs font-semibold leading-5 text-slate-100">{record.detail}</p>
    {record.currentStep ? <p className="mt-2 text-[10px] font-black uppercase tracking-[.12em] text-cyan-200">{record.currentStep}</p> : null}
    {record.instruction ? <div className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-100/5 p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-rose-300">Action à effectuer</p><p className="mt-1 text-[11px] font-bold leading-5 text-rose-100">{record.instruction}</p></div> : null}
    {record.preserved ? <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-300">{record.preserved}</p> : null}

    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
      <div className={`h-full rounded-full transition-[width] duration-300 ${progressTone}`} style={{ width: record.status === 'success' ? `${Math.max(0, remaining / 30)}%` : `${record.progress}%` }} />
    </div>
    <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[.1em] text-slate-300">
      <span>{record.status === 'success' ? paused ? 'Fermeture en pause' : 'Fermeture dans 3 secondes' : record.status === 'error' ? 'Reste visible jusqu’à fermeture' : `${Math.round(record.progress)}%`}</span>
      <span>{new Date(record.startedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  </article>
}

function ActionCentre({ records, onClose, onDismiss }: { records: ServiceDesignActionRecord[]; onClose: () => void; onDismiss: (id: string) => void }) {
  return <div data-service-design-overlay="true" className="fixed inset-0 z-[942] bg-slate-950/35 backdrop-blur-sm" onMouseDown={onClose}>
    <aside className="ml-auto h-full w-full max-w-[460px] overflow-y-auto border-l border-slate-700 bg-[#07142b] text-white shadow-2xl" onMouseDown={(event: any) => event.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#07142b]/95 px-5 py-5 backdrop-blur-xl">
        <div><p className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-300">Action Centre</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em]">Activité opérationnelle</h2><p className="mt-1 text-xs font-semibold text-slate-400">Progression, réussites et erreurs actionnables de cette session.</p></div>
        <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5"><X size={16} /></button>
      </header>
      <div className="space-y-3 p-5">
        {records.length ? records.map((record) => <article key={record.id} className="rounded-[22px] border border-white/10 bg-white/[.045] p-4">
          <div className="flex items-start gap-3"><div className={`mt-0.5 ${record.status === 'success' ? 'text-emerald-300' : record.status === 'error' ? 'text-rose-300' : 'text-cyan-300'}`}>{record.status === 'success' ? <CheckCircle2 size={17} /> : record.status === 'error' ? <AlertTriangle size={17} /> : <Loader2 size={17} className="animate-spin" />}</div><div className="min-w-0 flex-1"><h3 className="text-sm font-black">{record.title}</h3><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-300">{record.detail}</p>{record.instruction ? <p className="mt-2 text-[10px] font-bold leading-4 text-rose-200">À faire: {record.instruction}</p> : null}</div><button type="button" onClick={() => onDismiss(record.id)} className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 text-slate-400"><X size={13} /></button></div>
        </article>) : <div className="rounded-[26px] border border-dashed border-white/15 p-10 text-center"><RotateCcw className="mx-auto text-slate-600" size={28} /><p className="mt-3 text-sm font-black">Aucune action enregistrée</p><p className="mt-1 text-xs font-semibold text-slate-500">Les opérations de création, import, génération et publication apparaîtront ici.</p></div>}
      </div>
    </aside>
  </div>
}
