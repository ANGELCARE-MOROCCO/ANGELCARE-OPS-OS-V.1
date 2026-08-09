'use client'

import { LibraryBig } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function PlanningTemplateLibraryWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Programme Library'
    title='Bibliothèque de programmes'
    description='Retrouvez les séquences approuvées, leurs catégories, versions, objectifs et conditions de réutilisation.'
    icon={LibraryBig}
    tone='emerald'
    stages={[{ label: 'Rechercher', detail: 'Configurer' }, { label: 'Prévisualiser', detail: 'Structurer' }, { label: 'Comparer', detail: 'Contrôler' }, { label: 'Dupliquer', detail: 'Comparer' }, { label: 'Versionner', detail: 'Décider' }]}
    canvasTitle='Programme Library'
    canvasDetail='Les modèles réels seront filtrables par catégorie, objectif, durée et statut.'
    principles={[{ title: 'Les modèles restent versionnés', detail: 'La donnée locale reste la source de vérité.' }, { title: 'La réutilisation crée un nouveau dossier', detail: 'Le système expose les limites et les écarts.' }, { title: 'Aucun modèle synthétique', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
