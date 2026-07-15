
import Link from 'next/link'

export function MetricCard({ label, value, sub, icon, accent = '#0f172a' }: { label: string; value: string | number; sub?: string; icon: string; accent?: string }) {
  return <section style={metricCardStyle}><div><div style={metricLabelStyle}>{label}</div><div style={{...metricValueStyle, color: accent}}>{value}</div>{sub ? <div style={metricSubStyle}>{sub}</div> : null}</div><div style={metricIconStyle}>{icon}</div></section>
}

export function ERPPanel({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return <section style={panelStyle}><div style={panelHeadStyle}><div><h2 style={panelTitleStyle}>{title}</h2>{subtitle ? <p style={panelSubStyle}>{subtitle}</p> : null}</div>{right}</div>{children}</section>
}

export function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate' }) {
  const m = { blue:['#e0f2fe','#075985','#bae6fd'], green:['#dcfce7','#166534','#bbf7d0'], red:['#fee2e2','#991b1b','#fecaca'], amber:['#fef3c7','#92400e','#fde68a'], purple:['#ede9fe','#6d28d9','#ddd6fe'], slate:['#f1f5f9','#475569','#cbd5e1'] } as const
  const c = m[tone]
  return <span style={{display:'inline-flex',alignItems:'center',padding:'7px 10px',borderRadius:999,background:c[0],color:c[1],border:`1px solid ${c[2]}`,fontSize:12,fontWeight:900}}>{children}</span>
}

export function ModuleCard({ href, icon, title, text, badge }: { href: string; icon: string; title: string; text: string; badge?: string }) {
  return <Link href={href} style={moduleCardStyle}><div style={moduleIconStyle}>{icon}</div><div><div style={moduleTitleStyle}>{title}</div><div style={moduleTextStyle}>{text}</div>{badge ? <div style={{marginTop:10}}><StatusPill tone="purple">{badge}</StatusPill></div> : null}</div></Link>
}

const metricCardStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:16, alignItems:'flex-start', background:'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', border:'1px solid #dbe3ee', borderRadius:22, padding:18, boxShadow:'0 16px 34px rgba(15,23,42,.06)' }
const metricLabelStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:850, marginBottom:8 }
const metricValueStyle: React.CSSProperties = { fontSize:34, lineHeight:1, fontWeight:950, letterSpacing:-1 }
const metricSubStyle: React.CSSProperties = { color:'#475569', fontSize:13, fontWeight:650, marginTop:9, lineHeight:1.5 }
const metricIconStyle: React.CSSProperties = { width:54, height:54, display:'grid', placeItems:'center', borderRadius:18, border:'1px solid #e2e8f0', background:'#fff', fontSize:25 }
const panelStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:24, padding:22, boxShadow:'0 18px 38px rgba(15,23,42,.06)' }
const panelHeadStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:18, flexWrap:'wrap', marginBottom:16 }
const panelTitleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:24, fontWeight:950, letterSpacing:-.5 }
const panelSubStyle: React.CSSProperties = { margin:'7px 0 0', color:'#64748b', fontSize:13, fontWeight:650, lineHeight:1.55 }
const moduleCardStyle: React.CSSProperties = { display:'flex', gap:14, alignItems:'flex-start', border:'1px solid #dbe3ee', borderRadius:20, background:'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', padding:18, textDecoration:'none', boxShadow:'0 12px 28px rgba(15,23,42,.05)' }
const moduleIconStyle: React.CSSProperties = { width:50, height:50, display:'grid', placeItems:'center', borderRadius:16, background:'#eef2ff', border:'1px solid #c7d2fe', fontSize:24 }
const moduleTitleStyle: React.CSSProperties = { color:'#0f172a', fontSize:16, fontWeight:950, marginBottom:7 }
const moduleTextStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:650, lineHeight:1.55 }
