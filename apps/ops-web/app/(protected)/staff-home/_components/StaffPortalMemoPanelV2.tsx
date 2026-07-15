'use client'

import { useMemo, useState } from 'react'
import type { StaffMemoRecord } from '@/lib/staff-portal-os/phase2-data'
import { acknowledgeStaffMemoPhase2 } from '@/lib/staff-portal-os/phase2-actions'

export default function StaffPortalMemoPanelV2({ memos }: { memos: StaffMemoRecord[] }) {
  const [activeId, setActiveId] = useState<string>(memos[0]?.id || '')
  const [expanded, setExpanded] = useState(false)
  const activeMemo = useMemo(() => memos.find((memo) => memo.id === activeId) || memos[0], [activeId, memos])
  const unackedCount = memos.filter((memo) => !memo.acknowledged_at).length

  return (
    <section
      id="control-memos"
      style={{
        background: '#020617',
        border: '1px solid #14532d',
        borderRadius: 28,
        padding: 18,
        color: '#bbf7d0',
        boxShadow: '0 24px 80px rgba(22,163,74,.22)',
        minHeight: expanded ? 560 : 380,
        transition: 'min-height .25s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ color: '#22c55e', fontWeight: 950, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12 }}>
            ATC Control Memos · Persistent
          </div>
          <h2 style={{ margin: '5px 0 0', color: '#dcfce7', fontSize: 22 }}>Control Tower Briefing</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unackedCount > 0 ? (
            <span style={{ width: 16, height: 16, borderRadius: 999, background: '#ef4444', boxShadow: '0 0 0 8px rgba(239,68,68,.18), 0 0 30px rgba(239,68,68,.8)' }} />
          ) : (
            <span style={{ width: 16, height: 16, borderRadius: 999, background: '#22c55e', boxShadow: '0 0 0 8px rgba(34,197,94,.18)' }} />
          )}
          <strong style={{ color: unackedCount ? '#fecaca' : '#bbf7d0' }}>{unackedCount ? `${unackedCount} UNACK` : 'CLEAR'}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: expanded ? '1fr' : '220px minmax(0,1fr)', gap: 14 }}>
        {!expanded ? (
          <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
            {memos.length ? memos.map((memo) => {
              const isActive = memo.id === activeMemo?.id
              const isAck = Boolean(memo.acknowledged_at)
              return (
                <button
                  key={memo.id}
                  type="button"
                  onClick={() => setActiveId(memo.id)}
                  style={{
                    textAlign: 'left',
                    border: `1px solid ${isActive ? '#22c55e' : '#14532d'}`,
                    background: isActive ? 'rgba(34,197,94,.18)' : 'rgba(2,6,23,.8)',
                    color: isAck ? '#86efac' : '#dcfce7',
                    borderRadius: 14,
                    padding: 10,
                    cursor: 'pointer',
                    fontWeight: 850,
                  }}
                >
                  <div style={{ fontSize: 11, color: isAck ? '#22c55e' : '#f87171', textTransform: 'uppercase' }}>
                    {isAck ? 'ACK' : 'NEW'} · {memo.source}
                  </div>
                  <div>{memo.title}</div>
                </button>
              )
            }) : (
              <div style={{ color: '#86efac', fontWeight: 850 }}>No active memo.</div>
            )}
          </div>
        ) : null}

        <div
          style={{
            border: '1px solid #14532d',
            borderRadius: 22,
            background:
              'linear-gradient(rgba(34,197,94,.08), rgba(34,197,94,.04)), repeating-linear-gradient(0deg, rgba(34,197,94,.05) 0, rgba(34,197,94,.05) 1px, transparent 1px, transparent 18px)',
            padding: 18,
            minHeight: expanded ? 430 : 260,
          }}
        >
          {activeMemo ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ color: '#22c55e', fontWeight: 950, textTransform: 'uppercase', fontSize: 12 }}>
                    {activeMemo.source} · {activeMemo.severity}
                  </div>
                  <h3 style={{ color: '#dcfce7', margin: '6px 0 0', fontSize: expanded ? 30 : 22 }}>{activeMemo.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  style={{
                    border: '1px solid #22c55e',
                    background: 'rgba(34,197,94,.12)',
                    color: '#bbf7d0',
                    borderRadius: 999,
                    padding: '8px 11px',
                    fontWeight: 950,
                    cursor: 'pointer',
                    height: 38,
                  }}
                >
                  {expanded ? 'Minimize' : 'Enlarge'}
                </button>
              </div>

              <p style={{ color: '#bbf7d0', fontSize: expanded ? 18 : 15, lineHeight: 1.7, fontWeight: 760 }}>
                {activeMemo.body}
              </p>

              <form action={acknowledgeStaffMemoPhase2} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
                <input type="hidden" name="memo_id" value={activeMemo.id} />
                <button
                  type="submit"
                  disabled={Boolean(activeMemo.acknowledged_at)}
                  style={{
                    border: '1px solid #22c55e',
                    background: activeMemo.acknowledged_at ? '#14532d' : '#22c55e',
                    color: activeMemo.acknowledged_at ? '#bbf7d0' : '#022c22',
                    borderRadius: 999,
                    padding: '10px 14px',
                    fontWeight: 950,
                    cursor: activeMemo.acknowledged_at ? 'default' : 'pointer',
                  }}
                >
                  {activeMemo.acknowledged_at ? 'Receipt acknowledged' : 'Acknowledge receipt'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ color: '#86efac', fontWeight: 850 }}>No control memo available.</div>
          )}
        </div>
      </div>
    </section>
  )
}
