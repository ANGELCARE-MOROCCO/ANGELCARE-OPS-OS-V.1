import Link from 'next/link'

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
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #fecaca',
  boxShadow: '0 20px 58px rgba(239, 68, 68, 0.08)',
  padding: 22,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: '#fef2f2',
  color: '#b91c1c',
  fontWeight: 900,
  fontSize: 12,
  padding: '6px 10px',
}

const titleStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 900,
}

const descriptionStyle: React.CSSProperties = {
  margin: '10px 0 0',
  color: '#475569',
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
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

