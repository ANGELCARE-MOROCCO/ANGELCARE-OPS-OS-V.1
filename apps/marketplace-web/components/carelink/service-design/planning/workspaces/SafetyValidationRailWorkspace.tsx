'use client'

import { ShieldCheck } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function SafetyValidationRailWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Safety Validation Rail'
    title='Rail sécurité & safeguarding'
    description='Examinez risques, contrôles, consentements, conditions d’arrêt et escalades avant validation.'
    icon={ShieldCheck}
    tone='rose'
    stages={[{ label: 'Risques', detail: 'Configurer' }, { label: 'Prévention', detail: 'Structurer' }, { label: 'Consentements', detail: 'Contrôler' }, { label: 'Stop conditions', detail: 'Comparer' }, { label: 'Escalade', detail: 'Décider' }]}
    canvasTitle='Safety Control Board'
    canvasDetail='Les contrôles réels du plan seront visibles avec leur statut et leur preuve.'
    principles={[{ title: 'Le rouge est réservé au danger réel', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Les contrôles bloquants restent rares', detail: 'Le système expose les limites et les écarts.' }, { title: 'La sécurité n’est jamais déléguée à l’IA', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
