'use client'

import { useState } from 'react'
import type { Angelcare360PeopleOverviewRecord } from '@/types/angelcare360/people'
import Angelcare360PeopleOverview from './Angelcare360PeopleOverview'
import Angelcare360PeopleChecklistDrawer from './Angelcare360PeopleChecklistDrawer'

type Angelcare360PeopleOverviewWorkspaceProps = {
  overview: Angelcare360PeopleOverviewRecord
}

export default function Angelcare360PeopleOverviewWorkspace({ overview }: Angelcare360PeopleOverviewWorkspaceProps) {
  const [checklistOpen, setChecklistOpen] = useState(false)

  return (
    <>
      <Angelcare360PeopleOverview overview={overview} />
      <div style={actionsRowStyle}>
        <button type="button" onClick={() => setChecklistOpen(true)} style={primaryButtonStyle}>
          Ouvrir la checklist des données manquantes
        </button>
        <button
          type="button"
          disabled
          title="L’export des dossiers humains reste verrouillé jusqu’à la configuration requise."
          style={disabledButtonStyle}
        >
          Exporter les dossiers
        </button>
      </div>
      <Angelcare360PeopleChecklistDrawer
        open={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        items={[
          { label: 'Dossiers incomplets', value: overview.incompleteDossiers, href: '/angelcare-360-command-center/eleves' },
          { label: 'Contacts d’urgence manquants', value: overview.missingEmergencyContacts, href: '/angelcare-360-command-center/personnes/contacts-urgence' },
          { label: 'Documents manquants', value: overview.missingDocuments, href: '/angelcare-360-command-center/personnes/documents' },
        ]}
      />
    </>
  )
}

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
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
