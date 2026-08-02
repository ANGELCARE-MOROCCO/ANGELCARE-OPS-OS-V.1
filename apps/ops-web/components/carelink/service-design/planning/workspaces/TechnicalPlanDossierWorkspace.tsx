'use client'

import { FolderKanban } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function TechnicalPlanDossierWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Technical Plan Passport'
    title='Dossier plan technique'
    description='Regroupez demande, standards, journées, blocs, constats, approbations et lignée IA dans un passeport durable.'
    icon={FolderKanban}
    tone='blue'
    stages={[{ label: 'Source', detail: 'Configurer' }, { label: 'Versions', detail: 'Structurer' }, { label: 'Programme', detail: 'Contrôler' }, { label: 'Constats', detail: 'Comparer' }, { label: 'Décision', detail: 'Décider' }]}
    canvasTitle='Technical Plan Passport'
    canvasDetail='Le dossier réel réunira chaque composant et sa version dans une vue audit-ready.'
    principles={[{ title: 'Lignage intégral', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Historique immuable', detail: 'Le système expose les limites et les écarts.' }, { title: 'Publication après autorité humaine', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
