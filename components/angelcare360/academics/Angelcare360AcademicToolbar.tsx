'use client'

import { useDeferredValue } from 'react'
import type { ReactNode } from 'react'

type FilterDefinition = {
  name: string
  label: string
  options: Array<{ label: string; value: string }>
  value: string
  onChange: (value: string) => void
}

type Angelcare360AcademicToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  filters?: FilterDefinition[]
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  onReset?: () => void
}

export default function Angelcare360AcademicToolbar({
  search,
  onSearchChange,
  filters = [],
  primaryAction,
  secondaryAction,
  onReset,
}: Angelcare360AcademicToolbarProps) {
  const deferredSearch = useDeferredValue(search)

  return (
    <section style={shellStyle}>
      <label style={searchBoxStyle}>
        <span style={labelStyle}>Recherche</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un cours, devoir, examen, bulletin..."
          style={inputStyle}
        />
        <span style={hintStyle}>Filtre actif: {deferredSearch || 'aucun'}</span>
      </label>

      {filters.length > 0 ? (
        <div style={filterGridStyle}>
          {filters.map((filter) => (
            <label key={filter.name} style={filterStyle}>
              <span style={labelStyle}>{filter.label}</span>
              <select value={filter.value} onChange={(event) => filter.onChange(event.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}

      {primaryAction || secondaryAction || onReset ? (
        <div style={actionRowStyle}>
          {secondaryAction}
          {onReset ? (
            <button type="button" onClick={onReset} style={secondaryButtonStyle}>
              Réinitialiser
            </button>
          ) : null}
          {primaryAction}
        </div>
      ) : null}
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
}

const searchBoxStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}

const filterStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const inputStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '12px 14px',
  fontSize: 14,
  fontWeight: 650,
  color: '#0f172a',
  background: '#f8fafc',
}

const selectStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '12px 14px',
  fontSize: 14,
  fontWeight: 650,
  color: '#0f172a',
  background: '#f8fafc',
}

const hintStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 10,
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}
