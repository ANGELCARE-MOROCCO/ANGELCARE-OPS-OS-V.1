import type { CSSProperties } from 'react'

export const ANGELCARE360_COLORS = {
  navy: '#0f172a',
  blue: '#1d4ed8',
  blueSoft: '#eff6ff',
  blueBorder: '#bfdbfe',
  blueBorderActive: '#93c5fd',
  slate: '#475569',
  slateMuted: '#64748b',
  border: '#dbe4ef',
  borderSoft: '#e2e8f0',
  borderMuted: '#eef2f7',
  background: '#f8fafc',
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

export const angelcare360PageShellStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
}

export const angelcare360PageHeaderStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'start',
  justifyContent: 'space-between',
  gap: 16,
}

export const angelcare360PageHeadingStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
}

export const angelcare360EyebrowRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

export const angelcare360BadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: ANGELCARE360_COLORS.blueSoft,
  color: ANGELCARE360_COLORS.blue,
  fontSize: 12,
  fontWeight: 900,
}

export const angelcare360StatusStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: ANGELCARE360_COLORS.background,
  color: ANGELCARE360_COLORS.navy,
  fontSize: 12,
  fontWeight: 900,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
}

export const angelcare360PageTitleStyle: CSSProperties = {
  margin: 0,
  color: ANGELCARE360_COLORS.navy,
  fontSize: 28,
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: -0.4,
}

export const angelcare360PageSubtitleStyle: CSSProperties = {
  margin: 0,
  maxWidth: 980,
  color: ANGELCARE360_COLORS.slate,
  fontSize: 15,
  lineHeight: 1.7,
  fontWeight: 600,
}

export const angelcare360PageActionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

export const angelcare360PageContextRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

export const angelcare360PageContentStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
}

export const angelcare360SurfaceCardStyle: CSSProperties = {
  borderRadius: 24,
  background: ANGELCARE360_COLORS.white,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

export const angelcare360SurfaceCardInnerStyle: CSSProperties = {
  ...angelcare360SurfaceCardStyle,
  padding: 20,
}

export const angelcare360SurfaceMutedStyle: CSSProperties = {
  borderRadius: 22,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.background,
}

export const angelcare360RiskCardStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  background: `linear-gradient(180deg, #ffffff 0%, ${ANGELCARE360_COLORS.background} 100%)`,
}

export const angelcare360LockedCardStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  border: `1px solid ${ANGELCARE360_COLORS.amberBorder}`,
  background: ANGELCARE360_COLORS.amberSoft,
}

export const angelcare360SuccessCardStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  border: `1px solid ${ANGELCARE360_COLORS.greenBorder}`,
  background: ANGELCARE360_COLORS.greenSoft,
}

export const angelcare360ErrorCardStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  border: `1px solid ${ANGELCARE360_COLORS.redBorder}`,
  background: ANGELCARE360_COLORS.redSoft,
}

export const angelcare360DrawerOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(15, 23, 42, 0.34)',
  display: 'grid',
  placeItems: 'center',
  padding: 16,
}

export const angelcare360DrawerStyle: CSSProperties = {
  width: 'min(960px, 100%)',
  maxHeight: '100%',
  overflowY: 'auto',
  background: ANGELCARE360_COLORS.white,
  borderRadius: 28,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  boxShadow: '0 30px 90px rgba(15, 23, 42, 0.18)',
  padding: 22,
  display: 'grid',
  gap: 18,
}

export const angelcare360HeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 12,
}

export const angelcare360CardTitleStyle: CSSProperties = {
  margin: '0',
  color: ANGELCARE360_COLORS.navy,
  fontSize: 20,
  fontWeight: 950,
}

export const angelcare360CardSubtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  color: ANGELCARE360_COLORS.slate,
  lineHeight: 1.65,
  fontWeight: 600,
}

export const angelcare360SectionCardStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  display: 'grid',
  gap: 14,
}

export const angelcare360TableShellStyle: CSSProperties = {
  overflowX: 'auto',
  borderRadius: 24,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background: ANGELCARE360_COLORS.white,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

export const angelcare360TableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

export const angelcare360TableHeadCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: ANGELCARE360_COLORS.slateMuted,
  background: ANGELCARE360_COLORS.background,
  borderBottom: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  whiteSpace: 'nowrap',
}

export const angelcare360TableCellStyle: CSSProperties = {
  padding: '14px 16px',
  borderBottom: `1px solid ${ANGELCARE360_COLORS.borderMuted}`,
  color: ANGELCARE360_COLORS.navy,
  fontSize: 14,
  verticalAlign: 'top',
}

export const angelcare360TableRowStyle: CSSProperties = {
  background: ANGELCARE360_COLORS.white,
}

export const angelcare360ButtonBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.navy}`,
  background: ANGELCARE360_COLORS.navy,
  color: ANGELCARE360_COLORS.white,
  padding: '10px 14px',
  fontWeight: 850,
  cursor: 'pointer',
}

export const angelcare360ButtonSecondaryStyle: CSSProperties = {
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
}

export const angelcare360ButtonGhostStyle: CSSProperties = {
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.background,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
}

export const angelcare360ButtonDisabledStyle: CSSProperties = {
  border: `1px dashed ${ANGELCARE360_COLORS.border}`,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.background,
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

export const angelcare360InputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  padding: '11px 14px',
  fontSize: 14,
  color: ANGELCARE360_COLORS.navy,
  background: ANGELCARE360_COLORS.white,
  outline: 'none',
}

export const angelcare360TextareaStyle: CSSProperties = {
  ...angelcare360InputStyle,
  minHeight: 96,
  resize: 'vertical',
}

export const angelcare360FieldLabelStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
}

export const angelcare360FormLabelStyle: CSSProperties = {
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

export const angelcare360HelpTextStyle: CSSProperties = {
  color: ANGELCARE360_COLORS.slateMuted,
  fontSize: 12,
  lineHeight: 1.55,
  fontWeight: 600,
}

