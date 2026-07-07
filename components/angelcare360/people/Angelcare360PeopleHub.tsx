'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFilterDefinition,
  Angelcare360PeopleRowActionDefinition,
} from '@/types/angelcare360/people'
import Angelcare360PeoplePageShell from './Angelcare360PeoplePageShell'
import Angelcare360PeopleToolbar from './Angelcare360PeopleToolbar'
import Angelcare360PeopleTable from './Angelcare360PeopleTable'
import Angelcare360PeopleDrawer from './Angelcare360PeopleDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360PeopleHubProps = {
  config: Angelcare360PeopleEntityConfig
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

function matchesFilters(row: Record<string, unknown>, filters: Array<{ definition: Angelcare360PeopleFilterDefinition; value: string }>) {
  return filters.every(({ definition, value }) => {
    if (!value) return true
    return stringify(row[definition.name]) === value
  })
}

function normalizeRowPayload(row: Record<string, unknown>) {
  return {
    ...row,
    schoolId: row.schoolId || row.school_id || null,
    academicYearId: row.academicYearId || row.academic_year_id || null,
    studentId: row.studentId || row.student_id || null,
    parentId: row.parentId || row.parent_id || null,
    staffId: row.staffId || row.staff_id || null,
    classId: row.classId || row.class_id || null,
    sectionId: row.sectionId || row.section_id || null,
    subjectId: row.subjectId || row.subject_id || null,
    documentableId: row.documentableId || row.documentable_id || null,
    contactableId: row.contactableId || row.contactable_id || null,
  }
}

function getRowKey(row: Record<string, unknown>) {
  return String(row.id || row.code || row.student_code || row.parent_code || row.staff_code || row.document_code || JSON.stringify(row))
}

export default function Angelcare360PeopleHub({
  config,
  rows,
  contextRow,
  canCreate,
  canUpdate,
  createDisabledReason,
  updateDisabledReason,
  extraHeaderActions,
  checklistAction,
}: Angelcare360PeopleHubProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null)
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

  const submitRowAction = (action: Angelcare360PeopleRowActionDefinition, row: Record<string, unknown>) => {
    if (action.key === 'edit') {
      if (!canUpdate) {
        setFeedback(updateDisabledReason || 'La modification est verrouillée pour votre rôle.')
        return
      }
      openEditDrawer(row)
      return
    }

    if (action.disabledReason) {
      setFeedback(action.disabledReason)
      return
    }

    startTransition(async () => {
      try {
        const normalizedRow = normalizeRowPayload(row)
        const response = await fetch('/api/angelcare360/people', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            entity: config.resource,
            operation: action.operation || action.key,
            id: String(normalizedRow.id || ''),
            payload: {
              ...normalizedRow,
              [action.key === 'status' ? 'status' : action.key]: action.value || row[action.key] || null,
            },
          }),
          credentials: 'same-origin',
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'L’action a échoué.')
        }
        setFeedback(result.message || 'Action exécutée avec succès.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const canOpenCreate = canCreate && !config.disabledCreateReason
  const createReason = !canCreate ? createDisabledReason || 'Vous n’avez pas l’autorisation de créer un enregistrement.' : config.disabledCreateReason
  const normalizedInitialValues = useMemo(() => {
    if (!selectedRecord) return {}
    return config.normalizeInitialValues ? config.normalizeInitialValues(selectedRecord) : selectedRecord
  }, [config, selectedRecord])

  return (
    <Angelcare360PeoplePageShell
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
      <Angelcare360PeopleToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={config.searchPlaceholder}
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
        onReset={() => {
          setSearch('')
          setFilterState({})
          setFeedback(null)
        }}
      />

      <Angelcare360PeopleTable
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

      <Angelcare360PeopleDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={normalizedInitialValues}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer') : config.editLabel || 'Modifier'}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer()
          setFeedback('Enregistrement effectué avec succès.')
          router.refresh()
        }}
      />
    </Angelcare360PeoplePageShell>
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
