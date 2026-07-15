'use client'

import { useMemo } from 'react'

type Angelcare360FinanceToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  periodLabel: string
  onPeriodChange: (value: string) => void
  filters?: string[]
  onFilterChange?: (value: string) => void
  selectedFilter?: string
}

export default function Angelcare360FinanceToolbar({
  query,
  onQueryChange,
  periodLabel,
  onPeriodChange,
  filters,
  onFilterChange,
  selectedFilter,
}: Angelcare360FinanceToolbarProps) {
  const options = useMemo(() => filters || [], [filters])

  return (
    <section style={toolbarStyle}>
      <label style={fieldStyle}>
        <span style={labelStyle}>Recherche</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} style={inputStyle} placeholder="Rechercher un élève, une facture, un paiement…" />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Période</span>
        <input value={periodLabel} onChange={(event) => onPeriodChange(event.target.value)} style={inputStyle} placeholder="Mois, trimestre ou période" />
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
    </section>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  padding: 16,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
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

