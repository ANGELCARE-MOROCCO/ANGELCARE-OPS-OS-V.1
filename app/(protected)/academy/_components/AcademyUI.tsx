import Link from 'next/link'
import type React from 'react'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return <section style={hero}><div><div style={eyebrow}>AngelCare Academy V5</div><h1 style={h1}>{title}</h1><p style={sub}>{subtitle}</p></div><div style={actionBox}>{actions}</div></section>
}

export function Card({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return <div style={{ ...card, borderLeft: `5px solid ${tone}` }}>{children}</div>
}

export function Kpi({ label, value, sub, tone = '#2563eb' }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return <Card tone={tone}><span style={small}>{label}</span><strong style={kpi}>{value}</strong>{sub && <small style={muted}>{sub}</small>}</Card>
}

export function ModuleGrid({ modules }: { modules: ReadonlyArray<{ title: string; href: string; desc: string }> }) {
  return <div style={grid3}>{modules.map((m) => <Link key={m.href} href={m.href} style={moduleCard}><strong>{m.title}</strong><span>{m.desc}</span><em>Open control panel →</em></Link>)}</div>
}

export function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div style={tableWrap}><table style={table}><thead><tr>{headers.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={td}>{c}</td>)}</tr>) : <tr><td colSpan={headers.length} style={td}>No records yet.</td></tr>}</tbody></table></div>
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={field}><span>{label}</span>{children}</label> }
export function Input(props: any) { return <input {...props} style={input} /> }
export function Select(props: any) { return <select {...props} style={input}>{props.children}</select> }
export function Textarea(props: any) { return <textarea {...props} style={{ ...input, minHeight: 86 }} /> }
export function Submit({ children }: { children: React.ReactNode }) { return <button style={button}>{children}</button> }
export function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) { return <span style={{ ...badge, background: `${tone}18`, borderColor: `${tone}55`, color: '#0f172a' }}>{children}</span> }
export function LinkButton({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} style={linkButton}>{children}</Link> }

export const page = { display: 'grid', gap: 18 } as React.CSSProperties
export const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 } as React.CSSProperties
export const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 } as React.CSSProperties
export const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, alignItems: 'end' } as React.CSSProperties
const hero: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, padding: 28, borderRadius: 30, background: 'radial-gradient(circle at top left,#2563eb,#020617 62%)', color: '#fff', boxShadow: '0 30px 70px rgba(2,6,23,.32)' }
const eyebrow: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.13)', fontSize: 12, fontWeight: 950, color: '#dbeafe', marginBottom: 12 }
const h1: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 1000, letterSpacing: -.7 }
const sub: React.CSSProperties = { margin: '8px 0 0', maxWidth: 760, lineHeight: 1.6, fontWeight: 800, color: 'rgba(255,255,255,.86)' }
const actionBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, boxShadow: '0 18px 36px rgba(15,23,42,.06)', color: '#0f172a' }
const small: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: .4 }
const kpi: React.CSSProperties = { display: 'block', marginTop: 8, fontSize: 32, fontWeight: 1000 }
const muted: React.CSSProperties = { display: 'block', marginTop: 6, color: '#64748b', fontWeight: 800 }
const moduleCard: React.CSSProperties = { ...card, display: 'grid', gap: 8, textDecoration: 'none' }
const tableWrap: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff', color: '#0f172a' }
const th: React.CSSProperties = { textAlign: 'left', padding: 13, background: '#f8fafc', fontSize: 12, color: '#334155', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: 13, borderTop: '1px solid #e2e8f0', verticalAlign: 'top', fontWeight: 750 }
const field: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const button: React.CSSProperties = { border: 0, borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const badge: React.CSSProperties = { display: 'inline-flex', padding: '6px 9px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 950 }
const linkButton: React.CSSProperties = { display: 'inline-flex', padding: '11px 13px', borderRadius: 14, background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none' }
