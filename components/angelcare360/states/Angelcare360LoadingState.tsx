export default function Angelcare360LoadingState() {
  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={eyebrowStyle}>ANGELCARE 360 COMMAND CENTER</div>
        <div style={titleStyle}>Chargement du cockpit sécurisé…</div>
        <div style={lineStyle} />
        <div style={lineMutedStyle} />
        <div style={gridStyle}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} style={skeletonCardStyle}>
              <div style={skeletonLabelStyle} />
              <div style={skeletonValueStyle} />
              <div style={skeletonTextStyle} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  padding: 24,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #dbe4ef',
  borderRadius: 28,
  boxShadow: '0 24px 72px rgba(15, 23, 42, 0.08)',
  padding: 24,
}

const eyebrowStyle: React.CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: 1.4,
  fontSize: 12,
  fontWeight: 900,
  color: '#2563eb',
}

const titleStyle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 24,
  fontWeight: 900,
  color: '#0f172a',
}

const lineStyle: React.CSSProperties = {
  marginTop: 18,
  height: 14,
  borderRadius: 999,
  background: 'linear-gradient(90deg,#e2e8f0,#f8fafc,#e2e8f0)',
}

const lineMutedStyle: React.CSSProperties = {
  marginTop: 10,
  width: '62%',
  height: 12,
  borderRadius: 999,
  background: '#e2e8f0',
}

const gridStyle: React.CSSProperties = {
  marginTop: 20,
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const skeletonCardStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 22,
  padding: 18,
}

const skeletonLabelStyle: React.CSSProperties = {
  width: '48%',
  height: 11,
  borderRadius: 999,
  background: '#e2e8f0',
}

const skeletonValueStyle: React.CSSProperties = {
  marginTop: 14,
  width: '78%',
  height: 24,
  borderRadius: 999,
  background: '#dbe4ef',
}

const skeletonTextStyle: React.CSSProperties = {
  marginTop: 10,
  width: '88%',
  height: 11,
  borderRadius: 999,
  background: '#e2e8f0',
}

