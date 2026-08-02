'use client'

import { Milestone } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function MultiDayJourneyWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Multi-Day Journey Theatre'
    title='Théâtre parcours multi-jours'
    description='Visualisez la progression entre familiarisation, routine, participation, autonomie et consolidation.'
    icon={Milestone}
    tone='violet'
    stages={[{ label: 'Jour 1', detail: 'Configurer' }, { label: 'Progression', detail: 'Structurer' }, { label: 'Variation', detail: 'Contrôler' }, { label: 'Continuité', detail: 'Comparer' }, { label: 'Clôture', detail: 'Décider' }]}
    canvasTitle='Programme Ribbon'
    canvasDetail='Chaque journée réelle apparaîtra avec sa timeline, son objectif et sa relation aux autres jours.'
    principles={[{ title: 'Progression visible', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Répétition contrôlée', detail: 'Le système expose les limites et les écarts.' }, { title: 'Chaque jour conserve ses IDs locaux', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
