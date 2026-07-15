'use client'

import Link from 'next/link'
import type { Angelcare360ToolbarScope } from '@/types/angelcare360/ui'
import {
  ANGELCARE360_COLORS,
  angelcare360ButtonBaseStyle,
  angelcare360ButtonDisabledStyle,
  angelcare360ButtonGhostStyle,
  angelcare360InputStyle,
  angelcare360SectionBackdropStyle,
} from '@/components/angelcare360/ui/Angelcare360VisualSystem'

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
          title="L’export de structure reste verrouillé jusqu’à la configuration requise."
          style={disabledActionStyle}
        >
          Exporter la structure
        </button>
      </div>
    </section>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  ...angelcare360SectionBackdropStyle,
  padding: 18,
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
  ...angelcare360InputStyle,
}

const buttonStyle: React.CSSProperties = {
  ...angelcare360ButtonBaseStyle,
  padding: '11px 14px',
}

const ghostButtonStyle: React.CSSProperties = {
  ...angelcare360ButtonGhostStyle,
  padding: '11px 14px',
}

const chipRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chipStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.borderStrong,
  borderRadius: 999,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`,
  color: ANGELCARE360_COLORS.navy,
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(15,23,42,.04)',
}

const activeChipStyle: React.CSSProperties = {
  background: ANGELCARE360_COLORS.blueTint,
  borderColor: ANGELCARE360_COLORS.blueBorderActive,
  color: ANGELCARE360_COLORS.blueDeep,
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
  background: ANGELCARE360_COLORS.blueTint,
  color: ANGELCARE360_COLORS.blueDeep,
  textDecoration: 'none',
  padding: '10px 14px',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.blueBorderActive,
  fontWeight: 900,
}

const disabledActionStyle: React.CSSProperties = {
  ...angelcare360ButtonDisabledStyle,
  padding: '10px 14px',
}
