'use client'

import type { ChangeEvent, ReactNode } from 'react'

type FilterDefinition = {
  name: string
  label: string
  options: Array<{ label: string; value: string }>
}

type Angelcare360AdmissionsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  filters?: Array<{
    definition: FilterDefinition
    value: string
    onChange: (value: string) => void
  }>
  primaryActionLabel?: string
  primaryActionDisabledReason?: string
  onPrimaryAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  tertiaryActionLabel?: string
  onTertiaryAction?: () => void
  trailing?: ReactNode
}

export default function Angelcare360AdmissionsToolbar({
  search,
  onSearchChange,
  filters = [],
  primaryActionLabel,
  primaryActionDisabledReason,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  tertiaryActionLabel,
  onTertiaryAction,
  trailing,
}: Angelcare360AdmissionsToolbarProps) {
  return (
    <section style={toolbarStyle}>
      <div style={searchRowStyle}>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Recherche</span>
          <input
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
            placeholder="Rechercher par nom, code, contact, classe ou statut"
            style={inputStyle}
          />
        </label>

        {onSecondaryAction && secondaryActionLabel ? (
          <button type="button" onClick={onSecondaryAction} style={ghostButtonStyle}>
            {secondaryActionLabel}
          </button>
        ) : null}

        {onTertiaryAction && tertiaryActionLabel ? (
          <button type="button" onClick={onTertiaryAction} style={ghostButtonStyle}>
            {tertiaryActionLabel}
          </button>
        ) : null}

        {primaryActionLabel ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={Boolean(primaryActionDisabledReason) || !onPrimaryAction}
            title={primaryActionDisabledReason}
            style={primaryActionDisabledReason || !onPrimaryAction ? disabledButtonStyle : primaryButtonStyle}
          >
            {primaryActionLabel}
          </button>
        ) : null}
      </div>

      {filters.length > 0 ? (
        <div style={filterRowStyle}>
          {filters.map(({ definition, value, onChange }) => (
            <label key={definition.name} style={filterLabelStyle}>
              <span style={labelTextStyle}>{definition.label}</span>
              <select value={value} onChange={(event) => onChange(event.target.value)} style={selectStyle}>
                <option value="">Tous</option>
                {definition.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}

      {trailing ? <div style={trailingStyle}>{trailing}</div> : null}
    </section>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 16,
  border: '1px solid #dbe4ef',
  borderRadius: 24,
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const searchRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto auto auto',
  gap: 12,
  alignItems: 'end',
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const filterLabelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  minWidth: 180,
}

const labelTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 14px',
  fontSize: 14,
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 14px',
  fontSize: 14,
  color: '#0f172a',
  background: '#fff',
  outline: 'none',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const ghostButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const filterRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
}

const trailingStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

