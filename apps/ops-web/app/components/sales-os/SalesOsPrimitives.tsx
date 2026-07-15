import Link from 'next/link'
import { StatusPill } from '@/app/components/erp/ERPPrimitives'
import { SalesMode, salesOsRoutes } from './SalesOsData'
export function SalesOsNav() { return <div style={navWrapStyle}>{salesOsRoutes.map((item) => <Link key={item.href} href={item.href} style={navItemStyle}><span>{item.icon}</span><strong>{item.label}</strong></Link>)}</div> }
export function SalesToolCard({ title, description, owner, depth, mode, route }: { title: string; description: string; owner: string; depth: string; mode: SalesMode; route?: string }) { const body = <article style={cardStyle}><div style={cardTopStyle}><h3 style={cardTitleStyle}>{title}</h3><StatusPill tone={mode === 'Closing' ? 'green' : mode === 'Manager' ? 'purple' : mode === 'Fulfillment' ? 'amber' : mode === 'Control' ? 'red' : 'blue'}>{mode}</StatusPill></div><p style={cardTextStyle}>{description}</p><div style={metaGridStyle}><span><b>Owner</b><br />{owner}</span><span><b>Depth</b><br />{depth}</span></div></article>; return route ? <Link href={route} style={{ textDecoration: 'none' }}>{body}</Link> : body }
export function ExecutionLane({ title, items }: { title: string; items: string[] }) { const safeItems = items.length ? items : ['No live records yet']; return <section style={laneStyle}><h3 style={laneTitleStyle}>{title}</h3><div style={{ display: 'grid', gap: 10 }}>{safeItems.map((item) => <div key={item} style={laneItemStyle}>{item}</div>)}</div></section> }
const navWrapStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12, marginBottom: 18 }
const navItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, padding: '14px 16px', borderRadius: 18, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', color: '#0f172a', textDecoration: 'none', boxShadow: '0 12px 28px rgba(15,23,42,.05)' }
const cardStyle: React.CSSProperties = { display: 'grid', gap: 12, minHeight: 210, padding: 18, borderRadius: 22, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', boxShadow: '0 16px 34px rgba(15,23,42,.06)' }
const cardTopStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }
const cardTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 950, letterSpacing: -.3 }
const cardTextStyle: React.CSSProperties = { margin: 0, color: '#475569', fontSize: 13, fontWeight: 650, lineHeight: 1.65 }
const metaGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 'auto', color: '#334155', fontSize: 12, fontWeight: 750 }
const laneStyle: React.CSSProperties = { padding: 16, borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: 260 }
const laneTitleStyle: React.CSSProperties = { margin: '0 0 12px', color: '#0f172a', fontSize: 16, fontWeight: 950 }
const laneItemStyle: React.CSSProperties = { padding: 12, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', color: '#334155', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }

export function SalesPageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main style={salesShellStyle}>
    <section style={salesHeroStyle}>
      <div>
        <p style={salesKickerStyle}>Sales OS</p>
        <h1 style={salesTitleStyle}>{title}</h1>
        <p style={salesSubtitleStyle}>{subtitle}</p>
      </div>
      <Link href="/sales" style={salesBackStyle}>Back to Sales</Link>
    </section>
    <SalesOsNav />
    <div style={salesContentStyle}>{children}</div>
  </main>
}

export function ControlPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={controlPanelStyle}><h3 style={laneTitleStyle}>{title}</h3>{children}</section>
}

export function MetricTile({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return <article style={metricTileStyle}><span style={metricLabelStyle}>{label}</span><strong style={metricValueStyle}>{value}</strong>{note ? <small style={metricNoteStyle}>{note}</small> : null}</article>
}

const salesShellStyle: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#eef2f7', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }
const salesHeroStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', color: '#fff', marginBottom: 18, boxShadow: '0 22px 60px rgba(15,23,42,.18)' }
const salesKickerStyle: React.CSSProperties = { margin: 0, color: '#bfdbfe', fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }
const salesTitleStyle: React.CSSProperties = { margin: '6px 0', fontSize: 32, letterSpacing: -0.8 }
const salesSubtitleStyle: React.CSSProperties = { margin: 0, color: '#dbeafe', maxWidth: 900, lineHeight: 1.6, fontWeight: 650 }
const salesBackStyle: React.CSSProperties = { padding: '11px 14px', borderRadius: 14, background: '#fff', color: '#0f172a', textDecoration: 'none', fontWeight: 950, whiteSpace: 'nowrap' }
const salesContentStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const controlPanelStyle: React.CSSProperties = { padding: 16, borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', boxShadow: '0 12px 28px rgba(15,23,42,.05)' }
const metricTileStyle: React.CSSProperties = { display: 'grid', gap: 7, minHeight: 120, padding: 16, borderRadius: 20, border: '1px solid #dbe3ee', background: 'linear-gradient(180deg,#fff,#f8fafc)', boxShadow: '0 12px 28px rgba(15,23,42,.05)' }
const metricLabelStyle: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .6 }
const metricValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 26, fontWeight: 950, lineHeight: 1.05 }
const metricNoteStyle: React.CSSProperties = { color: '#475569', fontSize: 12, fontWeight: 700, lineHeight: 1.45 }
