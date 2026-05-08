import Link from 'next/link'
import { REVENUE_GROUPS, REVENUE_WORKSPACES } from './revenue-command-registry'

export default function RevenueCommandUnifiedLayout({ children }: { children: React.ReactNode }) {
  const highPriority = REVENUE_WORKSPACES.filter((workspace) => workspace.priority === 'critical' || workspace.priority === 'high')

  return (
    <main style={styles.shell}>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Revenue Command Center / Unified Architecture Layer</p>
          <h1 style={styles.title}>Revenue execution operating system</h1>
          <p style={styles.subtitle}>
            Stabilized navigation, workspace registry, ownership map and production guardrails across HQ, tasks, prospects, campaigns, SDR, appointments, automation, management and executive briefing.
          </p>
        </div>
        <div style={styles.metrics}>
          <div style={styles.metric}><b>{REVENUE_WORKSPACES.length}</b><span>workspaces</span></div>
          <div style={styles.metric}><b>{Object.keys(REVENUE_GROUPS).length}</b><span>groups</span></div>
          <div style={styles.metric}><b>{highPriority.length}</b><span>priority routes</span></div>
        </div>
      </section>

      <nav style={styles.nav} aria-label="Revenue Command navigation">
        {Object.entries(REVENUE_GROUPS).map(([group, meta]) => {
          const items = REVENUE_WORKSPACES.filter((workspace) => workspace.group === group)
          return (
            <div key={group} style={styles.navGroup}>
              <div style={styles.navGroupHeader}>
                <strong>{meta.label}</strong>
                <span>{items.length}</span>
              </div>
              <p style={styles.navGroupDescription}>{meta.description}</p>
              <div style={styles.links}>
                {items.map((workspace) => (
                  <Link key={workspace.href} href={workspace.href} style={styles.link}>
                    <span style={styles.linkTop}>
                      <b>{workspace.label}</b>
                      <em>{workspace.priority}</em>
                    </span>
                    <small>{workspace.productionRole}</small>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <section style={styles.guardrailBar}>
        <span>Build-safe rule: one workspace upgrade at a time</span>
        <span>Shared registry source: _shared/revenue-command-registry.ts</span>
        <span>Validation: npx tsc --noEmit + npm run build</span>
      </section>

      <div style={styles.content}>{children}</div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: { minHeight: '100vh', background: '#f5f7fb', color: '#0f172a' },
  header: { margin: '0 auto', maxWidth: 1800, padding: '24px 24px 12px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 420px', gap: 18, alignItems: 'stretch' },
  eyebrow: { margin: 0, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.16em', fontSize: 12, fontWeight: 1000 },
  title: { margin: '8px 0 8px', fontSize: 36, lineHeight: 1, fontWeight: 1000, color: '#0f172a' },
  subtitle: { margin: 0, maxWidth: 980, color: '#475569', fontSize: 15, lineHeight: 1.7, fontWeight: 700 },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 },
  metric: { border: '1px solid #dbe3ee', background: '#fff', borderRadius: 20, padding: 14, display: 'grid', gap: 5, boxShadow: '0 12px 28px rgba(15,23,42,.05)' },
  nav: { margin: '0 auto', maxWidth: 1800, padding: '8px 24px 12px', display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 },
  navGroup: { border: '1px solid #dbe3ee', borderRadius: 22, background: '#fff', padding: 12, boxShadow: '0 12px 28px rgba(15,23,42,.04)' },
  navGroupHeader: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', fontSize: 13, color: '#0f172a' },
  navGroupDescription: { margin: '6px 0 10px', color: '#64748b', fontSize: 11, lineHeight: 1.4, fontWeight: 700 },
  links: { display: 'grid', gap: 7 },
  link: { border: '1px solid #e2e8f0', borderRadius: 14, padding: 9, textDecoration: 'none', color: '#0f172a', background: '#f8fafc', display: 'grid', gap: 4 },
  linkTop: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', fontSize: 12 },
  guardrailBar: { margin: '0 auto 10px', maxWidth: 1800, display: 'flex', gap: 10, flexWrap: 'wrap', padding: '0 24px', color: '#334155', fontSize: 12, fontWeight: 900 },
  content: { maxWidth: 1900, margin: '0 auto' },
}
