'use client'

import { ANGELCARE360_OPERATOR_COLORS, operatorButtonBase, operatorButtonGhost, operatorButtonSecondary, operatorInputStyle } from './Angelcare360OperatorVisualSystem'

type Props = {
  query: string
  onQueryChange: (value: string) => void
  onRefresh: () => void
  onOpenDrawer?: () => void
  primaryLabel?: string
  secondaryLabel?: string
}

export default function Angelcare360OperatorCommandBar({
  query,
  onQueryChange,
  onRefresh,
  onOpenDrawer,
  primaryLabel = 'Rafraîchir',
  secondaryLabel = 'Ouvrir le panneau',
}: Props) {
  return (
    <section style={barStyle}>
      <label style={labelStyle}>
        <span style={labelTextStyle}>Recherche interne</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher un client, un abonnement, une facture ou un ticket"
          style={inputStyle}
        />
      </label>
      <button type="button" onClick={onRefresh} style={refreshButtonStyle}>
        {primaryLabel}
      </button>
      {onOpenDrawer ? (
        <button type="button" onClick={onOpenDrawer} style={openButtonStyle}>
          {secondaryLabel}
        </button>
      ) : null}
    </section>
  )
}

const barStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto auto',
  gap: 12,
  alignItems: 'end',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.border}`,
  borderRadius: 24,
  padding: 16,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const labelTextStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.blue,
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const inputStyle: React.CSSProperties = {
  ...operatorInputStyle,
}

const refreshButtonStyle: React.CSSProperties = {
  ...operatorButtonBase,
  padding: '11px 14px',
}

const openButtonStyle: React.CSSProperties = {
  ...operatorButtonSecondary,
  padding: '11px 14px',
}
