import Link from 'next/link'

type Props = {
  createHref?: string
  auditHref?: string
  lockedReason?: string | null
}

export default function Angelcare360InventoryToolbar({ createHref, auditHref, lockedReason }: Props) {
  return (
    <section style={cardStyle}>
      <div style={rowStyle}>
        {createHref ? <Link href={createHref} style={primaryLinkStyle}>Créer une opération</Link> : null}
        {auditHref ? <Link href={auditHref} style={secondaryLinkStyle}>Audit inventaire</Link> : null}
        <span style={lockedStyle}>{lockedReason || 'Les exports et la lecture code-barres restent verrouillés.'}</span>
      </div>
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 16, borderRadius: 20, border: '1px solid #dbe4ef', background: '#fff' }
const rowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const primaryLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const secondaryLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 14, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', padding: '10px 14px', textDecoration: 'none', fontWeight: 800 }
const lockedStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 700 }
