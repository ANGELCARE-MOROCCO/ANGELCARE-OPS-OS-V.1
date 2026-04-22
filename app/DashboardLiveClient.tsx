'use client'

import { useEffect, useMemo, useState } from 'react'

function formatClock(now: Date) {
  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  return { time, date }
}

export default function DashboardLiveClient({
  mode = 'feed',
  feedItems = [],
}: {
  mode?: 'feed' | 'clock'
  feedItems?: string[]
}) {
  const [now, setNow] = useState(new Date())
  const [renderTick, setRenderTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
      setRenderTick((v) => v + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const feedText = useMemo(() => {
    const base = feedItems.length > 0 ? feedItems : ['ANGELCARE OPS FEED • Aucun signal critique actif • supervision stable']
    return `${base.join('   ✦   ')}   ✦   ${base.join('   ✦   ')}`
  }, [feedItems, renderTick])

  if (mode === 'clock') {
    const clock = formatClock(now)
    return (
      <div
        style={{
          minWidth: 240,
          borderRadius: 18,
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
          color: '#0f172a',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.20)',
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{clock.time}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 8, textTransform: 'capitalize' }}>
          {clock.date}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 35%, #b91c1c 65%, #7f1d1d 100%)',
        borderBottom: '2px solid rgba(255,255,255,0.14)',
        boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        height: 46,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          whiteSpace: 'nowrap',
          display: 'inline-block',
          minWidth: '100%',
          color: '#ffffff',
          fontWeight: 900,
          letterSpacing: 0.4,
          fontSize: 14,
          paddingLeft: '100%',
          animation: 'angelcare-feed-marquee 35s linear infinite',
        }}
      >
        {feedText}
      </div>

      <style>{`
        @keyframes angelcare-feed-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}