'use client'

import { ScanSearch } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function PlanBlockInspectorWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Mission Block Inspector'
    title='Inspecteur de bloc mission'
    description='Inspectez activité source, durée, objectif, matériels, compétences, risques, preuves et alternatives.'
    icon={ScanSearch}
    tone='blue'
    stages={[{ label: 'Source', detail: 'Configurer' }, { label: 'Temps', detail: 'Structurer' }, { label: 'Ressources', detail: 'Contrôler' }, { label: 'Risques', detail: 'Comparer' }, { label: 'Preuves', detail: 'Décider' }]}
    canvasTitle='Block Inspection Canvas'
    canvasDetail='Sélectionnez un bloc réel pour afficher sa lignée complète et ses alternatives autorisées.'
    principles={[{ title: 'Chaque bloc cite sa source', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Durées validées par le serveur', detail: 'Le système expose les limites et les écarts.' }, { title: 'Remplacements limités au catalogue local', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
