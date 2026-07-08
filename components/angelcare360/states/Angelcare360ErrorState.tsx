import Link from 'next/link'
import { ANGELCARE360_COLORS, angelcare360ErrorCardStyle, angelcare360ButtonSecondaryStyle, angelcare360ButtonBaseStyle } from '@/components/angelcare360/ui/Angelcare360VisualSystem'

type Angelcare360ErrorStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onRetry?: () => void
}

export default function Angelcare360ErrorState({
  title,
  description,
  actionLabel = 'Retour au cockpit',
  actionHref = '/angelcare-360-command-center',
  onRetry,
}: Angelcare360ErrorStateProps) {
  return (
    <section style={shellStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>Erreur contrôlée</div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
        <div style={actionsStyle}>
          {onRetry ? (
            <button type="button" onClick={onRetry} style={buttonStyle}>
              Réessayer
            </button>
          ) : null}
          <Link href={actionHref} style={linkStyle}>
            {actionLabel}
          </Link>
        </div>
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  padding: 4,
}

const cardStyle: React.CSSProperties = {
  ...angelcare360ErrorCardStyle,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: ANGELCARE360_COLORS.redSoft,
  color: ANGELCARE360_COLORS.red,
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

const actionsStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const buttonStyle: React.CSSProperties = {
  ...angelcare360ButtonSecondaryStyle,
}

const linkStyle: React.CSSProperties = {
  ...angelcare360ButtonBaseStyle,
  textDecoration: 'none',
  padding: '10px 14px',
}
