import Angelcare360AcademicPageShell from '@/components/angelcare360/academics/Angelcare360AcademicPageShell'
import { ANGELCARE360_ACADEMICS_NAVIGATION } from '@/data/angelcare360/academics-navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360AcademicAuditEvents } from '@/lib/angelcare360/server/academics'
import { optionValue } from '../_utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

export default async function Angelcare360AuditAcademiquePage({ searchParams }: { searchParams?: SearchParams }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const filters = {
    search: optionValue(searchParams?.q as FormDataEntryValue | null),
    module: optionValue(searchParams?.module as FormDataEntryValue | null),
    action: optionValue(searchParams?.action as FormDataEntryValue | null),
    severity: optionValue(searchParams?.severity as FormDataEntryValue | null),
    entityType: optionValue(searchParams?.entityType as FormDataEntryValue | null),
    entityId: optionValue(searchParams?.entityId as FormDataEntryValue | null),
    actorRole: optionValue(searchParams?.actorRole as FormDataEntryValue | null),
    from: optionValue(searchParams?.from as FormDataEntryValue | null),
    to: optionValue(searchParams?.to as FormDataEntryValue | null),
  }

  const events = await listAngelcare360AcademicAuditEvents({ schoolId: context.school.id, filters })

  return (
    <Angelcare360AcademicPageShell
      title="Audit académique"
      subtitle="Consultation des opérations, blocages et événements critiques du moteur académique."
      badge="Audit"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_ACADEMICS_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Filtres</div>
            <h2 style={panelTitleStyle}>Explorer le journal</h2>
          </div>
        </div>
        <form method="get" style={filterGridStyle}>
          <Input name="q" placeholder="Recherche" defaultValue={filters.search || ''} />
          <Input name="module" placeholder="Module" defaultValue={filters.module || ''} />
          <Input name="action" placeholder="Action" defaultValue={filters.action || ''} />
          <Input name="severity" placeholder="Sévérité" defaultValue={filters.severity || ''} />
          <Input name="entityType" placeholder="Entité" defaultValue={filters.entityType || ''} />
          <Input name="entityId" placeholder="ID entité" defaultValue={filters.entityId || ''} />
          <Input name="actorRole" placeholder="Rôle acteur" defaultValue={filters.actorRole || ''} />
          <Input name="from" type="date" defaultValue={filters.from || ''} />
          <Input name="to" type="date" defaultValue={filters.to || ''} />
          <button type="submit" style={primaryButtonStyle}>Appliquer</button>
        </form>
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Journal</div>
            <h2 style={panelTitleStyle}>Événements récents</h2>
          </div>
          <div style={panelMetaStyle}>{events.length} événement(s)</div>
        </div>
        {events.length === 0 ? (
          <p style={emptyTextStyle}>Aucun événement d’audit ne correspond aux filtres courants.</p>
        ) : (
          <div style={tableStyle}>
            {events.map((event) => (
              <article key={event.id} style={rowStyle}>
                <div style={rowMainStyle}>
                  <div style={rowTitleStyle}>{event.module} · {event.action}</div>
                  <div style={rowMetaStyle}>{event.entity_type || '—'} · {event.entity_id || '—'}</div>
                  <div style={rowMetaStyle}>{event.actor_role || '—'} · {event.severity || 'info'} · {event.created_at}</div>
                </div>
                <div style={rowActionsStyle}>
                  <Chip label={event.severity || 'info'} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Angelcare360AcademicPageShell>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />
}

function Chip({ label }: { label: string }) {
  return <span style={chipStyle}>{label}</span>
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const filterGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const tableStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: 14,
  borderRadius: 18,
  border: '1px solid #e2e8f0',
  background: '#fff',
}

const rowMainStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const rowTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 900,
}

const rowMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 600,
}

const rowActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 10,
}

const inputStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '11px 13px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 600,
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
}

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '11px 14px',
  fontWeight: 800,
}

const emptyTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#475569',
  fontWeight: 700,
}
