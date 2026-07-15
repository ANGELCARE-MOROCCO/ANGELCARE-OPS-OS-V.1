'use client'

import type { ReactNode } from 'react'
import Angelcare360OperatorActionDrawer, { type Angelcare360OperatorActionDescriptor } from './Angelcare360OperatorActionDrawer'

type Props = {
  title: string
  subtitle?: string
  intro?: ReactNode
  actions: Angelcare360OperatorActionDescriptor[]
}

export default function Angelcare360OperatorActionPanel({ title, subtitle, intro, actions }: Props) {
  return (
    <section style={panelStyle}>
      <div style={eyebrowStyle}>Actions opérateur</div>
      <div style={headingStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
      </div>
      {intro ? <div style={introStyle}>{intro}</div> : null}
      <Angelcare360OperatorActionDrawer title={title} subtitle={subtitle} actions={actions} />
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background:
    'linear-gradient(180deg, rgba(255,255,255,.99) 0%, rgba(248,250,252,.98) 100%)',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  padding: 20,
}

const introStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#1d4ed8',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const headingStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.6,
  fontWeight: 600,
}
