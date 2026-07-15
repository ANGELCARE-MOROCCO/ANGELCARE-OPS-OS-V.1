'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import Angelcare360AdminPageShell from './Angelcare360AdminPageShell'
import Angelcare360AdminToolbar from './Angelcare360AdminToolbar'
import Angelcare360AdminTable from './Angelcare360AdminTable'
import Angelcare360AuditEventDrawer from './Angelcare360AuditEventDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdminAuditExplorerProps = {
  title: string
  subtitle: string
  badge?: string
  contextRow: ReactNode
  events: Angelcare360AuditRecord[]
  moduleOptions: Array<{ label: string; value: string }>
  actionOptions: Array<{ label: string; value: string }>
  severityOptions: Array<{ label: string; value: string }>
  disabledExportReason?: string
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function Angelcare360AdminAuditExplorer({
  title,
  subtitle,
  badge,
  contextRow,
  events,
  moduleOptions,
  actionOptions,
  severityOptions,
  disabledExportReason,
}: Angelcare360AdminAuditExplorerProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const searchMatch = !deferredSearch
        || [event.actor_role, event.entity_type, event.entity_id, event.request_id, event.module, event.action]
          .filter(Boolean)
          .some((value) => stringify(value).toLowerCase().includes(deferredSearch.toLowerCase()))
      const moduleMatch = !filters.module || event.module === filters.module
      const actionMatch = !filters.action || event.action === filters.action
      const severityMatch = !filters.severity || event.severity === filters.severity
      return searchMatch && moduleMatch && actionMatch && severityMatch
    })
  }, [deferredSearch, events, filters.action, filters.module, filters.severity])

  const selectedEvent = visibleEvents.find((event) => event.id === selectedEventId) || events.find((event) => event.id === selectedEventId) || null

  return (
    <Angelcare360AdminPageShell
      title={title}
      subtitle={subtitle}
      badge={badge}
      statusLabel={message || `${visibleEvents.length} événement(s) affiché(s)`}
      contextRow={contextRow}
      secondaryActions={(
        <button
          type="button"
          disabled
          title={disabledExportReason || 'L’export des journaux reste verrouillé jusqu’à la configuration requise.'}
          style={disabledButtonStyle}
        >
          Exporter
        </button>
      )}
    >
      <Angelcare360AdminToolbar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            definition: { name: 'module', label: 'Module', options: moduleOptions },
            value: filters.module || '',
            onChange: (value) => setFilters((current) => ({ ...current, module: value })),
          },
          {
            definition: { name: 'action', label: 'Action', options: actionOptions },
            value: filters.action || '',
            onChange: (value) => setFilters((current) => ({ ...current, action: value })),
          },
          {
            definition: { name: 'severity', label: 'Sévérité', options: severityOptions },
            value: filters.severity || '',
            onChange: (value) => setFilters((current) => ({ ...current, severity: value })),
          },
        ]}
        secondaryActionLabel="Réinitialiser"
        onSecondaryAction={() => {
          setSearch('')
          setFilters({})
          setMessage(null)
          router.refresh()
        }}
        onReset={() => {
          setSearch('')
          setFilters({})
          setMessage(null)
        }}
      />

      <Angelcare360AdminTable
        columns={[
          { key: 'created_at', label: 'Date', kind: 'datetime' },
          { key: 'actor_role', label: 'Acteur' },
          { key: 'module', label: 'Module' },
          { key: 'action', label: 'Action' },
          { key: 'entity_type', label: 'Entité' },
          { key: 'severity', label: 'Sévérité', kind: 'status' },
          { key: 'request_id', label: 'Requête' },
        ]}
        rows={visibleEvents as unknown as Array<Record<string, unknown>>}
        actions={[{ key: 'view', label: 'Voir', kind: 'secondary' }]}
        onRowAction={(_, row) => {
          setSelectedEventId(String(row.id))
        }}
        emptyFallback={
          <Angelcare360EmptyState
            title="Aucun événement d’audit"
            description="Les opérations administratives et événements critiques apparaîtront ici."
          />
        }
      />

      <Angelcare360AuditEventDrawer open={Boolean(selectedEvent)} event={selectedEvent} onClose={() => setSelectedEventId(null)} />
    </Angelcare360AdminPageShell>
  )
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}
