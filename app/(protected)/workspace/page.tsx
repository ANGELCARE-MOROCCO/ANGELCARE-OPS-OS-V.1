import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import { getWorkspaceGroupsForUser } from '@/lib/workspace/workspace-modules'
import WorkspaceMegaMenuClient from './WorkspaceMegaMenuClient'

export const dynamic = 'force-dynamic'

function text(value: unknown) {
  return String(value || '').trim()
}

function workspaceDisplayName(user: any) {
  const explicit = [text(user?.first_name), text(user?.last_name)].filter(Boolean).join(' ')
  if (explicit) return explicit

  return (
    text(user?.full_name) ||
    text(user?.display_name) ||
    text(user?.name) ||
    text(user?.username) ||
    text(user?.email) ||
    'System User'
  )
}

export default async function WorkspacePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const groups = getWorkspaceGroupsForUser(user)

  return (
    <WorkspaceMegaMenuClient
      displayName={workspaceDisplayName(user)}
      groups={groups}
    />
  )
}


<section style={{
  marginTop: 24,
  padding: 24,
  border: '1px solid #e5e7eb',
  borderRadius: 30,
  background: 'radial-gradient(circle at top right, rgba(37,99,235,.10), transparent 34%), linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  boxShadow: '0 24px 70px rgba(15,23,42,.08)'
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
    <div>
      <span style={{
        display: 'inline-flex',
        padding: '8px 12px',
        borderRadius: 999,
        background: '#eff6ff',
        color: '#2563eb',
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: '.12em',
        textTransform: 'uppercase'
      }}>
        Business Development
      </span>
      <h2 style={{
        margin: '14px 0 8px',
        color: '#0f172a',
        fontSize: 'clamp(30px, 4vw, 52px)',
        lineHeight: .95,
        letterSpacing: '-.055em',
        fontWeight: 950
      }}>
        B2B Partnerships Command Center
      </h2>
      <p style={{ margin: 0, maxWidth: 820, color: '#64748b', fontSize: 15, lineHeight: 1.65 }}>
        Pilotez les partenariats ANGELCARE avec hôtels, resorts, cliniques pédiatriques,
        pédiatres et centres de développement de l’enfant depuis un espace CRM/ERP complet.
      </p>
    </div>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Link href="/b2b-partnerships" style={{
        minHeight: 46,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        borderRadius: 15,
        fontSize: 13,
        fontWeight: 900,
        textDecoration: 'none',
        color: '#ffffff',
        background: '#0f172a',
        boxShadow: '0 14px 30px rgba(15,23,42,.22)'
      }}>
        Ouvrir B2B Partnerships
      </Link>
      <Link href="/b2b-partnerships/prospects" style={{
        minHeight: 46,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        borderRadius: 15,
        fontSize: 13,
        fontWeight: 900,
        textDecoration: 'none',
        color: '#0f172a',
        background: '#ffffff',
        border: '1px solid #e5e7eb'
      }}>
        Prospect Directory
      </Link>
    </div>
  </div>

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    marginTop: 22
  }}>
    {[
      ['🏢', 'Prospect CRM', 'Hôtels, cliniques, décideurs, scoring et prochaines actions.', '/b2b-partnerships/prospects'],
      ['✍️', 'Templates & Scripts', 'Emails, WhatsApp, appels et relances en français.', '/b2b-partnerships/templates'],
      ['🚀', 'Campaigns & Sequences', 'Campagnes multi-étapes, séquences et exécution commerciale.', '/b2b-partnerships/campaigns'],
      ['✅', 'Tasks & Execution', 'Tâches planifiées, relances, intern OS et supervision manager.', '/b2b-partnerships/tasks'],
    ].map(([icon, title, text, href]) => (
      <Link key={href} href={href} style={{
        padding: 18,
        border: '1px solid #e5e7eb',
        borderRadius: 22,
        background: 'rgba(255,255,255,.88)',
        textDecoration: 'none',
        color: '#0f172a'
      }}>
        <span style={{
          display: 'grid',
          placeItems: 'center',
          width: 42,
          height: 42,
          borderRadius: 15,
          background: '#f8fafc',
          border: '1px solid #e5e7eb',
          marginBottom: 12
        }}>{icon}</span>
        <strong style={{ display: 'block', fontSize: 15, fontWeight: 900 }}>{title}</strong>
        <small style={{ display: 'block', marginTop: 7, color: '#64748b', fontSize: 12, lineHeight: 1.45 }}>{text}</small>
      </Link>
    ))}
  </div>
</section>

