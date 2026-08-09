'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Angelcare360AdmissionsPipelineCard } from '@/types/angelcare360/admissions'
import Angelcare360AdmissionsPageShell from './Angelcare360AdmissionsPageShell'
import Angelcare360AdmissionsPipelineBoard from './Angelcare360AdmissionsPipelineBoard'
import Angelcare360AdmissionsStatusChangeDrawer from './Angelcare360AdmissionsStatusChangeDrawer'

type Angelcare360AdmissionsPipelineWorkspaceProps = {
  contextRow: ReactNode
  title: string
  subtitle: string
  cardsByStatus: Record<string, Angelcare360AdmissionsPipelineCard[]>
  schoolId: string
  canChangeStatus: boolean
  disabledReason?: string
}

const PIPELINE_COLUMNS = [
  { key: 'open', label: 'Ouverts', helpText: 'Dossiers ouverts et en attente de traitement.' },
  { key: 'in_review', label: 'En étude', helpText: 'Dossiers en évaluation.' },
  { key: 'approved', label: 'Acceptées', helpText: 'Dossiers convertibles.' },
  { key: 'waitlisted', label: 'Liste d’attente', helpText: 'Traitement différé.' },
  { key: 'rejected', label: 'Refusées', helpText: 'Dossiers fermés.' },
  { key: 'converted', label: 'Converties', helpText: 'Transférées au socle personnes.' },
  { key: 'archived', label: 'Archivées', helpText: 'Dossiers fermés et archivés.' },
]

export default function Angelcare360AdmissionsPipelineWorkspace({
  contextRow,
  title,
  subtitle,
  cardsByStatus,
  schoolId,
  canChangeStatus,
  disabledReason,
}: Angelcare360AdmissionsPipelineWorkspaceProps) {
  const router = useRouter()
  const [selectedCard, setSelectedCard] = useState<Angelcare360AdmissionsPipelineCard | null>(null)
  const statusOptions = useMemo(
    () => [
      { label: 'Ouvert', value: 'open' },
      { label: 'En étude', value: 'in_review' },
      { label: 'Acceptée', value: 'approved' },
      { label: 'Liste d’attente', value: 'waitlisted' },
      { label: 'Refusée', value: 'rejected' },
      { label: 'Convertie', value: 'converted' },
      { label: 'Archivée', value: 'archived' },
    ],
    [],
  )

  return (
    <Angelcare360AdmissionsPageShell
      title={title}
      subtitle={subtitle}
      badge="Pipeline"
      statusLabel={`${Object.values(cardsByStatus).reduce((count, current) => count + current.length, 0)} dossier(s)`}
      contextRow={contextRow}
    >
      <Angelcare360AdmissionsPipelineBoard
        columns={PIPELINE_COLUMNS}
        groups={cardsByStatus}
        canChangeStatus={canChangeStatus}
        disabledReason={disabledReason}
        onChangeStatus={(card) => setSelectedCard(card)}
      />

      {selectedCard ? (
        <Angelcare360AdmissionsStatusChangeDrawer
          open
          title={selectedCard.title}
          entity="application"
          id={selectedCard.id}
          schoolId={schoolId}
          currentStatus={selectedCard.status}
          options={statusOptions}
          disabledReason={disabledReason}
          onClose={() => setSelectedCard(null)}
          onSaved={() => {
            setSelectedCard(null)
            router.refresh()
          }}
        />
      ) : null}
    </Angelcare360AdmissionsPageShell>
  )
}
