'use client'

import { TrendingUp } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function ProgressionStudioWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Progression Architecture'
    title='Studio architecture de progression'
    description='Organisez les phases d’un programme et vérifiez continuité, variété, intensité et résultats attendus.'
    icon={TrendingUp}
    tone='violet'
    stages={[{ label: 'Familiariser', detail: 'Configurer' }, { label: 'Installer', detail: 'Structurer' }, { label: 'Faire participer', detail: 'Contrôler' }, { label: 'Autonomiser', detail: 'Comparer' }, { label: 'Consolider', detail: 'Décider' }]}
    canvasTitle='Progression Map'
    canvasDetail='La progression réelle apparaîtra comme une carte reliant jours, objectifs et preuves.'
    principles={[{ title: 'Chaque phase a un objectif', detail: 'La donnée locale reste la source de vérité.' }, { title: 'La variation reste contrôlée', detail: 'Le système expose les limites et les écarts.' }, { title: 'Les résultats sont observables, pas médicaux', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
