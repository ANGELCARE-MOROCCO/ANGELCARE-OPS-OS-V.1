"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"

type AppRoute = {
  label: string
  href: string
  module: string
  permissionKey: string
  shortLabel?: string
}

type PunchAction = "shift_in" | "shift_out" | "lunch_start" | "lunch_end"
type AttendanceStatus = "none" | "in" | "out" | "pause" | "back" | "error"
type SystemSignal = {
  label: string
  value: string
  tone: "green" | "amber" | "red" | "blue" | "slate"
  pulse?: boolean
}

type UserAlert = {
  id: string
  title: string
  body: string
  source: "HR" | "Memo" | "System" | "Connect"
  createdAt: string
  urgent?: boolean
}

const PUNCHES: {
  action: PunchAction
  label: string
  icon: string
  nextStatus: AttendanceStatus
}[] = [
  { action: "shift_in", label: "IN", icon: "●", nextStatus: "in" },
  { action: "shift_out", label: "OUT", icon: "■", nextStatus: "out" },
  { action: "lunch_start", label: "Pause", icon: "☕", nextStatus: "pause" },
  { action: "lunch_end", label: "Retour", icon: "↯", nextStatus: "back" },
]

const MODULE_ORDER = [
  "academy",
  "admin",
  "billing",
  "caregivers",
  "contracts",
  "families",
  "hr",
  "incidents",
  "leads",
  "locations",
  "market-os",
  "missions",
  "operations",
  "pointage",
  "print",
  "reports",
  "revenue-command-center",
  "sales",
  "services",
  "users",
  "voice-center",
  "dashboard",
  "profile",
]


function normalizeRoute(route: Partial<AppRoute> | null | undefined): AppRoute | null {
  if (!route || typeof route.href !== "string" || route.href.length === 0) return null

  const href = route.href
  const module = typeof route.module === "string" && route.module.length > 0
    ? route.module
    : href.split("/").filter(Boolean)[0] || "dashboard"

  const label = typeof route.label === "string" && route.label.length > 0
    ? route.label
    : moduleTitle(module)

  return {
    href,
    module,
    label,
    permissionKey:
      typeof route.permissionKey === "string" && route.permissionKey.length > 0
        ? route.permissionKey
        : `page:${href}`,
    shortLabel: typeof route.shortLabel === "string" ? route.shortLabel : undefined,
  }
}

function normalizeRoutes(routes: unknown): AppRoute[] {
  const rawRoutes = Array.isArray(routes) ? routes : []
  const normalized = rawRoutes
    .map((route) => normalizeRoute(route as Partial<AppRoute>))
    .filter((route): route is AppRoute => Boolean(route))

  const unique = new Map<string, AppRoute>()
  for (const route of normalized) {
    if (!unique.has(route.href)) unique.set(route.href, route)
  }

  return Array.from(unique.values()).sort((a, b) => a.href.localeCompare(b.href))
}

