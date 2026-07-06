'use client'

import Link from 'next/link'
import type { Angelcare360ToolbarScope } from '@/types/angelcare360/ui'

type Angelcare360ToolbarProps = {
  query: string
  scope: Angelcare360ToolbarScope
  onQueryChange: (value: string) => void
  onScopeChange: (scope: Angelcare360ToolbarScope) => void
  onReset: () => void
  onOpenDrawer: () => void
}

const scopeOptions: Array<{ value: Angelcare360ToolbarScope; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'pilotage', label: 'Pilotage' },
  { value: 'scolarite', label: 'Scolarité' },
  { value: 'gestion', label: 'Gestion' },
  { value: 'services', label: 'Services' },
  { value: 'gouvernance', label: 'Gouvernance' },
]

export default function Angelcare360Toolbar({
  query,
  scope,
  onQueryChange,
  onScopeChange,
  onReset,
  onOpenDrawer,
}: Angelcare360ToolbarProps) {
  return (
    <section style={toolbarStyle}>
      <div style={searchShellStyle}>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Recherche contrôlée</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher un module, une fonction ou un mot-clé"
            style={inputStyle}
          />
        </label>
        <button type="button" onClick={onOpenDrawer} style={buttonStyle}>
          Ouvrir un aperçu
        </button>
        <button type="button" onClick={onReset} style={ghostButtonStyle}>
          Réinitialiser
        </button>
      </div>

      <div style={chipRowStyle} role="tablist" aria-label="Filtres de modules">
        {scopeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onScopeChange(option.value)}
            aria-pressed={scope === option.value}
            style={{
              ...chipStyle,
              ...(scope === option.value ? activeChipStyle : null),
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div style={actionRowStyle}>
        <Link href="/angelcare-360-command-center/direction" style={routeLinkStyle}>
          Ouvrir le cockpit détaillé
        </Link>
        <button
          type="button"
          disabled
          title="L’export de structure sera branché en phase 2."
          style={disabledActionStyle}
        >
          Export structure phase 2
        </button>
      </div>
    </section>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  background: '#fff',
  border: '1px solid #dbe4ef',
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const searchShellStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto auto',
  gap: 12,
  alignItems: 'end',
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
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

const buttonStyle: React.CSSProperties = {
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

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chipStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 999,
  background: '#fff',
  color: '#0f172a',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
}

const activeChipStyle: React.CSSProperties = {
  background: '#eff6ff',
  borderColor: '#93c5fd',
  color: '#1d4ed8',
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const routeLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#eff6ff',
  color: '#1d4ed8',
  textDecoration: 'none',
  padding: '10px 14px',
  border: '1px solid #93c5fd',
  fontWeight: 900,
}

const disabledActionStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#64748b',
  fontWeight: 800,
  cursor: 'not-allowed',
}

