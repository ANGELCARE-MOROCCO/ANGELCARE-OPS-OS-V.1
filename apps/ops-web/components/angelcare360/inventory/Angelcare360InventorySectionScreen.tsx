import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Angelcare360InventorySectionScreen({ title, description, actions, children }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>{title}</h2>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </div>
      <div>{children}</div>
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff', boxShadow: '0 18px 54px rgba(15,23,42,.05)' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 950 }
const descriptionStyle: React.CSSProperties = { margin: '6px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
