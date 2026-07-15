'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Angelcare360AdmissionDocumentSubmissionListRecord,
  Angelcare360AdmissionRequiredDocumentListRecord,
  Angelcare360AdmissionsEntityConfig,
} from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionsToolbar from './Angelcare360AdmissionsToolbar'
import Angelcare360AdmissionsTable from './Angelcare360AdmissionsTable'
import Angelcare360AdmissionsEntityDrawer from './Angelcare360AdmissionsEntityDrawer'
import Angelcare360AdmissionsDocumentStatusDrawer from './Angelcare360AdmissionsDocumentStatusDrawer'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdmissionsDocumentsWorkspaceProps = {
  contextRow: ReactNode
  title: string
  subtitle: string
  schoolId: string
  requiredDocuments: Angelcare360AdmissionRequiredDocumentListRecord[]
  submissions: Angelcare360AdmissionDocumentSubmissionListRecord[]
  canCreate: boolean
  canUpdate: boolean
  createDisabledReason?: string
  updateDisabledReason?: string
}

function buildRequiredDocumentConfig(schoolId: string): Angelcare360AdmissionsEntityConfig {
  return {
    routeKey: 'documents',
    resource: 'required-document',
    title: 'Documents requis',
    subtitle: 'Référentiel documentaire Admissions.',
    headerBadge: 'Documents',
    listPermission: 'documents.view',
    createPermission: 'documents.create',
    updatePermission: 'documents.update',
    searchPlaceholder: 'Rechercher un document requis',
    emptyTitle: 'Aucun document requis',
    emptyDescription: 'Ajoutez les pièces attendues pour structurer le dossier admissions.',
    createLabel: 'Créer un document requis',
    editLabel: 'Modifier le document requis',
    searchableKeys: ['document_key', 'title', 'description', 'required_for_stage', 'status'],
    detailHrefKey: 'detail_href',
    fixedValues: {
      schoolId,
      status: 'active',
      sortOrder: 1,
      isRequired: true,
      requiredForStage: 'open',
    },
    columns: [
      { key: 'document_key', label: 'Clé' },
      { key: 'title', label: 'Titre' },
      { key: 'required_for_stage', label: 'Étape' },
      { key: 'sort_order', label: 'Ordre', kind: 'number' },
      { key: 'is_required', label: 'Obligatoire', kind: 'boolean' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
    ],
    fields: [
      { name: 'schoolId', label: 'Établissement', kind: 'text', required: true, readOnly: true },
      { name: 'documentKey', label: 'Clé document', kind: 'text', required: true },
      { name: 'title', label: 'Titre', kind: 'text', required: true },
      { name: 'description', label: 'Description', kind: 'textarea' },
      { name: 'requiredForStage', label: 'Étape requise', kind: 'text' },
      { name: 'sortOrder', label: 'Ordre', kind: 'number', required: true, min: 1 },
      { name: 'isRequired', label: 'Document obligatoire', kind: 'switch' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
  }
}

export default function Angelcare360AdmissionsDocumentsWorkspace({
  contextRow,
  title,
  subtitle,
  schoolId,
  requiredDocuments,
  submissions,
  canCreate,
  canUpdate,
  createDisabledReason,
  updateDisabledReason,
}: Angelcare360AdmissionsDocumentsWorkspaceProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filterState, setFilterState] = useState<Record<string, string>>({})
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [selectedRequiredDocument, setSelectedRequiredDocument] = useState<Record<string, unknown> | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, unknown> | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const requiredDocumentConfig = useMemo(() => buildRequiredDocumentConfig(schoolId), [schoolId])

  const requiredFilters = useMemo(
    () => [
      {
        name: 'status',
        label: 'Statut',
        options: [
          { label: 'Actif', value: 'active' },
          { label: 'Inactif', value: 'inactive' },
          { label: 'Archivé', value: 'archived' },
        ],
      },
      {
        name: 'verification_status',
        label: 'Vérification',
        options: [
          { label: 'En attente', value: 'pending' },
          { label: 'Complété', value: 'complete' },
          { label: 'Manquant', value: 'missing' },
          { label: 'Rejeté', value: 'rejected' },
        ],
      },
    ],
    [],
  )

  const filteredRequiredDocuments = useMemo(() => {
    const search = query.trim().toLowerCase()
    return requiredDocuments.filter((row) => {
      const matchesSearch = !search || [row.document_key, row.title, row.description, row.required_for_stage, row.status].some((value) => String(value || '').toLowerCase().includes(search))
      const matchesStatus = !filterState.status || String(row.status) === filterState.status
      const matchesVerification = !filterState.verification_status || submissions.some((submission) => String(submission.required_document_id) === String(row.id) && String(submission.verification_status) === filterState.verification_status)
      return matchesSearch && matchesStatus && matchesVerification
    })
  }, [filterState.status, filterState.verification_status, query, requiredDocuments, submissions])

  const filteredSubmissions = useMemo(() => {
    const search = query.trim().toLowerCase()
    return submissions.filter((row) => {
      const matchesSearch = !search || [row.application_code, row.required_document_title, row.required_document_key, row.linked_document_title, row.status, row.verification_status].some((value) => String(value || '').toLowerCase().includes(search))
      const matchesStatus = !filterState.verification_status || String(row.verification_status) === filterState.verification_status
      return matchesSearch && matchesStatus
    })
  }, [filterState.verification_status, query, submissions])

  const openCreateDrawer = () => {
    setSelectedRequiredDocument(null)
    setDrawerMode('create')
  }

  const openEditDrawer = (row: Record<string, unknown>) => {
    setSelectedRequiredDocument(row)
    setDrawerMode('edit')
  }

  const openSubmissionDrawer = (row: Record<string, unknown>) => {
    setSelectedSubmission(row)
  }

  return (
    <Angelcare360AdmissionsPageShell
      title={title}
      subtitle={subtitle}
      badge="Documents"
      statusLabel={feedback || `${filteredRequiredDocuments.length} document(s) requis · ${filteredSubmissions.length} soumission(s)`}
      contextRow={contextRow}
      primaryAction={
        <button
          type="button"
          onClick={openCreateDrawer}
          disabled={!canCreate}
          title={createDisabledReason}
          style={!canCreate ? disabledButtonStyle : primaryButtonStyle}
        >
          Créer un document requis
        </button>
      }
      secondaryActions={(
        <button
          type="button"
          disabled
          title="Le téléversement de fichiers sera activé après le branchement du stockage sécurisé."
          style={disabledButtonStyle}
        >
          Importer un fichier
        </button>
      )}
    >
      <Angelcare360AdmissionsToolbar
        search={query}
        onSearchChange={setQuery}
        filters={requiredFilters.map((definition) => ({
          definition,
          value: filterState[definition.name] || '',
          onChange: (value: string) => setFilterState((current) => ({ ...current, [definition.name]: value })),
        }))}
        primaryActionLabel="Créer un document requis"
        primaryActionDisabledReason={!canCreate ? createDisabledReason : undefined}
        onPrimaryAction={canCreate ? openCreateDrawer : undefined}
        secondaryActionLabel="Réinitialiser"
        onSecondaryAction={() => {
          setQuery('')
          setFilterState({})
          setFeedback(null)
        }}
        trailing={<div style={hintStyle}>La charge documentaire est suivie sans faux téléversement.</div>}
      />

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Documents requis</div>
            <div style={sectionSubtitleStyle}>Référentiel des pièces exigées pour les dossiers admissions.</div>
          </div>
          <div style={sectionCountStyle}>{filteredRequiredDocuments.length}</div>
        </div>
        <Angelcare360AdmissionsTable
          columns={requiredDocumentConfig.columns}
          rows={filteredRequiredDocuments as unknown as Array<Record<string, unknown>>}
          detailHrefKey={requiredDocumentConfig.detailHrefKey}
          actions={requiredDocumentConfig.rowActions?.filter(() => canUpdate)}
          onRowAction={(action, row) => {
            if (action.key === 'edit') {
              if (!canUpdate) {
                setFeedback(updateDisabledReason || 'La modification est verrouillée.')
                return
              }
              openEditDrawer(row)
            }
          }}
          emptyFallback={
            <Angelcare360EmptyState
              title="Aucun document requis"
              description="Ajoutez un document requis pour préparer les dossiers admissions."
            />
          }
        />
      </section>

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionTitleStyle}>Soumissions documentaires</div>
            <div style={sectionSubtitleStyle}>Statut de réception et de validation des pièces versées.</div>
          </div>
          <div style={sectionCountStyle}>{filteredSubmissions.length}</div>
        </div>
        <Angelcare360AdmissionsTable
          columns={[
            { key: 'application_code', label: 'Dossier' },
            { key: 'required_document_title', label: 'Document' },
            { key: 'linked_document_title', label: 'Fichier lié' },
            { key: 'verification_status', label: 'Vérification', kind: 'status' },
            { key: 'status', label: 'Statut', kind: 'status' },
          ]}
          rows={filteredSubmissions as unknown as Array<Record<string, unknown>>}
          detailHrefKey="detail_href"
          actions={canUpdate ? [{ key: 'status', label: 'Mettre à jour', kind: 'secondary' }] : []}
          onRowAction={(action, row) => {
            if (action.key === 'status') {
              if (!canUpdate) {
                setFeedback(updateDisabledReason || 'La modification documentaire est verrouillée.')
                return
              }
              openSubmissionDrawer(row)
            }
          }}
          emptyFallback={
            <Angelcare360EmptyState
              title="Aucune soumission"
              description="Les soumissions documentaires apparaîtront ici dès qu’un dossier est alimenté."
            />
          }
        />
      </section>

      <Angelcare360AdmissionsEntityDrawer
        open={drawerMode !== null}
        mode={drawerMode || 'create'}
        config={requiredDocumentConfig}
        initialValues={selectedRequiredDocument || {}}
        title={drawerMode === 'create' ? 'Créer un document requis' : 'Modifier un document requis'}
        onClose={() => {
          setDrawerMode(null)
          setSelectedRequiredDocument(null)
        }}
        onSaved={() => {
          setDrawerMode(null)
          setSelectedRequiredDocument(null)
          setFeedback('Document requis enregistré.')
          router.refresh()
        }}
      />

      {selectedSubmission ? (
        <Angelcare360AdmissionsDocumentStatusDrawer
          open
          title={String(selectedSubmission.required_document_title || selectedSubmission.application_code || 'Soumission documentaire')}
          applicationId={String(selectedSubmission.application_id || '')}
          requiredDocumentId={String(selectedSubmission.required_document_id || '')}
          schoolId={schoolId}
          currentStatus={String(selectedSubmission.verification_status || 'pending')}
          onClose={() => setSelectedSubmission(null)}
          onSaved={() => {
            setSelectedSubmission(null)
            setFeedback('Statut documentaire enregistré.')
            router.refresh()
          }}
          disabledReason={!canUpdate ? updateDisabledReason : undefined}
        />
      ) : null}
    </Angelcare360AdmissionsPageShell>
  )
}

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 18,
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 10,
}

const sectionTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const sectionSubtitleStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#475569',
  fontWeight: 600,
  lineHeight: 1.5,
}

const sectionCountStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const hintStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 650,
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