function moduleTitle(module: string) {
  const custom: Record<string, string> = {
    "market-os": "Market OS",
    "revenue-command-center": "Revenue Command",
    "voice-center": "Voice Center",
    academy: "Academy",
    admin: "Admin",
    billing: "Billing",
    caregivers: "Caregivers",
    contracts: "Contracts",
    families: "Families",
    hr: "HR",
    incidents: "Incidents",
    leads: "Leads",
    locations: "Locations",
    missions: "Missions",
    operations: "Operations",
    pointage: "Pointage",
    print: "Print",
    reports: "Reports",
    sales: "Sales",
    services: "Services",
    users: "Users",
    dashboard: "Dashboard",
    profile: "Profile",
  }

  return custom[module] || module.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRouteLabel(route: AppRoute) {
  return route.shortLabel || route.label || route.href
}

export default function OverheadPanel() {
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(true)
  const [status, setStatus] = useState<AttendanceStatus>("none")
  const [busy, setBusy] = useState<PunchAction | null>(null)
  const [terminalMessage, setTerminalMessage] = useState("SYSTEM READY • VOICE READY • CONNECT READY")
  const [voiceState, setVoiceState] = useState<"ready" | "incoming" | "offline">("ready")
  const [connectState, setConnectState] = useState<"online" | "message" | "offline">("online")
  const [pagesOpen, setPagesOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([])
  const [allowedRoutes, setAllowedRoutes] = useState<AppRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const appPagesRef = useRef<HTMLDivElement | null>(null)
  const alertsRef = useRef<HTMLDivElement | null>(null)

  const pushUserAlert = (alert: Omit<UserAlert, "id" | "createdAt"> & { createdAt?: string }) => {
    const nextAlert: UserAlert = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: alert.createdAt || new Date().toISOString(),
      title: alert.title,
      body: alert.body,
      source: alert.source,
      urgent: alert.urgent,
    }

    setUserAlerts((current) => [nextAlert, ...current].slice(0, 8))
  }

  useEffect(() => {
    setNow(new Date())
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine)

    const clock = window.setInterval(() => setNow(new Date()), 1000)

    const onOnline = () => {
      setOnline(true)
      setTerminalMessage("NETWORK ONLINE • OPS CHANNEL RESTORED")
    }

    const onOffline = () => {
      setOnline(false)
      setTerminalMessage("NETWORK OFFLINE • CHECK CONNECTION")
    }

    const onVoiceIncoming = () => {
      setVoiceState("incoming")
      setTerminalMessage("INCOMING VOICE CALL • ACTION REQUIRED")
      window.setTimeout(() => setVoiceState("ready"), 15000)
    }

    const onConnectMessage = () => {
      setConnectState("message")
      setTerminalMessage("ANGELCARE CONNECT • NEW MESSAGE RECEIVED")
      pushUserAlert({
        source: "Connect",
        title: "New Connect message",
        body: "A new AngelCare Connect message was received.",
      })
      window.setTimeout(() => setConnectState("online"), 15000)
    }

    const onHRMessage = (event: Event) => {
      const detail = (event as CustomEvent<Partial<UserAlert>>).detail || {}

      pushUserAlert({
        source: detail.source || "HR",
        title: detail.title || "New HR memo",
        body: detail.body || "A new memo or profile message was pushed to your workspace.",
        urgent: detail.urgent ?? true,
      })

      setTerminalMessage("HR ALERT • NEW USER-SPECIFIC MEMO RECEIVED")
      setConnectState("message")
      window.setTimeout(() => setConnectState("online"), 15000)
    }

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    window.addEventListener("angelcare:voice-incoming", onVoiceIncoming)
    window.addEventListener("angelcare:connect-message", onConnectMessage)
    window.addEventListener("angelcare:hr-message", onHRMessage)

    return () => {
      window.clearInterval(clock)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("angelcare:voice-incoming", onVoiceIncoming)
      window.removeEventListener("angelcare:connect-message", onConnectMessage)
      window.removeEventListener("angelcare:hr-message", onHRMessage)
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadAllowedRoutes() {
      try {
        setRoutesLoading(true)
        const response = await fetch("/api/app-routes/allowed", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Allowed routes endpoint unavailable")
        }

        const payload = await response.json()
        const routes = normalizeRoutes(payload?.routes)

        if (alive) {
          setAllowedRoutes(routes)
        }
      } catch {
        if (alive) {
          setAllowedRoutes([])
          setTerminalMessage("PAGE ACCESS CHECK FAILED • ROUTES LOCKED")
        }
      } finally {
        if (alive) {
          setRoutesLoading(false)
        }
      }
    }

    loadAllowedRoutes()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!pagesOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!appPagesRef.current) return
      if (!appPagesRef.current.contains(event.target as Node)) setPagesOpen(false)
    }

    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [pagesOpen])

  useEffect(() => {
    if (!alertsOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!alertsRef.current) return
      if (!alertsRef.current.contains(event.target as Node)) setAlertsOpen(false)
    }

    window.addEventListener("mousedown", onPointerDown)
    return () => window.removeEventListener("mousedown", onPointerDown)
  }, [alertsOpen])

  const time = useMemo(
    () =>
      now
        ? now.toLocaleTimeString("fr-FR", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "--:--:--",
    [now]
  )

  const date = useMemo(
    () =>
      now
        ? now.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          })
        : "--- --/--",
    [now]
  )

  const signals: SystemSignal[] = [
    {
      label: "DB",
      value: online ? "Ready" : "Offline",
      tone: online ? "green" : "red",
      pulse: online,
    },
    {
      label: "Voice",
      value: voiceState === "incoming" ? "Incoming" : voiceState === "ready" ? "Ready" : "Off",
      tone: voiceState === "incoming" ? "amber" : voiceState === "ready" ? "green" : "red",
      pulse: voiceState === "incoming",
    },
    {
      label: "Connect",
      value: connectState === "message" ? "Message" : connectState === "online" ? "Online" : "Off",
      tone: connectState === "message" ? "amber" : connectState === "online" ? "green" : "red",
      pulse: connectState === "message",
    },
    { label: "Ops", value: "Live", tone: "blue", pulse: true },
  ]

  const groupedRoutes = useMemo(() => {
    const groups = allowedRoutes.reduce<Record<string, AppRoute[]>>((acc, route) => {
      if (!acc[route.module]) acc[route.module] = []
      acc[route.module].push(route)
      return acc
    }, {})

    return Object.entries(groups).sort(([a], [b]) => {
      const ai = MODULE_ORDER.indexOf(a)
      const bi = MODULE_ORDER.indexOf(b)

      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [allowedRoutes])

  const routesCount = allowedRoutes.length
  const urgentAlertsCount = userAlerts.filter((alert) => alert.urgent).length
  const hasUserAlerts = userAlerts.length > 0

  async function punch(action: PunchAction, nextStatus: AttendanceStatus) {
    try {
      setBusy(action)
      setTerminalMessage(`HR ACTION • ${action.toUpperCase()} SENDING...`)

      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) throw new Error("Punch failed")

      setStatus(nextStatus)
      setTerminalMessage(`HR ACTION CONFIRMED • ${action.toUpperCase()}`)
    } catch {
      setStatus("error")
      setTerminalMessage("HR ACTION ERROR • CHECK API OR SESSION")
    } finally {
      setBusy(null)
    }
  }

  const statusText =
    status === "in"
      ? "En service"
      : status === "out"
        ? "Shift terminé"
        : status === "pause"
          ? "Pause"
          : status === "back"
            ? "Retour poste"
            : status === "error"
              ? "Erreur"
              : "Non pointé"

  return (
    <>
      <style jsx global>{`
        @keyframes angelcare-radio-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: .35; transform: scale(1.42); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes angelcare-terminal-scan {
          0% { transform: translateY(-16px); opacity: 0; }
          20% { opacity: .7; }
          100% { transform: translateY(72px); opacity: 0; }
        }

        @keyframes angelcare-terminal-flicker {
          0%, 100% { opacity: 1; }
          45% { opacity: .86; }
          55% { opacity: .96; }
          75% { opacity: .78; }
        }
      `}</style>

      <div style={panelStyle}>
      <div style={systemZoneStyle}>
        {signals.map((signal) => (
          <div key={signal.label} style={signalChipStyle(signal.tone)}>
            <span style={signalDotStyle(signal.tone, signal.pulse)} />
            <span style={signalLabelStyle}>{signal.label}</span>
            <strong>{signal.value}</strong>
          </div>
        ))}
      </div>

      <div style={terminalZoneStyle}>
        <div style={scanLineStyle} />
        <div style={terminalHeaderStyle}>ANGELCARE OPS TERMINAL</div>
        <div style={terminalDisplayStyle}>{terminalMessage}</div>
      </div>

      <div style={attendanceZoneStyle}>
        <div style={timeBlockStyle}>
          <div style={dateStyle}>{date}</div>
          <div style={timeStyle}>{time}</div>
        </div>

        <div style={statusPillStyle(status)}>{statusText}</div>

        <div style={punchGridStyle}>
          {PUNCHES.map((item) => (
            <button
              key={item.action}
              type="button"
              disabled={busy !== null}
              onClick={() => punch(item.action, item.nextStatus)}
              style={punchButtonStyle(item.nextStatus, busy === item.action)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={userZoneStyle}>
        <div ref={appPagesRef} style={appPagesDropdownStyle}>
          <button
            type="button"
            onClick={() => setPagesOpen((value) => !value)}
            style={appPagesButtonStyle(pagesOpen)}
            aria-expanded={pagesOpen}
            aria-haspopup="menu"
          >
            <span>▦ Pages</span>
            <small>{routesLoading ? "..." : routesCount}</small>
          </button>

          {pagesOpen && (
            <div style={appPagesMenuStyle}>
              <div style={appPagesMenuHeaderStyle}>
                <strong>Allowed app pages</strong>
                <span>{routesLoading ? "Loading..." : `${routesCount} authorized routes`}</span>
              </div>

              {routesCount === 0 && !routesLoading ? (
                <div style={emptyStateStyle}>
                  No pages assigned or route access failed. Ask an administrator to grant page access in Users → Edit user.
                </div>
              ) : (
                <div style={appPagesGroupsStyle}>
                  {groupedRoutes.map(([module, routes]) => (
                    <section key={module} style={appPagesGroupStyle}>
                      <div style={appPagesGroupHeaderStyle}>
                        <span>{moduleTitle(module)}</span>
                        <small>{routes.length}</small>
                      </div>

                      <div style={appPagesLinksGridStyle}>
                        {routes.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setPagesOpen(false)}
                            style={appPagesLinkStyle}
                            title={route.permissionKey}
                          >
                            <span>{getRouteLabel(route)}</span>
                            <small>{route.href}</small>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <div style={appPagesFooterStyle}>
                Permission-filtered registry • Users only see assigned pages
              </div>
            </div>
          )}
        </div>

        <Link href="/profile" style={userButtonStyle}>👤 Profile</Link>
        <Link href="/revenue-command-center/tasks" style={iconActionStyle}>✅</Link>

        <div ref={alertsRef} style={alertsDropdownStyle}>
          <button
            type="button"
            onClick={() => setAlertsOpen((value) => !value)}
            style={alertButtonStyle(hasUserAlerts, alertsOpen)}
            aria-expanded={alertsOpen}
            aria-haspopup="menu"
            title="User alerts, HR memos and operational notifications"
          >
            🔔
            {hasUserAlerts ? <span style={alertDotStyle} /> : null}
            {hasUserAlerts ? <small style={alertCountStyle}>{userAlerts.length}</small> : null}
          </button>

          {alertsOpen ? (
            <div style={alertsMenuStyle}>
              <div style={alertsHeaderStyle}>
                <div>
                  <strong>Personal command alerts</strong>
                  <span>HR memos • messages • operational pushes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUserAlerts([])}
                  style={clearAlertsButtonStyle}
                >
                  Clear
                </button>
              </div>

              {hasUserAlerts ? (
                <div style={alertsListStyle}>
                  {userAlerts.map((alert) => (
                    <div key={alert.id} style={alertCardStyle(alert.urgent)}>
                      <div style={alertCardTopStyle}>
                        <span style={alertSourceStyle(alert.source)}>{alert.source}</span>
                        <small>{new Date(alert.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</small>
                      </div>
                      <strong>{alert.title}</strong>
                      <p>{alert.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={emptyAlertsStyle}>
                  No personal memo is currently pending. HR/user-profile pushes will appear here with the red radio signal.
                </div>
              )}

              <div style={alertsFooterStyle}>
                <span>{urgentAlertsCount} urgent</span>
                <Link href="/incidents" onClick={() => setAlertsOpen(false)} style={alertsFooterLinkStyle}>
                  Open incidents
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <Link href="/reports" style={iconActionStyle}>📊</Link>
      </div>
    </div>
    </>
  )
}

const toneColor = (tone: SystemSignal["tone"]) =>
  tone === "green"
    ? "#22c55e"
    : tone === "amber"
      ? "#f59e0b"
      : tone === "red"
        ? "#ef4444"
        : tone === "blue"
          ? "#38bdf8"
          : "#94a3b8"

const panelStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: 86,
  zIndex: 2000,
  display: "grid",
  gridTemplateColumns: ".95fr 1.12fr 1.24fr auto",
  gap: 8,
  alignItems: "center",
  padding: "9px 10px",
  background: "linear-gradient(90deg,#020617 0%,#07111f 42%,#0f172a 100%)",
  borderBottom: "1px solid rgba(148,163,184,.22)",
  boxShadow: "0 18px 45px rgba(2,6,23,.30)",
  color: "#fff",
}

const systemZoneStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
}

const signalChipStyle = (tone: SystemSignal["tone"]): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 11,
  padding: "7px 8px",
  background: `${toneColor(tone)}18`,
  border: `1px solid ${toneColor(tone)}38`,
  color: "#e5eefc",
  fontSize: 10.5,
  fontWeight: 850,
})

const signalDotStyle = (tone: SystemSignal["tone"], pulse?: boolean): CSSProperties => ({
  width: 7,
  height: 7,
  borderRadius: 999,
  background: toneColor(tone),
  boxShadow: pulse ? `0 0 14px ${toneColor(tone)}` : "none",
})

const signalLabelStyle: CSSProperties = {
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.6,
  fontSize: 9.5,
}

const terminalZoneStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 15,
  border: "1px solid rgba(34,197,94,.42)",
  background:
    "radial-gradient(circle at 10% 20%, rgba(34,197,94,.13), transparent 30%), linear-gradient(180deg,#05140c,#06110b)",
  boxShadow: "inset 0 0 26px rgba(34,197,94,.16), 0 0 26px rgba(34,197,94,.13)",
  padding: "8px 10px",
  minWidth: 0,
}

const terminalHeaderStyle: CSSProperties = {
  fontSize: 9.5,
  color: "#86efac",
  letterSpacing: 1.1,
  fontWeight: 950,
  marginBottom: 5,
}

const terminalDisplayStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12.5,
  color: "#bbf7d0",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textShadow: "0 0 11px rgba(34,197,94,.68)",
  animation: "angelcare-terminal-flicker 3.4s infinite",
}

const attendanceZoneStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto auto 1fr",
  alignItems: "center",
  gap: 8,
  borderRadius: 17,
  padding: "7px 8px",
  background: "rgba(15,23,42,.72)",
  border: "1px solid rgba(148,163,184,.20)",
}

const timeBlockStyle: CSSProperties = { minWidth: 84 }

const dateStyle: CSSProperties = {
  fontSize: 9.5,
  color: "#94a3b8",
  fontWeight: 900,
  textTransform: "uppercase",
}

const timeStyle: CSSProperties = {
  fontSize: 21,
  lineHeight: 1,
  color: "#fff",
  fontWeight: 950,
  letterSpacing: 0.4,
}

const statusPillStyle = (status: AttendanceStatus): CSSProperties => ({
  borderRadius: 999,
  padding: "7px 8px",
  background:
    status === "in" || status === "back"
      ? "rgba(34,197,94,.16)"
      : status === "pause"
        ? "rgba(245,158,11,.16)"
        : status === "error"
          ? "rgba(239,68,68,.16)"
          : "rgba(148,163,184,.16)",
  color:
    status === "in" || status === "back"
      ? "#86efac"
      : status === "pause"
        ? "#fde68a"
        : status === "error"
          ? "#fecaca"
          : "#cbd5e1",
  fontSize: 10.5,
  fontWeight: 950,
  whiteSpace: "nowrap",
})

const punchGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(48px, 1fr))",
  gap: 5,
}

const punchButtonStyle = (status: AttendanceStatus, active: boolean): CSSProperties => ({
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 11,
  padding: "7px 6px",
  background: active
    ? "#ffffff"
    : status === "in" || status === "back"
      ? "rgba(34,197,94,.18)"
      : status === "pause"
        ? "rgba(245,158,11,.18)"
        : "rgba(239,68,68,.16)",
  color: active ? "#020617" : "#fff",
  fontWeight: 950,
  fontSize: 10.5,
  cursor: active ? "wait" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
})

const userZoneStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
  position: "relative",
  minWidth: 0,
}

const appPagesDropdownStyle: CSSProperties = { position: "relative" }

const appPagesButtonStyle = (open: boolean): CSSProperties => ({
  height: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "0 10px",
  borderRadius: 14,
  border: open ? "1px solid rgba(56,189,248,.70)" : "1px solid rgba(255,255,255,.14)",
  background: open ? "rgba(56,189,248,.18)" : "rgba(255,255,255,.08)",
  color: "#e0f2fe",
  fontWeight: 950,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: open ? "0 0 22px rgba(56,189,248,.22)" : "none",
})

const appPagesMenuStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 0,
  width: "min(860px, calc(100vw - 22px))",
  maxHeight: "calc(100vh - 112px)",
  overflowY: "auto",
  borderRadius: 22,
  background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
  border: "1px solid rgba(148,163,184,.35)",
  boxShadow: "0 28px 80px rgba(2,6,23,.42)",
  color: "#0f172a",
  zIndex: 5000,
  padding: 14,
}

const appPagesMenuHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "6px 6px 12px",
  borderBottom: "1px solid rgba(148,163,184,.26)",
  marginBottom: 12,
}

const appPagesGroupsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
}

const appPagesGroupStyle: CSSProperties = {
  borderRadius: 17,
  background: "#fff",
  border: "1px solid rgba(148,163,184,.22)",
  padding: 10,
}

const appPagesGroupHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 8,
}

const appPagesLinksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 7,
}

const appPagesLinkStyle: CSSProperties = {
  display: "grid",
  gap: 3,
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg,#f8fafc,#eef2ff)",
  border: "1px solid rgba(148,163,184,.20)",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 900,
  minWidth: 0,
}

const appPagesFooterStyle: CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid rgba(148,163,184,.24)",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
}

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 16,
  background: "#fff",
  border: "1px dashed rgba(148,163,184,.65)",
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.6,
}

