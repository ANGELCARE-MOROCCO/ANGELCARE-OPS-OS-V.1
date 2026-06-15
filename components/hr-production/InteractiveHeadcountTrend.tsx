'use client'

import { useMemo, useState } from 'react'

type Props = {
  months: string[]
  values: number[]
  hasRealDates: boolean
  attendanceRows: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function pointFor(index: number, value: number, values: number[], width: number, height: number) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = Math.max(max - min, 1)
  const x = values.length <= 1 ? width : (index / (values.length - 1)) * width
  const y = height - ((value - min) / span) * (height - 22) - 11
  return { x, y }
}

export default function InteractiveHeadcountTrend({ months, values, hasRealDates, attendanceRows }: Props) {
  const safeMonths = months.length ? months : ['M-11','M-10','M-9','M-8','M-7','M-6','M-5','M-4','M-3','M-2','M-1','Now']
  const safeValues = values.length ? values : safeMonths.map(() => 0)
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, safeValues.length - 1))
  const width = 540
  const height = 160

  const points = useMemo(
    () => safeValues.map((value, index) => pointFor(index, value, safeValues, width, height)),
    [safeValues],
  )

  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = polyline ? `0,${height} ${polyline} ${width},${height}` : ''
  const selectedPoint = points[selectedIndex] || points[0] || { x: 0, y: height }
  const selectedValue = safeValues[selectedIndex] || 0
  const previousValue = safeValues[Math.max(0, selectedIndex - 1)] ?? selectedValue
  const selectedDelta = selectedValue - previousValue
  const startValue = safeValues[0] || 0
  const latestValue = safeValues[safeValues.length - 1] || 0
  const totalDelta = latestValue - startValue

  function selectFromClientX(clientX: number, target: SVGSVGElement) {
    const rect = target.getBoundingClientRect()
    const ratio = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1)
    const nextIndex = Math.round(ratio * (safeValues.length - 1))
    setSelectedIndex(clamp(nextIndex, 0, safeValues.length - 1))
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 backdrop-blur-xl col-span-12 xl:col-span-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-950">Headcount Trend</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">
            {hasRealDates ? 'Interactive live headcount timeline' : 'Interactive flat view until employee dates exist'}
          </p>
        </div>
        <div className={`rounded-2xl px-4 py-2 text-xs font-black ${hasRealDates ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {hasRealDates ? 'Live dates' : 'Needs dates'}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Selected month</p>
          <p className="mt-1 text-sm font-black text-slate-950">{safeMonths[selectedIndex]}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Headcount</p>
          <p className="mt-1 text-sm font-black text-slate-950">{selectedValue}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Month move</p>
          <p className={`mt-1 text-sm font-black ${selectedDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {selectedDelta >= 0 ? '+' : ''}{selectedDelta}
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50/80 to-white p-4">
        <svg
          viewBox={`0 0 ${width} ${height + 32}`}
          className="h-64 w-full cursor-ew-resize overflow-visible touch-none select-none"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            selectFromClientX(event.clientX, event.currentTarget)
          }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return
            selectFromClientX(event.clientX, event.currentTarget)
          }}
        >
          <defs>
            <linearGradient id="hrInteractiveTrend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.36" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => (
            <line key={line} x1="0" x2={width} y1={24 + line * 34} y2={24 + line * 34} stroke="#e9d5ff" strokeDasharray="7 9" />
          ))}

          {area ? <polygon points={area} fill="url(#hrInteractiveTrend)" /> : null}
          {polyline ? <polyline points={polyline} fill="none" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}

          {points.map((point, index) => (
            <g key={`${point.x}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={index === selectedIndex ? 9 : 6}
                fill="white"
                stroke={index === selectedIndex ? '#6d28d9' : '#8b5cf6'}
                strokeWidth={index === selectedIndex ? 5 : 4}
              />
              <text
                x={point.x}
                y={height + 24}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-black"
              >
                {safeMonths[index]}
              </text>
            </g>
          ))}

          <line x1={selectedPoint.x} x2={selectedPoint.x} y1="0" y2={height} stroke="#7c3aed" strokeDasharray="6 7" />
          <rect x={clamp(selectedPoint.x - 44, 0, width - 88)} y={Math.max(2, selectedPoint.y - 44)} rx="18" width="88" height="34" fill="#7c3aed" />
          <text x={clamp(selectedPoint.x, 44, width - 44)} y={Math.max(24, selectedPoint.y - 22)} textAnchor="middle" className="fill-white text-[12px] font-black">
            {selectedValue} staff
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          Current<br /><span className="text-lg text-slate-950">{latestValue}</span>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          Attendance rows<br /><span className="text-lg text-slate-950">{attendanceRows}</span>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          Trend quality<br /><span className={hasRealDates ? 'text-emerald-600' : 'text-amber-600'}>{hasRealDates ? 'Live' : 'Needs dates'}</span>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
          Net movement<br /><span className={totalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{totalDelta >= 0 ? '+' : ''}{totalDelta}</span>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-bold text-slate-400">
        Drag across the line to inspect each month. This is a live dashboard lens; it does not mutate HR records.
      </p>
    </section>
  )
}
