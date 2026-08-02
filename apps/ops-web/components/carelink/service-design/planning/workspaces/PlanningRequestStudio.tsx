'use client'

import { ClipboardList } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function PlanningRequestStudio() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Planning Request Studio'
    title='Demande de planification structurée'
    description='Assemblez catégorie, scénario, bénéficiaire, dates et objectifs sans questionnaire narratif générique.'
    icon={ClipboardList}
    tone='blue'
    stages={[{ label: 'Catégorie', detail: 'Configurer' }, { label: 'Scénario', detail: 'Structurer' }, { label: 'Bénéficiaire', detail: 'Contrôler' }, { label: 'Dates', detail: 'Comparer' }, { label: 'Génération', detail: 'Décider' }]}
    canvasTitle='Request Configuration Canvas'
    canvasDetail='Le dossier se pré-remplit depuis le blueprint et le preset choisis.'
    principles={[{ title: '95% de choix contrôlés', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Dates et heures restent explicites', detail: 'Le système expose les limites et les écarts.' }, { title: 'Le prompt technique est compilé par le système', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
