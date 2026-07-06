type Angelcare360SuccessStateProps = {
  title: string
  description: string
}

export default function Angelcare360SuccessState({ title, description }: Angelcare360SuccessStateProps) {
  return (
    <section style={shellStyle} aria-live="polite">
      <div style={cardStyle}>
        <div style={badgeStyle}>Prêt</div>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
      </div>
    </section>
  )
}

const shellStyle: React.CSSProperties = {
  padding: 4,
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid #bbf7d0',
  boxShadow: '0 20px 58px rgba(34, 197, 94, 0.08)',
  padding: 20,
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  background: '#dcfce7',
  color: '#166534',
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

