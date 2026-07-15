import type { CSSProperties } from 'react'

export const ANGELCARE360_COLORS = {
  navy: '#0f172a',
  navyDeep: '#081225',
  blue: '#1d4ed8',
  blueDeep: '#1540b8',
  blueSoft: '#eff6ff',
  blueTint: '#f4f8ff',
  blueBorder: '#bfdbfe',
  blueBorderActive: '#93c5fd',
  cyan: '#0891b2',
  teal: '#0f766e',
  purple: '#7c3aed',
  slate: '#475569',
  slateMuted: '#64748b',
  border: '#dbe4ef',
  borderSoft: '#e2e8f0',
  borderMuted: '#eef2f7',
  borderStrong: '#cbd8e6',
  background: '#f8fafc',
  backgroundAlt: '#eef4fb',
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

export const angelcare360PageBackdropStyle: CSSProperties = {
  position: 'relative',
  isolation: 'isolate',
}

export const angelcare360HeroBackdropStyle: CSSProperties = {
  borderRadius: 30,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background:
    'linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(239,246,255,.95) 48%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 24px 72px rgba(15,23,42,.08)',
}

export const angelcare360SectionBackdropStyle: CSSProperties = {
  borderRadius: 28,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background:
    'linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(247,250,252,.96) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.06)',
}

export const angelcare360PanelBackdropStyle: CSSProperties = {
  borderRadius: 26,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.white,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
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
  background: ANGELCARE360_COLORS.blueTint,
  color: ANGELCARE360_COLORS.blueDeep,
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

export const angelcare360PillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 900,
  border: `1px solid ${ANGELCARE360_COLORS.borderSoft}`,
  background: ANGELCARE360_COLORS.background,
  color: ANGELCARE360_COLORS.navy,
}

export const angelcare360PillBlueStyle: CSSProperties = {
  ...angelcare360PillStyle,
  background: ANGELCARE360_COLORS.blueTint,
  color: ANGELCARE360_COLORS.blueDeep,
  border: `1px solid ${ANGELCARE360_COLORS.blueBorder}`,
}

export const angelcare360PillGreenStyle: CSSProperties = {
  ...angelcare360PillStyle,
  background: ANGELCARE360_COLORS.greenSoft,
  color: ANGELCARE360_COLORS.green,
  border: `1px solid ${ANGELCARE360_COLORS.greenBorder}`,
}

export const angelcare360PillAmberStyle: CSSProperties = {
  ...angelcare360PillStyle,
  background: ANGELCARE360_COLORS.amberSoft,
  color: ANGELCARE360_COLORS.amber,
  border: `1px solid ${ANGELCARE360_COLORS.amberBorder}`,
}

export const angelcare360PillRedStyle: CSSProperties = {
  ...angelcare360PillStyle,
  background: ANGELCARE360_COLORS.redSoft,
  color: ANGELCARE360_COLORS.red,
  border: `1px solid ${ANGELCARE360_COLORS.redBorder}`,
}

export const angelcare360PageTitleStyle: CSSProperties = {
  margin: 0,
  color: ANGELCARE360_COLORS.navy,
  fontSize: 30,
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: -0.4,
}

export const angelcare360PageSubtitleStyle: CSSProperties = {
  margin: 0,
  maxWidth: 980,
  color: ANGELCARE360_COLORS.slate,
  fontSize: 15.5,
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
  borderRadius: 26,
  background: ANGELCARE360_COLORS.white,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  boxShadow: '0 20px 60px rgba(15,23,42,.06)',
}

export const angelcare360SurfaceCardInnerStyle: CSSProperties = {
  ...angelcare360SurfaceCardStyle,
  padding: 22,
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
  borderRadius: 26,
  border: `1px solid ${ANGELCARE360_COLORS.border}`,
  background: ANGELCARE360_COLORS.white,
  boxShadow: '0 20px 60px rgba(15,23,42,.06)',
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
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.navy,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.navy} 0%, ${ANGELCARE360_COLORS.navyDeep} 100%)`,
  color: ANGELCARE360_COLORS.white,
  padding: '10px 14px',
  fontWeight: 850,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(15,23,42,.10)',
  transition: 'transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease, border-color 140ms ease',
}

export const angelcare360ButtonSecondaryStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.borderStrong,
  borderRadius: 14,
  padding: '10px 14px',
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(15,23,42,.05)',
  transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background-color 140ms ease',
}

export const angelcare360ButtonGhostStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.borderSoft,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.white,
  color: ANGELCARE360_COLORS.navy,
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background-color 140ms ease',
}

export const angelcare360ButtonDisabledStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: ANGELCARE360_COLORS.borderStrong,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.background,
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

export const angelcare360ButtonDangerStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_COLORS.redBorder,
  borderRadius: 14,
  padding: '10px 14px',
  background: ANGELCARE360_COLORS.redSoft,
  color: ANGELCARE360_COLORS.red,
  fontWeight: 850,
  cursor: 'pointer',
  boxShadow: '0 10px 20px rgba(185, 28, 28, 0.08)',
  transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background-color 140ms ease',
}

export const angelcare360InputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 16,
  border: `1px solid ${ANGELCARE360_COLORS.borderStrong}`,
  padding: '12px 14px',
  fontSize: 14,
  color: ANGELCARE360_COLORS.navy,
  background: ANGELCARE360_COLORS.white,
  outline: 'none',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)',
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

export const angelcare360CardSurfaceStyle: CSSProperties = {
  ...angelcare360SurfaceCardInnerStyle,
  background: `linear-gradient(180deg, ${ANGELCARE360_COLORS.white} 0%, ${ANGELCARE360_COLORS.background} 100%)`,
}

export const angelcare360ModuleTileStyle: CSSProperties = {
  ...angelcare360CardSurfaceStyle,
  display: 'grid',
  gap: 12,
}

export const angelcare360RightRailStyle: CSSProperties = {
  ...angelcare360CardSurfaceStyle,
  borderRadius: 28,
}

export const angelcare360MetricCardStyle: CSSProperties = {
  ...angelcare360CardSurfaceStyle,
  position: 'relative',
  overflow: 'hidden',
}

export const angelcare360MetricAccentStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  height: 4,
  background: `linear-gradient(90deg, ${ANGELCARE360_COLORS.blue} 0%, ${ANGELCARE360_COLORS.cyan} 50%, ${ANGELCARE360_COLORS.green} 100%)`,
}
