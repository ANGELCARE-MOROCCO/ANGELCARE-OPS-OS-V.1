'use client'

import { BadgeCheck } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function TechnicalValidationWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Technical Validation Chamber'
    title='Chambre validation technique'
    description='Formalisez contrôles, constats, corrections, preuves et décisions avant publication.'
    icon={BadgeCheck}
    tone='emerald'
    stages={[{ label: 'Contrôler', detail: 'Configurer' }, { label: 'Constater', detail: 'Structurer' }, { label: 'Corriger', detail: 'Contrôler' }, { label: 'Prouver', detail: 'Comparer' }, { label: 'Décider', detail: 'Décider' }]}
    canvasTitle='Validation Decision Board'
    canvasDetail='Les disciplines et constats du plan réel apparaîtront avec propriétaires et conséquences.'
    principles={[{ title: 'Validation multidisciplinaire', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Les blocages ont une récupération', detail: 'Le système expose les limites et les écarts.' }, { title: 'Aucune auto-approbation IA', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