const userButtonStyle: CSSProperties = {
  height: 40,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "0 10px",
  borderRadius: 14,
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 12,
}

const iconActionStyle: CSSProperties = {
  position: "relative",
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,.08)",
  border: "1px solid rgba(255,255,255,.14)",
  textDecoration: "none",
}

const scanLineStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 18,
  background: "linear-gradient(180deg, rgba(34,197,94,0), rgba(34,197,94,.22), rgba(34,197,94,0))",
  animation: "angelcare-terminal-scan 2.6s linear infinite",
  pointerEvents: "none",
}

const alertsDropdownStyle: CSSProperties = {
  position: "relative",
}

const alertButtonStyle = (hasAlerts: boolean, open: boolean): CSSProperties => ({
  position: "relative",
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: open
    ? "rgba(239,68,68,.20)"
    : hasAlerts
      ? "rgba(239,68,68,.14)"
      : "rgba(255,255,255,.08)",
  border: open
    ? "1px solid rgba(248,113,113,.72)"
    : hasAlerts
      ? "1px solid rgba(248,113,113,.45)"
      : "1px solid rgba(255,255,255,.14)",
  color: "#fff",
  cursor: "pointer",
  boxShadow: hasAlerts ? "0 0 24px rgba(239,68,68,.24)" : "none",
})

