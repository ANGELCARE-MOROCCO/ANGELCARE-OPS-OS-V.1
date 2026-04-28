'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'in' | 'out' | 'lunch' | 'back'
type PunchAction = 'shift_in' | 'shift_out' | 'lunch_start' | 'lunch_end'

const STATUS_CONFIG: Record<Status, { label: string; dot: string; color: string; action?: PunchAction }> = {
  idle: { label: 'Non pointé', dot: '⚪', color: '#94a3b8' },
  in: { label: 'En service', dot: '🟢', color: '#22c55e', action: 'shift_in' },
  out: { label: 'Shift terminé', dot: '🔴', color: '#ef4444', action: 'shift_out' },
  lunch: { label: 'Pause déjeuner', dot: '🍽️', color: '#f59e0b', action: 'lunch_start' },
  back: { label: 'Retour au poste', dot: '⚡', color: '#3b82f6', action: 'lunch_end' },
}

export default function HRTimeClockWidget() {
  const [time, setTime] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [collapsed, setCollapsed] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 90 })
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('Local + DB ready')

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('fr-FR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging) return

      const width = collapsed ? 230 : 390
      const height = collapsed ? 72 : 180

      setPosition({
        x: Math.min(Math.max(e.clientX - offset.x, 10), window.innerWidth - width),
        y: Math.min(Math.max(e.clientY - offset.y, 10), window.innerHeight - height),
      })
    }

    const stop = () => setDragging(false)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
    }
  }, [dragging, offset, collapsed])

  const config = STATUS_CONFIG[status]

  function startDrag(e: React.MouseEvent<HTMLDivElement>) {
    setDragging(true)
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  async function punch(nextStatus: Status) {
    const action = STATUS_CONFIG[nextStatus].action
    setStatus(nextStatus)

    if (!action) return

    try {
      setSaving(true)
      setMessage('Saving...')

      const response = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error('Punch save failed')
      setMessage('Saved to HR logs')
    } catch (error) {
      console.warn('Attendance punch warning:', error)
      setMessage('Local only - DB failed')
    } finally {
      setSaving(false)
    }
  }

  if (collapsed) {
    return (
      <div style={{ ...collapsedStyle, left: position.x, top: position.y, borderColor: config.color, boxShadow: `0 22px 55px ${config.color}33` }}>
        <div onMouseDown={startDrag} style={dragHandleStyle}>
          <strong>{config.dot} HR</strong>
          <span style={miniTimeStyle}>{time}</span>
          <small style={{ color: config.color }}>{config.label}</small>
        </div>

        <button onClick={() => setCollapsed(false)} style={miniButtonStyle}>⤢</button>
      </div>
    )
  }

  return (
    <div style={{ ...panelStyle, left: position.x, top: position.y, borderColor: config.color, boxShadow: `0 26px 70px ${config.color}26` }}>
      <div onMouseDown={startDrag} style={headerStyle}>
        <div>
          <div style={labelStyle}>HR Live Attendance</div>
          <div style={timeStyle}>{time}</div>
        </div>

        <div style={{ ...statusPillStyle, background: `${config.color}24` }}>
          <span style={{ ...pulseStyle, background: config.color }} />
          {config.label}
        </div>

        <button onClick={() => setCollapsed(true)} style={collapseButtonStyle}>—</button>
      </div>

      <div style={buttonGridStyle}>
        <ActionButton label="IN" icon="🟢" active={status === 'in'} color="#22c55e" disabled={saving} onClick={() => punch('in')} />
        <ActionButton label="OUT" icon="🔴" active={status === 'out'} color="#ef4444" disabled={saving} onClick={() => punch('out')} />
        <ActionButton label="Pause" icon="🍽️" active={status === 'lunch'} color="#f59e0b" disabled={saving} onClick={() => punch('lunch')} />
        <ActionButton label="Retour" icon="⚡" active={status === 'back'} color="#3b82f6" disabled={saving} onClick={() => punch('back')} />
      </div>

      <div style={footerStyle}>{message}</div>
    </div>
  )
}

function ActionButton({
  label,
  icon,
  active,
  color,
  disabled,
  onClick,
}: {
  label: string
  icon: string
  active: boolean
  color: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...actionButtonStyle,
        opacity: disabled ? 0.7 : 1,
        background: active ? `${color}33` : 'rgba(255,255,255,.08)',
        borderColor: active ? color : 'rgba(255,255,255,.12)',
        transform: active ? 'translateY(-2px)' : 'none',
        boxShadow: active ? `0 0 24px ${color}55` : 'none',
      }}
    >
      <span>{icon}</span>
      <strong>{label}</strong>
    </button>
  )
}

const panelStyle: React.CSSProperties = { position: 'fixed', width: 390, zIndex: 80, borderRadius: 24, padding: 14, background: 'linear-gradient(135deg,#020617,#0f172a 58%,#1e3a8a)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' }
const collapsedStyle: React.CSSProperties = { position: 'fixed', width: 230, zIndex: 80, borderRadius: 999, padding: '10px 12px', background: 'linear-gradient(135deg,#020617,#0f172a)', color: '#fff', border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const dragHandleStyle: React.CSSProperties = { cursor: 'grab', display: 'grid', gap: 2 }
const headerStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 10, cursor: 'grab', marginBottom: 12 }
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 950, color: '#bfdbfe', textTransform: 'uppercase', letterSpacing: '.08em' }
const timeStyle: React.CSSProperties = { fontSize: 30, fontWeight: 950, letterSpacing: '.04em', fontVariantNumeric: 'tabular-nums' }
const miniTimeStyle: React.CSSProperties = { fontSize: 17, fontWeight: 950, fontVariantNumeric: 'tabular-nums' }
const statusPillStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 999, fontSize: 12, fontWeight: 950, color: '#fff' }
const pulseStyle: React.CSSProperties = { width: 9, height: 9, borderRadius: 999, boxShadow: '0 0 18px currentColor' }
const buttonGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }
const actionButtonStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, padding: '11px 8px', color: '#fff', cursor: 'pointer', display: 'grid', gap: 5, placeItems: 'center', fontSize: 12, transition: 'all .18s ease' }
const collapseButtonStyle: React.CSSProperties = { width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', fontWeight: 950 }
const miniButtonStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', fontWeight: 950 }
const footerStyle: React.CSSProperties = { marginTop: 10, fontSize: 11, color: '#93c5fd', fontWeight: 800 }