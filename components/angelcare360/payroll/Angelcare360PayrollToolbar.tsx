'use client'

import { useMemo } from 'react'

type Angelcare360PayrollToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  periodLabel: string
  onPeriodChange: (value: string) => void
  filters?: string[]
  onFilterChange?: (value: string) => void
  selectedFilter?: string
  disabledNote?: string
}

export default function Angelcare360PayrollToolbar({
  query,
  onQueryChange,
  periodLabel,
  onPeriodChange,
  filters,
  onFilterChange,
  selectedFilter,
  disabledNote,
}: Angelcare360PayrollToolbarProps) {
  const options = useMemo(() => filters || [], [filters])

  return (
    <section style={toolbarStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Recherche</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} style={inputStyle} placeholder="Rechercher une période, un dossier ou un élément…" />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Période</span>
        <input value={periodLabel} onChange={(event) => onPeriodChange(event.target.value)} style={inputStyle} placeholder="Mois, cycle ou période de paie" />
      </label>

      {options.length > 0 && onFilterChange ? (
        <label style={fieldStyle}>
          <span style={labelStyle}>Filtre</span>
          <select value={selectedFilter || ''} onChange={(event) => onFilterChange(event.target.value)} style={inputStyle}>
            <option value="">Tous</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      ) : null}

      {disabledNote ? <div style={noteStyle}>{disabledNote}</div> : null}
    </section>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  padding: 16,
  borderRadius: 22,
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  minWidth: 220,
  flex: '1 1 220px',
}

const labelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
  outline: 'none',
}

const noteStyle: React.CSSProperties = {
  flex: '1 1 100%',
  padding: '10px 12px',
  borderRadius: 14,
  background: '#fffbeb',
  color: '#92400e',
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.6,
}
