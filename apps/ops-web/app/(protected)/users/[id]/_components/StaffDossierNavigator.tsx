'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

type Section = { key: string; label: string; eyebrow: string; description: string; content: ReactNode; attention?: number }

export default function StaffDossierNavigator({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.key || 'overview')
  const current = useMemo(() => sections.find((section) => section.key === active) || sections[0], [active, sections])
  if (!current) return null

  return (
    <>
      <style>{`@media(max-width:1000px){.sanila-dossier-nav{} [data-dossier-responsive=two]{grid-template-columns:1fr!important}} @media(max-width:720px){[data-dossier-responsive=hero]{grid-template-columns:1fr!important}[data-dossier-responsive=quick]{grid-template-columns:1fr 1fr!important}}`}</style>
    <div style={shellStyle}>
      <nav aria-label="Espaces du dossier collaborateur" style={navStyle}>
        {sections.map((section) => {
          const selected = section.key === current.key
          return (
            <button key={section.key} type="button" onClick={() => setActive(section.key)} aria-pressed={selected}
              style={{ ...navButtonStyle, ...(selected ? navButtonActiveStyle : {}) }}>
              <span>{section.label}</span>
              {section.attention ? <span style={counterStyle}>{section.attention}</span> : null}
            </button>
          )
        })}
      </nav>

      <section style={workspaceStyle}>
        <header style={workspaceHeaderStyle}>
          <div>
            <span style={eyebrowStyle}>{current.eyebrow}</span>
            <h2 style={titleStyle}>{current.label}</h2>
            <p style={descriptionStyle}>{current.description}</p>
          </div>
          <span style={liveBadgeStyle}>DOSSIER LIVE</span>
        </header>
        <div>{current.content}</div>
      </section>
    </div>
    </>
  )
}

const shellStyle: CSSProperties = { display: 'grid', gap: 18 }
const navStyle: CSSProperties = { position: 'sticky', top: 10, zIndex: 20, display: 'flex', gap: 8, overflowX: 'auto', padding: 8, border: '1px solid #d9e5ef', borderRadius: 22, background: 'rgba(255,255,255,.96)', boxShadow: '0 14px 38px rgba(15,45,78,.09)', backdropFilter: 'blur(16px)' }
const navButtonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, padding: '0 16px', border: 0, borderRadius: 15, background: 'transparent', color: '#52677d', fontSize: 13, fontWeight: 850, whiteSpace: 'nowrap', cursor: 'pointer' }
const navButtonActiveStyle: CSSProperties = { color: '#fff', background: 'linear-gradient(135deg,#092d51,#155b91)', boxShadow: '0 10px 24px rgba(9,45,81,.2)' }
const counterStyle: CSSProperties = { display: 'grid', placeItems: 'center', minWidth: 21, height: 21, padding: '0 6px', borderRadius: 999, background: '#f59e0b', color: '#fff', fontSize: 11, fontWeight: 900 }
const workspaceStyle: CSSProperties = { padding: 'clamp(18px,2vw,30px)', border: '1px solid #dce7f1', borderRadius: 28, background: '#fff', boxShadow: '0 24px 70px rgba(15,45,78,.08)' }
const workspaceHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, paddingBottom: 20, marginBottom: 22, borderBottom: '1px solid #e6edf4' }
const eyebrowStyle: CSSProperties = { display: 'block', marginBottom: 6, color: '#1670ad', fontSize: 11, fontWeight: 950, letterSpacing: '.16em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: 0, color: '#102a43', fontSize: 'clamp(22px,2.2vw,34px)', letterSpacing: '-.04em' }
const descriptionStyle: CSSProperties = { maxWidth: 820, margin: '8px 0 0', color: '#657b90', fontSize: 14, lineHeight: 1.65 }
const liveBadgeStyle: CSSProperties = { flexShrink: 0, padding: '8px 11px', border: '1px solid #bbf7d0', borderRadius: 999, background: '#f0fdf4', color: '#15803d', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }
