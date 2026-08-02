'use client'

import { PackageSearch } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function ResourceRailWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Resource Rail'
    title='Rail matériels & ressources'
    description='Reliez activités, matériels requis, disponibilité, responsabilité et alternatives autorisées.'
    icon={PackageSearch}
    tone='emerald'
    stages={[{ label: 'Besoins', detail: 'Configurer' }, { label: 'Disponibilité', detail: 'Structurer' }, { label: 'Responsabilité', detail: 'Contrôler' }, { label: 'Alternative', detail: 'Comparer' }, { label: 'Validation', detail: 'Décider' }]}
    canvasTitle='Resource Availability Rail'
    canvasDetail='Les ressources du plan réel seront classées par disponibilité et criticité.'
    principles={[{ title: 'Aucune ressource inventée', detail: 'La donnée locale reste la source de vérité.' }, { title: 'La responsabilité est explicite', detail: 'Le système expose les limites et les écarts.' }, { title: 'Les alternatives doivent être autorisées', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
