'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { Angelcare360AdmissionApplicationListRecord, Angelcare360AdmissionConversionChecklistItem } from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionConversionChecklist from './Angelcare360AdmissionConversionChecklist'
import Angelcare360AdmissionConversionPanel from './Angelcare360AdmissionConversionPanel'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360AdmissionsConversionWorkspaceProps = {
  contextRow: ReactNode
  title: string
  subtitle: string
  applications: Array<Angelcare360AdmissionApplicationListRecord & {
    conversionChecklist?: Angelcare360AdmissionConversionChecklistItem[] | null
    capacityWarning?: string | null
    duplicatesCount?: number
  }>
  schoolId: string
  canConvert: boolean
  disabledReason?: string
}

export default function Angelcare360AdmissionsConversionWorkspace({
  contextRow,
  title,
  subtitle,
  applications,
  schoolId,
  canConvert,
  disabledReason,
}: Angelcare360AdmissionsConversionWorkspaceProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const convertApplication = (application: Angelcare360AdmissionApplicationListRecord & { conversionChecklist?: Angelcare360AdmissionConversionChecklistItem[] | null; capacityWarning?: string | null; duplicatesCount?: number }) => {
    setPendingId(application.id)
    startTransition(async () => {
      try {
        const response = await fetch('/api/angelcare360/admissions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity: 'conversion',
            operation: 'convert',
            payload: {
              schoolId,
              applicationId: application.id,
              classId: application.class_id || application.metadata_json?.requested_class_id || null,
              sectionId: application.section_id || application.metadata_json?.requested_section_id || null,
              notes: 'Conversion depuis le cockpit Admissions.',
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'La conversion a échoué.')
        }
        setFeedback('Conversion enregistrée.')
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      } finally {
        setPendingId(null)
      }
    })
  }

  return (
    <Angelcare360AdmissionsPageShell
      title={title}
      subtitle={subtitle}
      badge="Conversion"
      statusLabel={feedback || (isPending ? 'Conversion en cours…' : `${applications.length} dossier(s) convertible(s)`)}
      contextRow={contextRow}
    >
      {applications.length > 0 ? (
        <div style={gridStyle}>
          {applications.map((application) => (
            <article key={application.id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={cardTitleStyle}>{application.application_code}</div>
                  <div style={cardSubtitleStyle}>{[application.child_first_name, application.child_last_name].filter(Boolean).join(' ') || application.lead_student_full_name || '—'}</div>
                </div>
                <span style={chipStyle}>{application.ready_for_conversion ? 'Prêt' : 'À compléter'}</span>
              </div>
              <Angelcare360AdmissionConversionChecklist
                checklist={application.conversionChecklist || []}
                duplicateCount={application.duplicatesCount || 0}
                capacityWarning={application.capacityWarning || null}
              />
              <Angelcare360AdmissionConversionPanel
                applicationId={application.id}
                readinessLabel={application.ready_for_conversion ? 'Le dossier est prêt à être converti.' : 'Le dossier nécessite encore des vérifications.'}
                canConvert={canConvert && Boolean(application.ready_for_conversion)}
                disabledReason={disabledReason || (application.ready_for_conversion ? undefined : 'La checklist de conversion n’est pas complète.')}
                onConvert={() => convertApplication(application)}
                conversionHref={undefined}
              />
              <button
                type="button"
                onClick={() => convertApplication(application)}
                disabled={!canConvert || !application.ready_for_conversion || pendingId === application.id}
                title={disabledReason || 'Conversion contrôlée côté serveur'}
                style={!canConvert || !application.ready_for_conversion || pendingId === application.id ? disabledButtonStyle : actionButtonStyle}
              >
                {pendingId === application.id ? 'Conversion…' : 'Convertir maintenant'}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Angelcare360EmptyState
          title="Aucun dossier convertible"
          description="Aucun dossier accepté et prêt à convertir n’est disponible pour le moment."
        />
      )}
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

const cardTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 950,
}

const cardSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: '#475569',
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 600,
}

const chipStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: 11,
  fontWeight: 900,
}

const actionButtonStyle: React.CSSProperties = {
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

