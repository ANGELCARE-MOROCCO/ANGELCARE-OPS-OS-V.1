'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import type { Angelcare360PeopleEntityConfig, Angelcare360PeopleFilterDefinition } from '@/types/angelcare360/people'
import Angelcare360PeoplePageShell from './Angelcare360PeoplePageShell'
import Angelcare360PeopleToolbar from './Angelcare360PeopleToolbar'
import Angelcare360PeopleTable from './Angelcare360PeopleTable'
import Angelcare360PeopleAuditDrawer from './Angelcare360PeopleAuditDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360PeopleAuditWorkspaceProps = {
  config: Angelcare360PeopleEntityConfig
  events: Angelcare360AuditRecord[]
  contextRow: ReactNode
  exportDisabledReason?: string
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map((item) => String(item)).join(' ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function matchesSearch(event: Angelcare360AuditRecord, keys: string[], query: string) {
  if (!query) return true
  const normalized = query.toLowerCase()
  const eventRecord = event as unknown as Record<string, unknown>
  return keys.some((key) => stringify(eventRecord[key]).toLowerCase().includes(normalized))
}

function matchesFilters(event: Angelcare360AuditRecord, filters: Array<{ definition: Angelcare360PeopleFilterDefinition; value: string }>) {
  const eventRecord = event as unknown as Record<string, unknown>
  return filters.every(({ definition, value }) => {
    if (!value) return true
    return stringify(eventRecord[definition.name]) === value
  })
}

export default function Angelcare360PeopleAuditWorkspace({
  config,
  events,
  contextRow,
  exportDisabledReason,
}: Angelcare360PeopleAuditWorkspaceProps) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [selectedEvent, setSelectedEvent] = useState<Angelcare360AuditRecord | null>(null)

  const filterEntries = useMemo(() => {
    return (config.filters || []).map((definition) => ({
      definition,
      value: filterState[definition.name] || definition.defaultValue || '',
    }))
  }, [config.filters, filterState])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const searchableKeys = config.searchableKeys || config.columns.map((column) => column.key)
      return matchesSearch(event, searchableKeys, deferredSearch) && matchesFilters(event, filterEntries)
    })
  }, [config.columns, config.searchableKeys, deferredSearch, events, filterEntries])

  return (
    <Angelcare360PeoplePageShell
      title={config.title}
      subtitle={config.subtitle}
      badge={config.headerBadge}
      statusLabel={`${filteredEvents.length} événement(s) affiché(s)`}
      contextRow={contextRow}
      secondaryActions={
        <button
          type="button"
          disabled
          title={exportDisabledReason || 'L’export des audits reste verrouillé jusqu’à la configuration requise.'}
          style={disabledButtonStyle}
        >
          Exporter les événements
        </button>
      }
    >
      <Angelcare360PeopleToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={config.searchPlaceholder}
        filters={filterEntries.map((entry) => ({
          definition: entry.definition,
          value: entry.value,
          onChange: (value: string) => setFilterState((current) => ({ ...current, [entry.definition.name]: value })),
        }))}
        secondaryActionLabel="Réinitialiser"
        onSecondaryAction={() => {
          setSearch('')
          setFilterState({})
        }}
        onReset={() => {
          setSearch('')
          setFilterState({})
        }}
      />

      <Angelcare360PeopleTable
        columns={config.columns}
        rows={filteredEvents as unknown as Array<Record<string, unknown>>}
        detailHrefKey={config.detailHrefKey || 'detail_href'}
        actions={[{ key: 'view', label: 'Consulter', kind: 'secondary' }]}
        onRowAction={(_, row) => setSelectedEvent(row as unknown as Angelcare360AuditRecord)}
        emptyFallback={
          <Angelcare360EmptyState
            title={config.emptyTitle}
            description={config.emptyDescription}
          />
        }
      />

      <Angelcare360PeopleAuditDrawer
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </Angelcare360PeoplePageShell>
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
