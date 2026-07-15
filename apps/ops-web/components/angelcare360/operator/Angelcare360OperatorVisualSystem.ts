import type { CSSProperties } from 'react'

export const ANGELCARE360_OPERATOR_COLORS = {
  navy: '#0f172a',
  blue: '#1d4ed8',
  blueDeep: '#1e40af',
  blueSoft: '#eff6ff',
  blueTint: '#dbeafe',
  blueBorder: '#bfdbfe',
  blueBorderActive: '#93c5fd',
  slate: '#475569',
  slateMuted: '#64748b',
  slateSoft: '#f8fafc',
  border: '#dbe4ef',
  borderSoft: '#e2e8f0',
  borderMuted: '#eef2f7',
  background: '#f8fafc',
  backgroundAlt: '#f1f5f9',
  white: '#ffffff',
  green: '#166534',
  greenSoft: '#f0fdf4',
  greenBorder: '#bbf7d0',
  amber: '#c2410c',
  amberSoft: '#fff7ed',
  amberBorder: '#fed7aa',
  red: '#b91c1c',
  redSoft: '#fef2f2',
  redBorder: '#fecaca',
}

export const operatorButtonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 14,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.navy,
  background: ANGELCARE360_OPERATOR_COLORS.navy,
  color: ANGELCARE360_OPERATOR_COLORS.white,
  padding: '10px 14px',
  fontWeight: 800,
  textDecoration: 'none',
  cursor: 'pointer',
  minHeight: 42,
  minWidth: 112,
  whiteSpace: 'nowrap',
  boxShadow: '0 12px 24px rgba(15,23,42,.12)',
  transition: 'transform .15s ease, box-shadow .15s ease, background-color .15s ease, border-color .15s ease',
}

export const operatorButtonSecondary: CSSProperties = {
  ...operatorButtonBase,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  boxShadow: '0 10px 24px rgba(15,23,42,.05)',
}

export const operatorButtonGhost: CSSProperties = {
  ...operatorButtonSecondary,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  boxShadow: 'none',
}

export const operatorButtonDisabled: CSSProperties = {
  ...operatorButtonSecondary,
  background: ANGELCARE360_OPERATOR_COLORS.background,
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  borderStyle: 'dashed',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  cursor: 'not-allowed',
  boxShadow: 'none',
  opacity: 0.86,
}

export const operatorButtonDanger: CSSProperties = {
  ...operatorButtonBase,
  background: ANGELCARE360_OPERATOR_COLORS.red,
  borderColor: ANGELCARE360_OPERATOR_COLORS.red,
  boxShadow: '0 12px 24px rgba(185,28,28,.16)',
}

export const operatorInputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 14,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  padding: '11px 13px',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontSize: 14,
  outline: 'none',
  boxShadow: 'inset 0 1px 2px rgba(15,23,42,.02)',
  transition: 'border-color .15s ease, box-shadow .15s ease, background-color .15s ease',
}

export const operatorPageShell: CSSProperties = {
  display: 'grid',
  gap: 18,
}

export const operatorPageCard: CSSProperties = {
  borderRadius: 24,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

export const operatorPageCardInner: CSSProperties = {
  ...operatorPageCard,
  padding: 20,
}

export const operatorSectionBackground: CSSProperties = {
  ...operatorPageCard,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.96) 100%)',
}

export const operatorHeroBackground: CSSProperties = {
  ...operatorPageCard,
  background:
    'radial-gradient(circle at top right, rgba(219,234,254,.75) 0%, rgba(255,255,255,.96) 36%), linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(241,245,249,.94) 100%)',
  boxShadow: '0 24px 72px rgba(15,23,42,.07)',
}

export const operatorDivider = `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`
