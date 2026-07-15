'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type {
  Angelcare360AdminEntityConfig,
  Angelcare360AdminFilterDefinition,
  Angelcare360AdminRowActionDefinition,
  Angelcare360AdministrationOverview,
} from '@/types/angelcare360/administration'
import Angelcare360AdminPageShell from './Angelcare360AdminPageShell'
import Angelcare360AdminToolbar from './Angelcare360AdminToolbar'
import Angelcare360AdminTable from './Angelcare360AdminTable'
import Angelcare360EntityDrawer from './Angelcare360EntityDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdministrationEntityScreenProps = {
  config: Angelcare360AdminEntityConfig
  rows: Array<Record<string, unknown>>
  overview: Angelcare360AdministrationOverview
  contextRow: ReactNode
  canCreate: boolean
  canUpdate: boolean
  createDisabledReason?: string
  updateDisabledReason?: string
  extraHeaderActions?: ReactNode
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

function matchesFilters(row: Record<string, unknown>, filters: Array<{ definition: Angelcare360AdminFilterDefinition; value: string }>) {
  return filters.every(({ definition, value }) => {
    if (!value) return true
    return stringify(row[definition.name]) === value
  })
}

export default function Angelcare360AdministrationEntityScreen({
  config,
  rows,
  overview,
  contextRow,
  canCreate,
  canUpdate,
  createDisabledReason,
  updateDisabledReason,
  extraHeaderActions,
}: Angelcare360AdministrationEntityScreenProps) {
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

  const submitRowAction = (action: Angelcare360AdminRowActionDefinition, row: Record<string, unknown>) => {
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
        const payload = {
          entity: config.resource,
          operation: action.operation || action.key,
          id: String(row.id || ''),
          payload: {
            ...row,
            [action.key === 'status' ? 'status' : action.key]: action.value || row[action.key] || null,
          },
        }

        const response = await fetch('/api/angelcare360/administration', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
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

  return (
    <Angelcare360AdminPageShell
      title={config.title}
      subtitle={config.subtitle}
      badge={config.headerBadge}
      statusLabel={feedback || `${filteredRows.length} enregistrement(s) affiché(s)`}
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
      secondaryActions={extraHeaderActions}
    >
      <Angelcare360AdminToolbar
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
        onReset={() => {
          setSearch('')
          setFilterState({})
          setFeedback(null)
        }}
      />

      <Angelcare360AdminTable
        columns={config.columns}
        rows={filteredRows}
        actions={config.rowActions?.filter((action) => {
          if (!canUpdate && action.key !== 'view') return false
          return true
        })}
        onRowAction={submitRowAction}
        emptyFallback={
          <Angelcare360EmptyState
            title={config.emptyTitle}
            description={config.emptyDescription}
            actionLabel={canOpenCreate ? config.createLabel || 'Créer' : undefined}
            actionHref="/angelcare-360-command-center/administration"
          />
        }
      />

      <Angelcare360EntityDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={config}
        initialValues={selectedRecord || {}}
        title={drawerMode === 'create' ? (config.createLabel || 'Créer') : config.editLabel || 'Modifier'}
        onClose={closeDrawer}
        onSaved={() => {
          closeDrawer()
          setFeedback('Enregistrement effectué avec succès.')
          router.refresh()
        }}
      />

      {isSubmittingAction ? <div style={subtleStateStyle}>Traitement de l’action en cours…</div> : null}
    </Angelcare360AdminPageShell>
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

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '11px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const subtleStateStyle: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  padding: 12,
  color: '#475569',
  fontSize: 13,
  fontWeight: 600,
}
