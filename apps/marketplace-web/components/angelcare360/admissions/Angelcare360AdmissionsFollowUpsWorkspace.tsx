'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Angelcare360AdmissionsAuditFilter } from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionsToolbar from './Angelcare360AdmissionsToolbar'
import Angelcare360AdmissionsNextActionDrawer from './Angelcare360AdmissionsNextActionDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdmissionFollowUpRecord = {
  id: string
  kind: 'lead' | 'application'
  title: string
  subtitle?: string | null
  next_action?: string | null
  next_action_at?: string | null
  responsible_staff_name?: string | null
  status?: string | null
  detail_href: string
}

type Angelcare360AdmissionsFollowUpsWorkspaceProps = {
  contextRow: ReactNode
  title: string
  subtitle: string
  items: Angelcare360AdmissionFollowUpRecord[]
  schoolId: string
  canUpdate: boolean
  disabledReason?: string
}

export default function Angelcare360AdmissionsFollowUpsWorkspace({
  contextRow,
  title,
  subtitle,
  items,
  schoolId,
  canUpdate,
  disabledReason,
}: Angelcare360AdmissionsFollowUpsWorkspaceProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState<Angelcare360AdmissionsAuditFilter>({})
  const [selectedItem, setSelectedItem] = useState<Angelcare360AdmissionFollowUpRecord | null>(null)

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !normalized || [item.title, item.subtitle, item.next_action, item.responsible_staff_name, item.status, item.kind].some((value) => String(value || '').toLowerCase().includes(normalized))
      const matchesKind = !filterState.module || filterState.module === item.kind
      const matchesStatus = !filterState.severity || filterState.severity === item.status
      return matchesSearch && matchesKind && matchesStatus
    })
  }, [filterState.module, filterState.severity, items, query])

  const upcomingCount = filteredItems.filter((item) => Boolean(item.next_action_at)).length
  const overdueCount = filteredItems.filter((item) => item.next_action_at && new Date(item.next_action_at).getTime() < Date.now()).length

  return (
    <Angelcare360AdmissionsPageShell
      title={title}
      subtitle={subtitle}
      badge="Suivis"
      statusLabel={`${filteredItems.length} suivi(s) · ${overdueCount} en retard`}
      contextRow={contextRow}
    >
      <Angelcare360AdmissionsToolbar
        search={query}
        onSearchChange={setQuery}
        filters={[
          {
            definition: {
              name: 'module',
              label: 'Type',
              options: [
                { label: 'Demandes', value: 'lead' },
                { label: 'Dossiers', value: 'application' },
              ],
            },
            value: filterState.module || '',
            onChange: (value: string) => setFilterState((current) => ({ ...current, module: value || null })),
          },
          {
            definition: {
              name: 'severity',
              label: 'Statut',
              options: [
                { label: 'Nouvelle demande', value: 'new' },
                { label: 'Ouvert', value: 'open' },
                { label: 'Contacté', value: 'contacted' },
                { label: 'Qualifié', value: 'qualified' },
                { label: 'Dossier ouvert', value: 'application_open' },
                { label: 'En étude', value: 'in_review' },
                { label: 'Accepté', value: 'approved' },
                { label: 'Refusé', value: 'rejected' },
                { label: 'Liste d’attente', value: 'waitlisted' },
                { label: 'Converti', value: 'converted' },
                { label: 'Archivé', value: 'archived' },
              ],
            },
            value: filterState.severity || '',
            onChange: (value: string) => setFilterState((current) => ({ ...current, severity: value || null })),
          },
        ]}
        primaryActionLabel="Réinitialiser"
        onPrimaryAction={() => {
          setQuery('')
          setFilterState({})
        }}
        trailing={<div style={hintStyle}>{upcomingCount} suivi(s) planifié(s) ou daté(s).</div>}
      />

      <div style={gridStyle}>
        {filteredItems.length > 0 ? filteredItems.map((item) => {
          const isOverdue = Boolean(item.next_action_at && new Date(item.next_action_at).getTime() < Date.now())
          return (
            <article key={`${item.kind}-${item.id}`} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={cardBadgeStyle}>{item.kind === 'lead' ? 'Demande' : 'Dossier'}</div>
                  <h3 style={cardTitleStyle}>{item.title}</h3>
                  <p style={cardSubtitleStyle}>{item.subtitle || 'Aucun sous-titre'}</p>
                </div>
                <div style={isOverdue ? overduePillStyle : pillStyle}>
                  {isOverdue ? 'En retard' : item.next_action_at ? 'Planifié' : 'Sans échéance'}
                </div>
              </div>
              <div style={cardMetaGridStyle}>
                <div style={metaItemStyle}>
                  <span style={metaLabelStyle}>Prochaine action</span>
                  <div style={metaValueStyle}>{item.next_action || '—'}</div>
                </div>
                <div style={metaItemStyle}>
                  <span style={metaLabelStyle}>Échéance</span>
                  <div style={metaValueStyle}>{item.next_action_at ? new Date(item.next_action_at).toLocaleString('fr-FR') : '—'}</div>
                </div>
                <div style={metaItemStyle}>
                  <span style={metaLabelStyle}>Responsable</span>
                  <div style={metaValueStyle}>{item.responsible_staff_name || '—'}</div>
                </div>
              </div>
              <div style={actionRowStyle}>
                <a href={item.detail_href} style={linkStyle}>Ouvrir le dossier</a>
                <button
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  disabled={!canUpdate}
                  title={canUpdate ? 'Mettre à jour la prochaine action.' : disabledReason}
                  style={!canUpdate ? disabledButtonStyle : actionButtonStyle}
                >
                  Mettre à jour le suivi
                </button>
              </div>
            </article>
          )
        }) : (
          <Angelcare360EmptyState
            title="Aucun suivi"
            description="Aucune prochaine action n’est planifiée pour le moment."
          />
        )}
      </div>

      {selectedItem ? (
        <Angelcare360AdmissionsNextActionDrawer
          open
          title={selectedItem.title}
          entity={selectedItem.kind}
          id={selectedItem.id}
          schoolId={schoolId}
          currentNextAction={selectedItem.next_action || ''}
          currentNextActionAt={selectedItem.next_action_at || ''}
          currentResponsibleStaffId={null}
          onClose={() => setSelectedItem(null)}
          onSaved={() => {
            setSelectedItem(null)
            router.refresh()
          }}
          disabledReason={!canUpdate ? disabledReason : undefined}
        />
      ) : null}
    </Angelcare360AdmissionsPageShell>
  )
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const cardStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
  display: 'grid',
  gap: 14,
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'start',
}

const cardBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  padding: '4px 8px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
}

const cardTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const cardSubtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#475569',
  lineHeight: 1.55,
  fontWeight: 600,
}

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 900,
}

const overduePillStyle: React.CSSProperties = {
  ...pillStyle,
  background: '#fef2f2',
  color: '#b91c1c',
}

const cardMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
}

const metaItemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
}

const metaLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 900,
}

const metaValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 750,
  lineHeight: 1.45,
}

const actionRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 14px',
  fontWeight: 800,
}

const actionButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 800,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 800,
  cursor: 'not-allowed',
}

const hintStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 650,
}
