import Link from 'next/link'
import type { AuthorizedIndependentResource } from '@/lib/workspace-hub/authorized-resources'

export default function AuthorizedResourceFamilyCards({ resources }: { resources: AuthorizedIndependentResource[] }) {
  if (!resources.length) return null

  return (
    <section style={{ maxWidth: 1560, margin: '0 auto', padding: '0 24px 36px' }}>
      <div style={{ border: '1px solid #dbe5f1', borderRadius: 28, background: '#ffffff', padding: 24, boxShadow: '0 18px 48px rgba(15,23,42,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#2563eb', fontSize: 11, fontWeight: 900, letterSpacing: '.13em', textTransform: 'uppercase' }}>Independent authorized workspaces</div>
            <h2 style={{ margin: '8px 0 0', color: '#0f172a', fontSize: 24, lineHeight: 1.15 }}>Your route families and standalone pages</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 600 }}>These access cards come from the global registry, alongside your standard authorized modules.</p>
          </div>
          <span style={{ borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', padding: '8px 12px', fontSize: 12, fontWeight: 900 }}>{resources.length} available</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginTop: 20 }}>
          {resources.map((resource) => (
            <Link key={resource.resourceKey} href={resource.href} style={{ display: 'block', textDecoration: 'none', border: '1px solid #e2e8f0', borderRadius: 22, padding: 18, background: 'linear-gradient(145deg,#fff,#f8fbff)', color: '#0f172a' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 14, background: '#eaf2ff', color: '#1d4ed8', fontWeight: 950 }}>{resource.resourceType === 'route_family' ? 'RF' : 'P'}</span>
                <span style={{ borderRadius: 999, background: '#f1f5f9', color: '#475569', padding: '6px 9px', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }}>{resource.resourceType.replaceAll('_', ' ')}</span>
              </div>
              <h3 style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.25 }}>{resource.title}</h3>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>{resource.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16, color: '#475569', fontSize: 11, fontWeight: 850 }}>
                <span>{resource.childCount} linked pages</span>
                <span>Open workspace →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
