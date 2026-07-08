import Link from 'next/link'
import { ANGELCARE360_COLORS, angelcare360LockedCardStyle, angelcare360ButtonBaseStyle } from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export default function Angelcare360EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: Angelcare360EmptyStateProps) {
  return (
    <section style={shellStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>Aucun résultat</div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
        {actionLabel && actionHref ? (
          <Link href={actionHref} style={linkStyle}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  padding: 4,
}

const cardStyle: React.CSSProperties = {
  ...angelcare360LockedCardStyle,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: ANGELCARE360_COLORS.blueSoft,
  color: ANGELCARE360_COLORS.blue,
  fontWeight: 900,
  fontSize: 12,
  padding: '6px 10px',
}

const titleStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: ANGELCARE360_COLORS.navy,
  fontSize: 20,
  fontWeight: 900,
}

const descriptionStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: ANGELCARE360_COLORS.slate,
  lineHeight: 1.6,
  fontWeight: 600,
}

const linkStyle: React.CSSProperties = {
  ...angelcare360ButtonBaseStyle,
  marginTop: 16,
  textDecoration: 'none',
  padding: '10px 14px',
}
