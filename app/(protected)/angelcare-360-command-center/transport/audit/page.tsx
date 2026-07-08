import Link from 'next/link'
import Angelcare360TransportAuditDrawer from '@/components/angelcare360/transport/Angelcare360TransportAuditDrawer'
import Angelcare360TransportDataTable from '@/components/angelcare360/transport/Angelcare360TransportDataTable'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportAuditEvents } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportAuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const context = await getAngelcare360TransportContext()
  const filters = {
    module: toStringParam(searchParams.module),
    action: toStringParam(searchParams.action),
    severity: toStringParam(searchParams.severity),
    entityType: toStringParam(searchParams.entityType),
    entityId: toStringParam(searchParams.entityId),
    actorUserId: toStringParam(searchParams.actorUserId),
    status: toStringParam(searchParams.status),
    search: toStringParam(searchParams.search),
    from: toStringParam(searchParams.from),
    to: toStringParam(searchParams.to),
  }
  const events = await listAngelcare360TransportAuditEvents({ schoolId: context.school.id, filters })
  const selectedId = toStringParam(searchParams.selected)
  const selectedEvent = events.find((event) => event.id === selectedId) || events[0] || null

  return (
    <Angelcare360TransportPageShell
      title="Audit transport"
      subtitle="Journal des opérations, des blocages et des événements de sécurité transport."
      badge="Disponible"
      statusLabel={`${events.length} événement(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      <form method="get" style={filterStyle}>
        <Input name="search" label="Recherche" defaultValue={filters.search || ''} />
        <Input name="action" label="Action" defaultValue={filters.action || ''} />
        <Input name="entityType" label="Entité" defaultValue={filters.entityType || ''} />
        <Input name="severity" label="Gravité" defaultValue={filters.severity || ''} />
        <Input name="status" label="Statut" defaultValue={filters.status || ''} />
        <Input name="from" label="Du" defaultValue={filters.from || ''} />
        <Input name="to" label="Au" defaultValue={filters.to || ''} />
        <button type="submit" style={submitStyle}>Filtrer</button>
      </form>

      <Angelcare360TransportDataTable
        title="Événements transport"
      description="Chaque opération critique est journalisée côté serveur."
        rows={events}
        emptyTitle="Aucun événement"
      emptyDescription="Aucune opération transport n’a encore été enregistrée."
        columns={[
          { key: 'created', label: 'Date', render: (row) => new Date(row.created_at).toLocaleString('fr-FR') },
          { key: 'module', label: 'Module', render: (row) => row.module },
          { key: 'action', label: 'Action', render: (row) => row.action },
          { key: 'entity', label: 'Entité', render: (row) => row.entity_type || '—' },
          { key: 'severity', label: 'Gravité', render: (row) => row.severity },
          { key: 'link', label: 'Détail', render: (row) => <Link href={`/angelcare-360-command-center/transport/audit?selected=${row.id}`} style={linkStyle}>Voir</Link> },
        ]}
      />

      <Angelcare360TransportAuditDrawer event={selectedEvent} />
    </Angelcare360TransportPageShell>
  )
}

function Input({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <input name={name} defaultValue={defaultValue} style={inputStyle} />
    </label>
  )
}

function toStringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

const filterStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  padding: 16,
  borderRadius: 22,
  border: '1px solid #dbe4ef',
  background: '#fff',
}

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
}

const labelStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const inputStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const submitStyle: React.CSSProperties = {
  alignSelf: 'end',
  borderRadius: 14,
  border: '1px solid #0f172a',
  background: '#0f172a',
  color: '#fff',
  padding: '10px 14px',
  fontWeight: 850,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '8px 10px',
  textDecoration: 'none',
  fontWeight: 800,
}
