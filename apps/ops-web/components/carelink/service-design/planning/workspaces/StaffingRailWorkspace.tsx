'use client'

import { UsersRound } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function StaffingRailWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Staffing Requirements'
    title='Rail compétences & staffing'
    description='Déterminez profils, compétences, ratios, backup et supervision sans assigner un agent réel.'
    icon={UsersRound}
    tone='emerald'
    stages={[{ label: 'Profil', detail: 'Configurer' }, { label: 'Compétences', detail: 'Structurer' }, { label: 'Ratio', detail: 'Contrôler' }, { label: 'Backup', detail: 'Comparer' }, { label: 'Supervision', detail: 'Décider' }]}
    canvasTitle='Staffing Requirement Matrix'
    canvasDetail='Le besoin réel apparaîtra par jour et par bloc, sans décision d’affectation.'
    principles={[{ title: 'Le studio calcule le besoin', detail: 'La donnée locale reste la source de vérité.' }, { title: 'CARELINK choisit les personnes', detail: 'Le système expose les limites et les écarts.' }, { title: 'Aucun jugement employé par l’IA', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
