'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type {
  Angelcare360AdmissionsEntityConfig,
  Angelcare360AdmissionsFilterDefinition,
  Angelcare360AdmissionsRowActionDefinition,
} from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionsToolbar from './Angelcare360AdmissionsToolbar'
import Angelcare360AdmissionsTable from './Angelcare360AdmissionsTable'
import Angelcare360AdmissionsEntityDrawer from './Angelcare360AdmissionsEntityDrawer'
import Angelcare360AdmissionsStatusChangeDrawer from './Angelcare360AdmissionsStatusChangeDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdmissionsListWorkspaceProps = {
  config: Angelcare360AdmissionsEntityConfig
  rows: Array<Record<string, unknown>>
  contextRow: ReactNode
  canCreate: boolean
  canUpdate: boolean
  createDisabledReason?: string
  updateDisabledReason?: string
  extraHeaderActions?: ReactNode
  checklistAction?: {
    label: string
    onOpen: () => void
    disabledReason?: string
  }
  statusChange?: {
    entity: 'lead' | 'application'
    schoolId: string
    options: Array<{ label: string; value: string }>
    fieldKey?: string
    disabledReason?: string
  }
  statusActionLabel?: string
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map((item) => String(item)).join(' ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function matchesSearch(row: Record<string, unknown>, keys: string[], query: string) {
  if (!query) return true
  const normalized = query.toLowerCase()
  return keys.some((key) => stringify(row[key]).toLowerCase().includes(normalized))
}

function matchesFilters(row: Record<string, unknown>, filters: Array<{ definition: Angelcare360AdmissionsFilterDefinition; value: string }>) {
  return filters.every(({ definition, value }) => {
    if (!value) return true
    return stringify(row[definition.name]) === value
  })
}

export default function Angelcare360AdmissionsListWorkspace({
  config,
  rows,
  contextRow,
  canCreate,
  canUpdate,
  createDisabledReason,
  updateDisabledReason,
  extraHeaderActions,
  checklistAction,
  statusChange,
  statusActionLabel = 'Changer le statut',
}: Angelcare360AdmissionsListWorkspaceProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
  const [statusDrawerRecord, setStatusDrawerRecord] = useState<Record<string, unknown> | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSubmittingAction, startTransition] = useTransition()

  const filterEntries = useMemo(() => {
    return (config.filters || []).map((definition) => ({
      definition,
      value: filterState[definition.name] || definition.defaultValue || '',
    }))
  }, [config.filters, filterState])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const searchableKeys = config.searchableKeys || config.columns.map((column) => column.key)
      return matchesSearch(row, searchableKeys, deferredSearch) && matchesFilters(row, filterEntries)
    })
  }, [config.columns, config.searchableKeys, deferredSearch, filterEntries, rows])

  const openCreateDrawer = () => {
    setSelectedRecord(null)
    setDrawerMode('create')
  }

  const openEditDrawer = (row: Record<string, unknown>) => {
    setSelectedRecord(row)
    setDrawerMode('edit')
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setSelectedRecord(null)
  }

  const closeStatusDrawer = () => {
    setStatusDrawerRecord(null)
  }

  const submitRowAction = (action: Angelcare360AdmissionsRowActionDefinition, row: Record<string, unknown>) => {
    if (action.key === 'edit') {
      if (!canUpdate) {
        setFeedback(updateDisabledReason || 'La modification est verrouillée pour votre rôle.')
        return
      }
      openEditDrawer(row)
      return
    }

    if (action.key === 'status' && statusChange) {
      if (!canUpdate) {
        setFeedback(statusChange.disabledReason || updateDisabledReason || 'Le changement de statut est verrouillé.')
        return
      }
      setStatusDrawerRecord(row)
      return
    }

    if (action.disabledReason) {
      setFeedback(action.disabledReason)
    }
  }

  const canOpenCreate = canCreate && !config.disabledCreateReason
  const createReason = !canCreate ? createDisabledReason || 'Vous n’avez pas l’autorisation de créer un enregistrement.' : config.disabledCreateReason
  const normalizedInitialValues = useMemo(() => {
    if (!selectedRecord) return {}
    return config.fixedValues ? { ...config.fixedValues, ...selectedRecord } : selectedRecord
  }, [config.fixedValues, selectedRecord])
  const statusInitialValue = statusDrawerRecord && statusChange ? stringify(statusDrawerRecord[statusChange.fieldKey || 'status']) : ''

  return (
    <Angelcare360AdmissionsPageShell
      title={config.title}
      subtitle={config.subtitle}
      badge={config.headerBadge}
      statusLabel={feedback || (isSubmittingAction ? 'Action en cours…' : `${filteredRows.length} enregistrement(s) affiché(s)`)}
      contextRow={contextRow}
      primaryAction={
        <button
          type="button"
          onClick={openCreateDrawer}
          disabled={!canOpenCreate}
          title={createReason}
          style={!canOpenCreate ? disabledButtonStyle : primaryButtonStyle}
        >
          {config.createLabel || 'Créer'}
        </button>
      }
      secondaryActions={
        <>
          {checklistAction ? (
            <button
              type="button"
              onClick={checklistAction.onOpen}
              disabled={Boolean(checklistAction.disabledReason)}
              title={checklistAction.disabledReason}
              style={checklistAction.disabledReason ? disabledButtonStyle : ghostButtonStyle}
            >
              {checklistAction.label}
            </button>
          ) : null}
          {extraHeaderActions}
        </>
      }
    >
      <Angelcare360AdmissionsToolbar
        search={search}
        onSearchChange={setSearch}
        filters={filterEntries.map((entry) => ({
          definition: entry.definition,
          value: entry.value,
          onChange: (value: string) => setFilterState((current) => ({ ...current, [entry.definition.name]: value })),
        }))}
        primaryActionLabel={config.createLabel || 'Créer'}
        primaryActionDisabledReason={createReason}
        onPrimaryAction={canOpenCreate ? openCreateDrawer : undefined}
        secondaryActionLabel="Réinitialiser"
        onSecondaryAction={() => {
          setSearch('')
          setFilterState({})
          setFeedback(null)
        }}
        onTertiaryAction={undefined}
        trailing={undefined}
      />

      <Angelcare360AdmissionsTable
        columns={config.columns}
        rows={filteredRows}
        detailHrefKey={config.detailHrefKey || 'detail_href'}
        actions={config.rowActions?.filter((action) => {
          if (!canUpdate && action.key !== 'view') return false
          return true
        })}
        onRowAction={submitRowAction}
        emptyFallback={
          <Angelcare360EmptyState
            title={config.emptyTitle}
            description={config.emptyDescription}
          />
        }
      />

      <Angelcare360AdmissionsEntityDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer') : config.editLabel || 'Modifier'}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer()
          setFeedback('Enregistrement effectué.')
          router.refresh()
        }}
      />

      {statusChange && statusDrawerRecord ? (
        <Angelcare360AdmissionsStatusChangeDrawer
          open
          title={config.title}
          entity={statusChange.entity}
          id={String(statusDrawerRecord.id || '')}
          schoolId={statusChange.schoolId}
          currentStatus={statusInitialValue || 'new'}
          options={statusChange.options}
          disabledReason={statusChange.disabledReason}
          onClose={closeStatusDrawer}
          onSaved={() => {
            closeStatusDrawer()
            setFeedback('Statut mis à jour.')
            router.refresh()
          }}
        />
      ) : null}
    </Angelcare360AdmissionsPageShell>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const ghostButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
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

