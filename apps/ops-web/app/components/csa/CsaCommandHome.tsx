import Link from 'next/link'
import {
  csaActionQueue,
  csaKpis,
  csaModuleSync,
  csaSignals,
  csaWorkstreams,
} from '@/lib/csa/csa-command-data'

function signalColor(signal: string) {
  if (signal === 'critical') return '#ef4444'
  if (signal === 'warning' || signal === 'high') return '#f59e0b'
  if (signal === 'medium') return '#38bdf8'
  return '#22c55e'
}

function priorityLabel(priority: string) {
  if (priority === 'critical') return 'Critical'
  if (priority === 'high') return 'High'
  if (priority === 'medium') return 'Medium'
  return 'Stable'
}

export default function CsaCommandHome() {
  return (
    <div style={pageStyle}>
      <section style={heroStyle}>
        <div style={heroGlowOneStyle} />
        <div style={heroGlowTwoStyle} />
        <div style={heroContentStyle}>
          <div style={heroLeftStyle}>
            <div style={eyebrowStyle}>AngelCare Customer Success Authority</div>
            <h1 style={heroTitleStyle}>C.S.A Command Home</h1>
            <p style={heroTextStyle}>
              Premium operational command center for family experience, lead recovery, service activation,
              revenue protection, sales synchronization, complaints, WhatsApp/call follow-up and executive escalation.
            </p>
            <div style={heroActionsStyle}>
              <Link href="/leads" style={primaryActionStyle}>Open lead recovery</Link>
              <Link href="/families" style={secondaryActionStyle}>Family cockpit</Link>
              <Link href="/services" style={secondaryActionStyle}>Service activation</Link>
              <Link href="/revenue-command-center" style={secondaryActionStyle}>Revenue risk</Link>
            </div>
          </div>
          <div style={heroPanelStyle}>
            <span style={panelTinyStyle}>CSA EXECUTION SCORE</span>
            <strong style={scoreStyle}>91%</strong>
            <div style={barStyle}><span style={{ ...barFillStyle, width: '91%' }} /></div>
            <p style={panelTextStyle}>Strong customer coverage, but 11 escalations and 37 follow-ups need closure.</p>
          </div>
        </div>
      </section>

      <section style={kpiGridStyle}>
        {csaKpis.map((kpi) => (
          <article key={kpi.label} style={kpiStyle}>
            <div style={kpiTopStyle}>
              <span style={{ ...dotStyle, background: signalColor(kpi.signal) }} />
              <span style={trendStyle}>{kpi.trend}</span>
            </div>
            <div style={kpiValueStyle}>{kpi.value}</div>
            <h3 style={kpiTitleStyle}>{kpi.label}</h3>
            <p style={kpiDetailStyle}>{kpi.detail}</p>
          </article>
        ))}
      </section>

      <section style={mainGridStyle}>
        <div style={leftStackStyle}>
          <Panel title="Today’s C.S.A Priority Board" subtitle="Client success actions synchronized with Leads, Families, Services, Sales and Revenue.">
            <div style={queueStyle}>
              {csaActionQueue.map((item, index) => (
                <div key={`${item.family}-${index}`} style={queueItemStyle}>
                  <div style={queueHeaderStyle}>
                    <div>
                      <strong style={queueFamilyStyle}>{item.family}</strong>
                      <p style={queueMetaStyle}>{item.type} · {item.source} · {item.due}</p>
                    </div>
                    <span style={{ ...priorityBadgeStyle, borderColor: signalColor(item.priority), color: signalColor(item.priority) }}>
                      {priorityLabel(item.priority)}
                    </span>
                  </div>
                  <p style={queueActionStyle}>{item.action}</p>
                  <div style={miniActionsStyle}>
                    <Link href={`/${item.source.toLowerCase() === 'revenue' ? 'revenue-command-center' : item.source.toLowerCase()}`} style={miniButtonStyle}>Open source</Link>
                    <button style={miniButtonDarkStyle}>Mark contacted</button>
                    <button style={miniButtonStyle}>Escalate</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Department Workstreams" subtitle="All C.S.A execution lanes connected to your operating modules.">
            <div style={workstreamGridStyle}>
              {csaWorkstreams.map((stream) => (
                <Link key={stream.title} href={stream.href} style={workstreamStyle}>
                  <div style={workstreamTopStyle}>
                    <span style={moduleBadgeStyle}>{stream.module}</span>
                    <span style={{ ...priorityBadgeStyle, borderColor: signalColor(stream.priority), color: signalColor(stream.priority) }}>{priorityLabel(stream.priority)}</span>
                  </div>
                  <h3 style={workstreamTitleStyle}>{stream.title}</h3>
                  <p style={workstreamTextStyle}>{stream.description}</p>
                  <div style={metricsRowStyle}>
                    {stream.metrics.map((metric) => <span key={metric} style={metricChipStyle}>{metric}</span>)}
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <aside style={rightStackStyle}>
          <Panel title="AI Suggested Actions" subtitle="Next-best-actions for client success and revenue protection.">
            <div style={signalsStyle}>
              {csaSignals.map((signal) => (
                <div key={signal.title} style={signalItemStyle}>
                  <span style={{ ...signalRailStyle, background: signalColor(signal.severity) }} />
                  <div>
                    <strong style={signalTitleStyle}>{signal.title}</strong>
                    <p style={signalTextStyle}>{signal.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Module Synchronization" subtitle="Live readiness map across connected departments.">
            <div style={syncStyle}>
              {csaModuleSync.map((item) => (
                <Link key={item.module} href={item.href} style={syncItemStyle}>
                  <div style={syncTopStyle}>
                    <strong>{item.module}</strong>
                    <span>{item.health}%</span>
                  </div>
                  <p style={syncStatusStyle}>{item.status}</p>
                  <div style={syncBarStyle}><span style={{ ...syncFillStyle, width: `${item.health}%` }} /></div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Execution" subtitle="Fast controls for daily C.S.A work.">
            <div style={quickGridStyle}>
              <Link href="/leads" style={quickButtonStyle}>Call lead</Link>
              <Link href="/families" style={quickButtonStyle}>Open family</Link>
              <Link href="/services" style={quickButtonStyle}>Activate service</Link>
              <Link href="/incidents" style={quickButtonStyle}>Log complaint</Link>
              <Link href="/sales" style={quickButtonStyle}>Sales handoff</Link>
              <Link href="/revenue-command-center" style={quickButtonStyle}>Recover revenue</Link>
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  )
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <h2 style={panelTitleStyle}>{title}</h2>
          <p style={panelSubtitleStyle}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 22 }
const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: 36, padding: 28, background: 'linear-gradient(135deg,#020617,#0f172a 48%,#082f49)', color: '#fff', boxShadow: '0 28px 80px rgba(2,6,23,.24)' }
const heroGlowOneStyle: React.CSSProperties = { position: 'absolute', width: 420, height: 420, right: -120, top: -160, borderRadius: 999, background: 'rgba(56,189,248,.22)', filter: 'blur(20px)' }
const heroGlowTwoStyle: React.CSSProperties = { position: 'absolute', width: 360, height: 360, left: -120, bottom: -180, borderRadius: 999, background: 'rgba(34,197,94,.16)', filter: 'blur(20px)' }
const heroContentStyle: React.CSSProperties = { position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'end' }
const heroLeftStyle: React.CSSProperties = { maxWidth: 900 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', fontSize: 11, fontWeight: 950, letterSpacing: 2, textTransform: 'uppercase', color: '#bae6fd' }
const heroTitleStyle: React.CSSProperties = { margin: '18px 0 10px', fontSize: 52, lineHeight: 1, letterSpacing: -2, fontWeight: 1000 }
const heroTextStyle: React.CSSProperties = { margin: 0, maxWidth: 780, color: '#cbd5e1', lineHeight: 1.8, fontWeight: 650 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }
const primaryActionStyle: React.CSSProperties = { padding: '13px 16px', borderRadius: 16, background: '#fff', color: '#020617', textDecoration: 'none', fontWeight: 950 }
const secondaryActionStyle: React.CSSProperties = { padding: '13px 16px', borderRadius: 16, background: 'rgba(255,255,255,.1)', color: '#fff', textDecoration: 'none', fontWeight: 900, border: '1px solid rgba(255,255,255,.14)' }
const heroPanelStyle: React.CSSProperties = { border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.1)', borderRadius: 28, padding: 20, backdropFilter: 'blur(10px)' }
const panelTinyStyle: React.CSSProperties = { fontSize: 11, fontWeight: 950, letterSpacing: 2, color: '#bae6fd' }
const scoreStyle: React.CSSProperties = { display: 'block', fontSize: 56, lineHeight: 1, marginTop: 10 }
const barStyle: React.CSSProperties = { height: 10, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginTop: 14 }
const barFillStyle: React.CSSProperties = { display: 'block', height: '100%', background: '#fff', borderRadius: 999 }
const panelTextStyle: React.CSSProperties = { color: '#cbd5e1', lineHeight: 1.6, marginBottom: 0 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#fff', borderRadius: 24, padding: 18, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const kpiTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const dotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, boxShadow: '0 0 18px rgba(0,0,0,.18)' }
const trendStyle: React.CSSProperties = { fontSize: 12, fontWeight: 950, color: '#64748b' }
const kpiValueStyle: React.CSSProperties = { marginTop: 18, fontSize: 26, fontWeight: 1000, color: '#0f172a' }
const kpiTitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 13, fontWeight: 950 }
const kpiDetailStyle: React.CSSProperties = { color: '#64748b', lineHeight: 1.55, fontSize: 12, fontWeight: 650, marginBottom: 0 }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }
const leftStackStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const rightStackStyle: React.CSSProperties = { display: 'grid', gap: 20, position: 'sticky', top: 178 }
const panelStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#fff', borderRadius: 28, padding: 20, boxShadow: '0 18px 44px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { marginBottom: 16 }
const panelTitleStyle: React.CSSProperties = { margin: 0, fontSize: 22, color: '#0f172a', fontWeight: 1000, letterSpacing: -.4 }
const panelSubtitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', lineHeight: 1.6, fontWeight: 650 }
const queueStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const queueItemStyle: React.CSSProperties = { border: '1px solid #e2e8f0', background: 'linear-gradient(135deg,#fff,#f8fafc)', borderRadius: 22, padding: 16 }
const queueHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 }
const queueFamilyStyle: React.CSSProperties = { color: '#0f172a', fontSize: 16 }
const queueMetaStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontSize: 12, fontWeight: 800 }
const priorityBadgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 10px', borderRadius: 999, border: '1px solid', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', whiteSpace: 'nowrap' }
const queueActionStyle: React.CSSProperties = { color: '#334155', lineHeight: 1.6, fontWeight: 750 }
const miniActionsStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const miniButtonStyle: React.CSSProperties = { border: '1px solid #dbe3ee', background: '#fff', color: '#0f172a', borderRadius: 12, padding: '9px 11px', textDecoration: 'none', fontWeight: 900, cursor: 'pointer' }
const miniButtonDarkStyle: React.CSSProperties = { ...miniButtonStyle, background: '#0f172a', color: '#fff' }
const workstreamGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const workstreamStyle: React.CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 24, padding: 17, textDecoration: 'none', color: '#0f172a', background: '#fff' }
const workstreamTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10 }
const moduleBadgeStyle: React.CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 950 }
const workstreamTitleStyle: React.CSSProperties = { margin: '16px 0 8px', fontSize: 18, fontWeight: 1000 }
const workstreamTextStyle: React.CSSProperties = { color: '#64748b', lineHeight: 1.65, fontWeight: 650 }
const metricsRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7 }
const metricChipStyle: React.CSSProperties = { borderRadius: 999, background: '#f1f5f9', padding: '7px 9px', fontSize: 11, fontWeight: 900, color: '#334155' }
const signalsStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const signalItemStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '5px 1fr', gap: 12, border: '1px solid #e2e8f0', borderRadius: 18, padding: 13, background: '#f8fafc' }
const signalRailStyle: React.CSSProperties = { borderRadius: 999 }
const signalTitleStyle: React.CSSProperties = { color: '#0f172a' }
const signalTextStyle: React.CSSProperties = { color: '#64748b', lineHeight: 1.55, margin: '5px 0 0', fontSize: 13, fontWeight: 650 }
const syncStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const syncItemStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 18, padding: 13, textDecoration: 'none', color: '#0f172a', background: '#fff' }
const syncTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontWeight: 950 }
const syncStatusStyle: React.CSSProperties = { margin: '5px 0 9px', color: '#64748b', fontSize: 12, fontWeight: 800 }
const syncBarStyle: React.CSSProperties = { height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const syncFillStyle: React.CSSProperties = { display: 'block', height: '100%', background: '#0f172a', borderRadius: 999 }
const quickGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const quickButtonStyle: React.CSSProperties = { borderRadius: 16, background: '#0f172a', color: '#fff', padding: '13px 12px', textDecoration: 'none', fontWeight: 950, textAlign: 'center' }