const alertDotStyle: CSSProperties = {
  position: "absolute",
  top: 5,
  right: 5,
  width: 9,
  height: 9,
  borderRadius: 999,
  background: "#ef4444",
  boxShadow: "0 0 12px #ef4444, 0 0 24px rgba(239,68,68,.45)",
  animation: "angelcare-radio-pulse 1s infinite",
  border: "1px solid rgba(255,255,255,.88)",
}

const alertCountStyle: CSSProperties = {
  position: "absolute",
  bottom: -4,
  right: -4,
  minWidth: 17,
  height: 17,
  padding: "0 5px",
  borderRadius: 999,
  background: "#ef4444",
  color: "#fff",
  border: "2px solid #020617",
  fontSize: 9,
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
}

const alertsMenuStyle: CSSProperties = {
  position: "absolute",
  top: 48,
  right: 0,
  width: 390,
  maxHeight: "calc(100vh - 112px)",
  overflowY: "auto",
  borderRadius: 22,
  background: "linear-gradient(180deg,#0f172a,#020617)",
  border: "1px solid rgba(248,113,113,.28)",
  boxShadow: "0 28px 80px rgba(2,6,23,.55), 0 0 34px rgba(239,68,68,.16)",
  color: "#e5eefc",
  zIndex: 5200,
  padding: 14,
}

const alertsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 12,
  borderBottom: "1px solid rgba(148,163,184,.18)",
  marginBottom: 12,
}

const clearAlertsButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 999,
  background: "rgba(255,255,255,.08)",
  color: "#cbd5e1",
  padding: "7px 10px",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
}

const alertsListStyle: CSSProperties = {
  display: "grid",
  gap: 9,
}

const alertCardStyle = (urgent?: boolean): CSSProperties => ({
  display: "grid",
  gap: 6,
  borderRadius: 16,
  padding: 11,
  background: urgent ? "rgba(239,68,68,.12)" : "rgba(255,255,255,.06)",
  border: urgent ? "1px solid rgba(248,113,113,.32)" : "1px solid rgba(255,255,255,.10)",
})

const alertCardTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "#94a3b8",
  fontSize: 10,
  fontWeight: 850,
}

const alertSourceStyle = (source: UserAlert["source"]): CSSProperties => ({
  padding: "3px 7px",
  borderRadius: 999,
  background:
    source === "HR"
      ? "rgba(239,68,68,.18)"
      : source === "Connect"
        ? "rgba(245,158,11,.18)"
        : "rgba(56,189,248,.16)",
  color:
    source === "HR"
      ? "#fecaca"
      : source === "Connect"
        ? "#fde68a"
        : "#bae6fd",
  fontSize: 9,
  fontWeight: 950,
  letterSpacing: .5,
})

const emptyAlertsStyle: CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,255,255,.06)",
  border: "1px dashed rgba(148,163,184,.28)",
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.6,
}

const alertsFooterStyle: CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid rgba(148,163,184,.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 850,
}

const alertsFooterLinkStyle: CSSProperties = {
  color: "#bfdbfe",
  textDecoration: "none",
  fontWeight: 950,
}