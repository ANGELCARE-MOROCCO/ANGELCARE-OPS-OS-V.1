import Link from 'next/link'
import type { ReactNode } from 'react'

export function AICard({ title, mission, actions, href }: { title: string; mission: string; actions: string[]; href: string }) {
  return (
    <Link href={href} style={{ display: 'block', textDecoration: 'none', color: '#0f172a', background: 'white', border: '1px solid #dbeafe', borderRadius: 24, padding: 18, boxShadow: '0 18px 45px rgba(37,99,235,.10)' }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase' }}>AI Copilot</div>
      <h3 style={{ margin: '8px 0', fontSize: 24 }}>{title}</h3>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>{mission}</p>
      <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
        {actions.map((a) => (
          <div key={a} style={{ borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 10px', fontWeight: 700 }}>
            {a}
          </div>
        ))}
      </div>
    </Link>
  )
}

export function AIHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section style={{ borderRadius: 32, padding: 32, background: 'linear-gradient(135deg,#020617,#1e3a8a,#0f766e)', color: 'white', marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.2, color: '#bfdbfe' }}>
        OPSOS AI Layer
      </div>
      <h1 style={{ margin: '10px 0', fontSize: 42 }}>{title}</h1>
      <p style={{ color: '#dbeafe', maxWidth: 980, lineHeight: 1.7, fontWeight: 700 }}>{subtitle}</p>
    </section>
  )
}
