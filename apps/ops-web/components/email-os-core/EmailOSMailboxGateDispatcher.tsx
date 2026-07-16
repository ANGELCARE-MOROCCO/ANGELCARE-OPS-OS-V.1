"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, LockKeyhole, RefreshCw, Shield, ShieldAlert, ShieldCheck } from "lucide-react"

type MailboxSummary = {
  id: string
  assignmentId: string
  mailboxId: string
  mailboxEmail: string | null
  mailboxName: string | null
  mailbox_id: string
  mailbox?: {
    id: string
    name: string
    address: string
    status: string
    owner?: string | null
    provider?: string | null
  } | null
  role: string
  permissions: Record<string, boolean>
  pinConfigured?: boolean
  pinStatus?: string
  pin_status: string
  assignmentStatus?: string
  status: string
  failed_pin_attempts: number
  locked_until?: string | null
  assigned_by?: string | null
  assigned_at?: string | null
  sessionStatus?: string
  session_status: string
  session?: {
    id: string
    status: string
    unlocked_at?: string | null
    expires_at: string
    last_activity_at?: string | null
  } | null
  last_unlock_at?: string | null
  last_activity_at?: string | null
  row_state: string
  security_status: string
}

type LoadState = {
  summary: {
    assigned_mailboxes_count: number
    active_sessions_count: number
    locked_assignments_count: number
    last_activity_at?: string | null
    security_status: string
  }
  assignments: MailboxSummary[]
}

function clean(value: unknown) {
  return String(value ?? "").trim()
}

function shortDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(parsed)
}

function statusTone(value: string) {
  const text = clean(value).toLowerCase()
  if (text.includes("active") || text.includes("healthy") || text.includes("unlocked")) return "green"
  if (text.includes("locked") || text.includes("revoked") || text.includes("expired")) return "red"
  if (text.includes("needs")) return "amber"
  return "slate"
}

function pinTone(value: string) {
  const text = clean(value).toLowerCase()
  if (text === "active") return "green"
  if (text === "locked" || text === "revoked") return "red"
  if (text === "reset_required") return "amber"
  return "slate"
}

function sessionTone(value: string) {
  const text = clean(value).toLowerCase()
  if (text === "active") return "green"
  if (text === "expired") return "amber"
  if (text === "revoked") return "red"
  return "slate"
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json?.ok !== false, status: res.status, data: json?.data ?? json, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null) }
}

