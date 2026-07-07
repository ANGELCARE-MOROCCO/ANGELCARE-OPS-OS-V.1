'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionsToolbar from './Angelcare360AdmissionsToolbar'
import Angelcare360AdmissionsTable from './Angelcare360AdmissionsTable'
import Angelcare360AdmissionsAuditDrawer from './Angelcare360AdmissionsAuditDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdmissionsAuditWorkspaceProps = {
  contextRow: ReactNode
  title: string
  subtitle: string
  events: Angelcare360AuditRecord[]
}

export default function Angelcare360AdmissionsAuditWorkspace({ contextRow, title, subtitle, events }: Angelcare360AdmissionsAuditWorkspaceProps) {
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [selectedEvent, setSelectedEvent] = useState<Angelcare360AuditRecord | null>(null)

  const filteredEvents = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch = !normalized || [event.actor_role, event.module, event.action, event.entity_type, event.entity_id, event.request_id, event.severity].some((value) => String(value || '').toLowerCase().includes(normalized))
      const matchesSeverity = !filterState.severity || String(event.severity) === filterState.severity
      const matchesModule = !filterState.module || String(event.module) === filterState.module
      const matchesAction = !filterState.action || String(event.action) === filterState.action
      return matchesSearch && matchesSeverity && matchesModule && matchesAction
    })
  }, [events, filterState.action, filterState.module, filterState.severity, search])

  const moduleOptions = useMemo(() => {
    return Array.from(new Set(events.map((event) => String(event.module || '')).filter(Boolean))).map((value) => ({ label: value, value }))
  }, [events])

  const actionOptions = useMemo(() => {
    return Array.from(new Set(events.map((event) => String(event.action || '')).filter(Boolean))).map((value) => ({ label: value, value }))
  }, [events])

  return (
    <Angelcare360AdmissionsPageShell
      title={title}
      subtitle={subtitle}
      badge="Audit"
      statusLabel={`${filteredEvents.length} événement(s)`}
      contextRow={contextRow}
      secondaryActions={(
        <button
          type="button"
          disabled
          title="L’export de l’audit sera activé lorsqu’un export contrôlé aura été branché."
          style={disabledButtonStyle}
        >
          Exporter
        </button>
      )}
    >
      <Angelcare360AdmissionsToolbar
        search={search}
        onSearchChange={setSearch}
        filters={[
          {
            definition: {
              name: 'severity',
              label: 'Gravité',
              options: [
                { label: 'Info', value: 'info' },
                { label: 'Alerte', value: 'warning' },
                { label: 'Critique', value: 'critical' },
              ],
            },
            value: filterState.severity || '',
            onChange: (value: string) => setFilterState((current) => ({ ...current, severity: value })),
          },
          {
            definition: {
              name: 'module',
              label: 'Module',
              options: moduleOptions,
            },
            value: filterState.module || '',
            onChange: (value: string) => setFilterState((current) => ({ ...current, module: value })),
          },
          {
            definition: {
              name: 'action',
              label: 'Action',
              options: actionOptions,
            },
            value: filterState.action || '',
            onChange: (value: string) => setFilterState((current) => ({ ...current, action: value })),
          },
        ]}
        primaryActionLabel="Réinitialiser"
        onPrimaryAction={() => {
          setSearch('')
          setFilterState({})
        }}
        trailing={<div style={hintStyle}>Les mutations critiques admissions sont historisées côté serveur.</div>}
      />

      <Angelcare360AdmissionsTable
        columns={[
          { key: 'created_at', label: 'Date', kind: 'datetime' },
          { key: 'actor_role', label: 'Acteur' },
          { key: 'module', label: 'Module' },
          { key: 'action', label: 'Action' },
          { key: 'entity_type', label: 'Entité' },
          { key: 'severity', label: 'Gravité', kind: 'status' },
          { key: 'request_id', label: 'Requête' },
        ]}
        rows={filteredEvents as unknown as Array<Record<string, unknown>>}
        actions={[{ key: 'view', label: 'Détail', kind: 'secondary' }]}
        onRowAction={(_, row) => setSelectedEvent(row as unknown as Angelcare360AuditRecord)}
        emptyFallback={
          <Angelcare360EmptyState
            title="Aucun événement d’audit"
            description="Aucune mutation admissions n’a encore été enregistrée dans cette fenêtre."
          />
        }
      />

      <Angelcare360AdmissionsAuditDrawer
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </Angelcare360AdmissionsPageShell>
  )
}

const hintStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 650,
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
