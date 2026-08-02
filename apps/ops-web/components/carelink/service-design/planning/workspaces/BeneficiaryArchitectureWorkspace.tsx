'use client'

import { UserRoundCog } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function BeneficiaryArchitectureWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Beneficiary Architecture'
    title='Architecture bénéficiaire'
    description='Structurez profils, rythmes, besoins, préférences et adaptations avec une exposition minimale des données sensibles.'
    icon={UserRoundCog}
    tone='blue'
    stages={[{ label: 'Profil', detail: 'Configurer' }, { label: 'Rythmes', detail: 'Structurer' }, { label: 'Besoins', detail: 'Contrôler' }, { label: 'Adaptations', detail: 'Comparer' }, { label: 'Transmission', detail: 'Décider' }]}
    canvasTitle='Beneficiary Experience Canvas'
    canvasDetail='Le canvas reliera les choix contrôlés aux objectifs, routines et adaptations du plan.'
    principles={[{ title: 'Données strictement nécessaires', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Choix structurés plutôt que narration', detail: 'Le système expose les limites et les écarts.' }, { title: 'CARELINK reçoit le snapshot approuvé', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