export default function EmailOSMailboxGateDispatcher() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<LoadState>({ summary: { assigned_mailboxes_count: 0, active_sessions_count: 0, locked_assignments_count: 0, last_activity_at: null, security_status: "Needs PIN" }, assignments: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxSummary | null>(null)
  const [pin, setPin] = useState("")
  const [busy, setBusy] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [pinLockedUntil, setPinLockedUntil] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const result = await api("/api/email-os/access/my-mailboxes")
    setLoading(false)
    if (!result.ok) {
      setError(result.error || "Failed to load mailbox gate.")
      return
    }
    setState(result.data || state)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const noAccess = state.assignments.length === 0
  const redirectReason = searchParams.get("reason")
  const securityTone = useMemo(() => {
    const text = clean(state.summary.security_status).toLowerCase()
    if (text.includes("healthy") || text.includes("ready") || text.includes("pin active")) return "green"
    if (text.includes("locked")) return "red"
    if (text.includes("needs")) return "amber"
    if (text.includes("revoked")) return "red"
    return "slate"
  }, [state.summary.security_status])

  async function unlockMailbox() {
    if (!selectedMailbox) return
    if (!/^\d{6}$/.test(pin)) {
      setUnlockError("PIN must contain exactly 6 digits.")
      return
    }

    setBusy(true)
    setUnlockError(null)
    const result = await api("/api/email-os/access/unlock", {
      method: "POST",
      body: JSON.stringify({ mailboxId: selectedMailbox.mailboxId, pin }),
    })
    setBusy(false)

    if (!result.ok) {
      setUnlockError(result.error || "Unlock failed")
      if (result.status === 423) {
        setPinLockedUntil(selectedMailbox?.locked_until || null)
      }
      return
    }

    setPin("")
    setSelectedMailbox(null)
    router.push(`/email-os/mailboxes/${encodeURIComponent(selectedMailbox.mailboxId)}`)
  }

  const openMailbox = (assignment: MailboxSummary) => {
    const sessionStatus = clean(assignment.sessionStatus || assignment.session_status).toLowerCase()
    const isUnlocked = sessionStatus === "active" && assignment.session?.expires_at && new Date(assignment.session.expires_at).getTime() > Date.now()
    if (isUnlocked) {
      router.push(`/email-os/mailboxes/${encodeURIComponent(assignment.mailboxId)}`)
      return
    }
    setSelectedMailbox(assignment)
    setPin("")
    setUnlockError(null)
    setPinLockedUntil(assignment.locked_until || null)
  }

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,.08)]">
          <div className="grid gap-6 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef2ff] px-6 py-6 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:px-8 lg:py-8">
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">AngelCare Email-OS</div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 lg:text-5xl">Mailbox Gate Dispatcher</h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 lg:text-base">
                Select one of your assigned production mailboxes, unlock it with the mailbox-specific PIN, and enter a mailbox-scoped workspace.
              </p>
            </div>
            <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="Assigned" value={String(state.summary.assigned_mailboxes_count)} tone="blue" />
                <Kpi label="Active sessions" value={String(state.summary.active_sessions_count)} tone={state.summary.active_sessions_count ? "green" : "slate"} />
                <Kpi label="Locked" value={String(state.summary.locked_assignments_count)} tone={state.summary.locked_assignments_count ? "amber" : "slate"} />
                <Kpi label="Security" value={state.summary.security_status} tone={securityTone} />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Last Email-OS activity</div>
                <div className="mt-2 text-sm font-black text-slate-950">{shortDate(state.summary.last_activity_at)}</div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>
        ) : null}

        {redirectReason ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-800">{redirectReason}</div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">Loading mailbox assignments…</div>
        ) : noAccess ? (
          <section className="grid gap-4 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white"><LockKeyhole className="h-5 w-5" /></div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">No Email-OS mailbox assigned</h2>
            <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-600">
              Your user profile does not currently have access to any Email-OS mailbox. Please contact an administrator.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white">Return to dashboard</Link>
              <button type="button" onClick={() => void load()} className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </button>
            </div>
          </section>
        ) : (
          <section className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {state.assignments.map((assignment) => {
                const isUnlocked = clean(assignment.sessionStatus || assignment.session_status).toLowerCase() === "active" && assignment.session?.expires_at && new Date(assignment.session.expires_at).getTime() > Date.now()
                return (
                  <article key={assignment.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{assignment.role}</div>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{assignment.mailboxName || assignment.mailbox?.name || assignment.mailboxId || assignment.mailbox_id}</h2>
                        <p className="mt-2 text-sm font-semibold text-slate-500">{assignment.mailboxEmail || assignment.mailbox?.address || '—'}</p>
                      </div>
                      <Badge label={assignment.row_state} tone={statusTone(assignment.row_state)} />
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge label={permissionSummary(assignment.permissions)} tone="blue" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-slate-600">
                        <Meta label="PIN" value={(assignment.pinStatus || assignment.pin_status).replaceAll('_', ' ')} tone={pinTone(assignment.pinStatus || assignment.pin_status)} />
                        <Meta label="Session" value={(assignment.sessionStatus || assignment.session_status).replaceAll('_', ' ')} tone={sessionTone(assignment.sessionStatus || assignment.session_status)} />
                        <Meta label="Last activity" value={shortDate(assignment.last_activity_at)} />
                        <Meta label="Failed attempts" value={String(assignment.failed_pin_attempts || 0)} />
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600">
                        {assignment.session?.expires_at ? <>Session expires {shortDate(assignment.session.expires_at)} after 4 hours of inactivity.</> : <>Unlock this mailbox with its dedicated 6-digit PIN.</>}
                      </div>
                      <button
                        type="button"
                        onClick={() => openMailbox(assignment)}
                        className={`inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-black ${isUnlocked ? "bg-emerald-600 text-white" : "bg-slate-950 text-white"}`}
                      >
                        {isUnlocked ? "Continue" : "Unlock mailbox"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {selectedMailbox ? (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">PIN Unlock</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{selectedMailbox.mailboxName || selectedMailbox.mailbox?.name || selectedMailbox.mailboxId || selectedMailbox.mailbox_id}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">{selectedMailbox.mailboxEmail || selectedMailbox.mailbox?.address || '—'}</p>
            </div>
            <div className="grid gap-4 px-6 py-6">
              {pinLockedUntil ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Mailbox PIN is temporarily locked. Please try again later or contact an administrator.
                </div>
              ) : null}
              {unlockError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{unlockError}</div> : null}
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">6-digit PIN</span>
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-lg font-black tracking-[0.35em] outline-none"
                  placeholder="••••••"
                />
              </label>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold leading-6 text-slate-600">
                Unlocking this mailbox creates a mailbox-scoped session for 4 hours of inactivity.
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5">
              <button type="button" onClick={() => { setSelectedMailbox(null); setPin(""); setUnlockError(null); setPinLockedUntil(null) }} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={() => void unlockMailbox()} disabled={busy} className="h-11 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white disabled:opacity-50">
                {busy ? "Unlocking…" : "Unlock mailbox"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Kpi({ label, value, tone = "slate" }: { label: string; value: string; tone?: "green" | "red" | "blue" | "purple" | "amber" | "slate" }) {
  const palette = chipPalette[tone]
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: palette.border, background: palette.soft, color: palette.color }}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</div>
      <div className="mt-1 text-lg font-black tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function Badge({ label, tone = "slate" }: { label: string; tone?: "green" | "red" | "blue" | "purple" | "amber" | "slate" }) {
  const palette = chipPalette[tone]
  return (
    <span className="inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]" style={{ border: `1px solid ${palette.border}`, background: palette.soft, color: palette.color }}>
      {label}
    </span>
  )
}

function Meta({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "blue" | "purple" | "amber" | "slate" }) {
  const palette = chipPalette[tone || "slate"]
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: palette.border, background: palette.soft }}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 font-black text-slate-950">{value}</div>
    </div>
  )
}

function permissionSummary(permissions: Record<string, boolean>) {
  const items = Object.entries(permissions).filter(([, value]) => Boolean(value)).map(([key]) => key.replace(/^can_/, "").replaceAll("_", " "))
  return items.length ? items.join(" · ") : "No permissions"
}

const chipPalette: Record<"green" | "red" | "blue" | "purple" | "amber" | "slate", { bg: string; soft: string; solid: string; color: string; border: string }> = {
  green: { bg: "#ecfdf5", soft: "#f0fdf4", solid: "#22c55e", color: "#047857", border: "#bbf7d0" },
  red: { bg: "#fef2f2", soft: "#fff5f5", solid: "#ef4444", color: "#b91c1c", border: "#fecaca" },
  blue: { bg: "#eff6ff", soft: "#f8fbff", solid: "#2563eb", color: "#1d4ed8", border: "#bfdbfe" },
  purple: { bg: "#f5f3ff", soft: "#fbfaff", solid: "#7c3aed", color: "#6d28d9", border: "#ddd6fe" },
  amber: { bg: "#fffbeb", soft: "#fffaf0", solid: "#f59e0b", color: "#b45309", border: "#fde68a" },
  slate: { bg: "#f8fafc", soft: "#ffffff", solid: "#64748b", color: "#475569", border: "#e2e8f0" },
}
