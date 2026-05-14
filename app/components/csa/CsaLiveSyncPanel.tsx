'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Snapshot = any

export default function CsaLiveSyncPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const res = await fetch('/api/csa/live-snapshot', { cache: 'no-store' })
        const json = await res.json()
        if (!alive) return
        if (!json.ok) setError(json.error || 'Sync unavailable')
        else setSnapshot(json.snapshot)
      } catch {
        if (alive) setError('Sync unavailable')
      }
    }

    load()
    const timer = setInterval(load, 45000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  if (error) {
    return <div style={boxStyle}>Live sync: {error}</div>
  }

  if (!snapshot) {
    return <div style={boxStyle}>Loading C.S.A live synchronization...</div>
  }

  return (
    <section style={panelStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Live C.S.A Synchronization</h2>
          <p style={subStyle}>Mode: {snapshot.mode} · Loaded {snapshot.loadedAt}</p>
        </div>
        <Link href="/reports" style={buttonStyle}>Open reports</Link>
      </header>

      <div style={gridStyle}>
        {snapshot.sync?.map((item: any) => (
          <Link key={item.module} href={item.href} style={cardStyle}>
            <span style={labelStyle}>{item.module}</span>
            <strong style={valueStyle}>{item.count}</strong>
            <em style={hintStyle}>{item.table}</em>
          </Link>
        ))}
      </div>
    </section>
  )
}

const boxStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontWeight: 900 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 20, boxShadow: '0 14px 36px rgba(15,23,42,.06)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 1000 }
const subStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 700 }
const buttonStyle: React.CSSProperties = { background: '#0f172a', color: '#fff', padding: '11px 14px', borderRadius: 14, textDecoration: 'none', fontWeight: 950 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: '#64748b' }
const valueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 1000 }
const hintStyle: React.CSSProperties = { fontSize: 11, color: '#94a3b8', fontWeight: 800 }
