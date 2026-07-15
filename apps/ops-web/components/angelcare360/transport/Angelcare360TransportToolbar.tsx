import Link from 'next/link'

type TransportToolbarProps = {
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  lockedActionLabel?: string
  lockedActionReason?: string
}

export default function Angelcare360TransportToolbar({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  lockedActionLabel,
  lockedActionReason,
}: TransportToolbarProps) {
  return (
    <div style={toolbarStyle}>
      {primaryHref && primaryLabel ? <Link href={primaryHref} style={primaryLinkStyle}>{primaryLabel}</Link> : null}
      {secondaryHref && secondaryLabel ? <Link href={secondaryHref} style={secondaryLinkStyle}>{secondaryLabel}</Link> : null}
      {lockedActionLabel ? <span style={lockedStyle}>{lockedActionLabel}{lockedActionReason ? ` · ${lockedActionReason}` : ''}</span> : null}
    </div>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 850,
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 850,
}

const lockedStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#991b1b',
  padding: '10px 14px',
  fontWeight: 800,
}

