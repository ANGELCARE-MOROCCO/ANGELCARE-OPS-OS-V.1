import Link from 'next/link'

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
  borderRadius: 24,
  background: '#fff',
  border: '1px solid #dbe4ef',
  boxShadow: '0 20px 58px rgba(15, 23, 42, 0.06)',
  padding: 22,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: '#eff6ff',
  color: '#1d4ed8',
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

const linkStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

