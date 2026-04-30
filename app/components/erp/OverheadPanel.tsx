'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type PunchAction = 'shift_in' | 'shift_out' | 'lunch_start' | 'lunch_end'
type AttendanceStatus = 'none' | 'in' | 'out' | 'pause' | 'back' | 'error'
type SystemSignal = { label: string; value: string; tone: 'green' | 'amber' | 'red' | 'blue' | 'slate'; pulse?: boolean }

const PUNCHES: { action: PunchAction; label: string; icon: string; nextStatus: AttendanceStatus }[] = [
  { action: 'shift_in', label: 'IN', icon: '●', nextStatus: 'in' },
  { action: 'shift_out', label: 'OUT', icon: '■', nextStatus: 'out' },
  { action: 'lunch_start', label: 'Pause', icon: '☕', nextStatus: 'pause' },
  { action: 'lunch_end', label: 'Retour', icon: '↯', nextStatus: 'back' },
]

export default function OverheadPanel() {
  // IMPORTANT: keep initial render identical on server/client to avoid hydration mismatch.
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(true)
  const [status, setStatus] = useState<AttendanceStatus>('none')
  const [busy, setBusy] = useState<PunchAction | null>(null)
  const [terminalMessage, setTerminalMessage] = useState('SYSTEM READY • VOICE READY • CONNECT READY')
  const [voiceState, setVoiceState] = useState<'ready' | 'incoming' | 'offline'>('ready')
  const [connectState, setConnectState] = useState<'online' | 'message' | 'offline'>('online')

  useEffect(() => {
    setNow(new Date())
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
    const clock = window.setInterval(() => setNow(new Date()), 1000)

    const onOnline = () => { setOnline(true); setTerminalMessage('NETWORK ONLINE • OPS CHANNEL RESTORED') }
    const onOffline = () => { setOnline(false); setTerminalMessage('NETWORK OFFLINE • CHECK CONNECTION') }
    const onVoiceIncoming = () => { setVoiceState('incoming'); setTerminalMessage('INCOMING VOICE CALL • ACTION REQUIRED'); window.setTimeout(() => setVoiceState('ready'), 15000) }
    const onConnectMessage = () => { setConnectState('message'); setTerminalMessage('ANGELCARE CONNECT • NEW MESSAGE RECEIVED'); window.setTimeout(() => setConnectState('online'), 15000) }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('angelcare:voice-incoming', onVoiceIncoming)
    window.addEventListener('angelcare:connect-message', onConnectMessage)

    return () => {
      window.clearInterval(clock)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('angelcare:voice-incoming', onVoiceIncoming)
      window.removeEventListener('angelcare:connect-message', onConnectMessage)
    }
  }, [])

  const time = useMemo(
    () => now ? now.toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--',
    [now]
  )
  const date = useMemo(
    () => now ? now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '--- --/--',
    [now]
  )

  const signals: SystemSignal[] = [
    { label: 'DB', value: online ? 'Ready' : 'Offline', tone: online ? 'green' : 'red', pulse: online },
    { label: 'Voice', value: voiceState === 'incoming' ? 'Incoming' : voiceState === 'ready' ? 'Ready' : 'Off', tone: voiceState === 'incoming' ? 'amber' : voiceState === 'ready' ? 'green' : 'red', pulse: voiceState === 'incoming' },
    { label: 'Connect', value: connectState === 'message' ? 'Message' : connectState === 'online' ? 'Online' : 'Off', tone: connectState === 'message' ? 'amber' : connectState === 'online' ? 'green' : 'red', pulse: connectState === 'message' },
    { label: 'Ops', value: 'Live', tone: 'blue', pulse: true },
  ]

  async function punch(action: PunchAction, nextStatus: AttendanceStatus) {
    try {
      setBusy(action)
      setTerminalMessage(`HR ACTION • ${action.toUpperCase()} SENDING...`)
      const res = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Punch failed')
      setStatus(nextStatus)
      setTerminalMessage(`HR ACTION CONFIRMED • ${action.toUpperCase()}`)
    } catch {
      setStatus('error')
      setTerminalMessage('HR ACTION ERROR • CHECK API OR SESSION')
    } finally {
      setBusy(null)
    }
  }

  const statusText = status === 'in' ? 'En service' : status === 'out' ? 'Shift terminé' : status === 'pause' ? 'Pause' : status === 'back' ? 'Retour poste' : status === 'error' ? 'Erreur' : 'Non pointé'

  return (
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
            <button key={item.action} type="button" disabled={busy !== null} onClick={() => punch(item.action, item.nextStatus)} style={punchButtonStyle(item.nextStatus, busy === item.action)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={userZoneStyle}>
        <Link href="/profile" style={userButtonStyle}>👤 Profile</Link>
        <Link href="/revenue-command-center/tasks" style={iconActionStyle}>✅</Link>
        <Link href="/incidents" style={iconActionStyle}>🔔</Link>
        <Link href="/reports" style={iconActionStyle}>📊</Link>
      </div>
    </div>
  )
}

const toneColor = (tone: SystemSignal['tone']) => tone === 'green' ? '#22c55e' : tone === 'amber' ? '#f59e0b' : tone === 'red' ? '#ef4444' : tone === 'blue' ? '#38bdf8' : '#94a3b8'

const panelStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, height: 86, zIndex: 2000, display: 'grid', gridTemplateColumns: '1.15fr 1.35fr 1.45fr auto', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'linear-gradient(90deg,#020617 0%,#07111f 42%,#0f172a 100%)', borderBottom: '1px solid rgba(148,163,184,.22)', boxShadow: '0 18px 45px rgba(2,6,23,.30)', color: '#fff' }
const systemZoneStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 7 }
const signalChipStyle = (tone: SystemSignal['tone']): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 7, borderRadius: 12, padding: '8px 9px', background: `${toneColor(tone)}18`, border: `1px solid ${toneColor(tone)}38`, color: '#e5eefc', fontSize: 11, fontWeight: 850 })
const signalDotStyle = (tone: SystemSignal['tone'], pulse?: boolean): React.CSSProperties => ({ width: 8, height: 8, borderRadius: 999, background: toneColor(tone), boxShadow: pulse ? `0 0 14px ${toneColor(tone)}` : 'none' })
const signalLabelStyle: React.CSSProperties = { color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .6, fontSize: 10 }
const terminalZoneStyle: React.CSSProperties = { borderRadius: 16, border: '1px solid rgba(34,197,94,.32)', background: 'linear-gradient(180deg,#05140c,#06110b)', boxShadow: 'inset 0 0 22px rgba(34,197,94,.10), 0 0 22px rgba(34,197,94,.10)', padding: '9px 12px', minWidth: 0 }
const terminalHeaderStyle: React.CSSProperties = { fontSize: 10, color: '#86efac', letterSpacing: 1.2, fontWeight: 950, marginBottom: 5 }
const terminalDisplayStyle: React.CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, color: '#bbf7d0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 0 8px rgba(34,197,94,.45)' }
const attendanceZoneStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto auto 1fr', alignItems: 'center', gap: 10, borderRadius: 18, padding: '8px 10px', background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.20)' }
const timeBlockStyle: React.CSSProperties = { minWidth: 94 }
const dateStyle: React.CSSProperties = { fontSize: 10, color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }
const timeStyle: React.CSSProperties = { fontSize: 24, lineHeight: 1, color: '#fff', fontWeight: 950, letterSpacing: .5 }
const statusPillStyle = (status: AttendanceStatus): React.CSSProperties => ({ borderRadius: 999, padding: '8px 10px', background: status === 'in' || status === 'back' ? 'rgba(34,197,94,.16)' : status === 'pause' ? 'rgba(245,158,11,.16)' : status === 'error' ? 'rgba(239,68,68,.16)' : 'rgba(148,163,184,.16)', color: status === 'in' || status === 'back' ? '#86efac' : status === 'pause' ? '#fde68a' : status === 'error' ? '#fecaca' : '#cbd5e1', fontSize: 11, fontWeight: 950, whiteSpace: 'nowrap' })
const punchGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(54px, 1fr))', gap: 6 }
const punchButtonStyle = (status: AttendanceStatus, active: boolean): React.CSSProperties => ({ border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '8px 7px', background: active ? '#ffffff' : status === 'in' || status === 'back' ? 'rgba(34,197,94,.18)' : status === 'pause' ? 'rgba(245,158,11,.18)' : 'rgba(239,68,68,.16)', color: active ? '#020617' : '#fff', fontWeight: 950, fontSize: 11, cursor: active ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 })
const userZoneStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }
const userButtonStyle: React.CSSProperties = { height: 40, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '0 12px', borderRadius: 14, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950, fontSize: 12 }
const iconActionStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)', textDecoration: 'none' }
