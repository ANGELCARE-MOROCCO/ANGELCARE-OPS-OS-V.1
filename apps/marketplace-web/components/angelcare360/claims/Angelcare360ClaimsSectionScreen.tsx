'use client'

import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Angelcare360ClaimsSectionScreen({ title, description, actions, children }: Props) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>{title}</h2>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
        {actions ? <div style={actionsStyle}>{actions}</div> : null}
      </div>
      <div style={bodyStyle}>{children}</div>
    </section>
  )
}

const cardStyle: React.CSSProperties = { display: 'grid', gap: 16, padding: 18, borderRadius: 24, border: '1px solid #dbe4ef', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const descriptionStyle: React.CSSProperties = { margin: '6px 0 0', color: '#475569', lineHeight: 1.65, fontWeight: 600 }
const actionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10 }
const bodyStyle: React.CSSProperties = { display: 'grid', gap: 16 }

