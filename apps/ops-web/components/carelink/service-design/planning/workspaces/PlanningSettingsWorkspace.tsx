'use client'

import { SlidersHorizontal } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function PlanningSettingsWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Planning Controls'
    title='Paramètres de planification'
    description='Configurez les limites de génération, durées, variations et règles d’affichage sans modifier la doctrine métier.'
    icon={SlidersHorizontal}
    tone='slate'
    stages={[{ label: 'Limites', detail: 'Configurer' }, { label: 'Durées', detail: 'Structurer' }, { label: 'Variations', detail: 'Contrôler' }, { label: 'Affichage', detail: 'Comparer' }, { label: 'Contrôle', detail: 'Décider' }]}
    canvasTitle='Planning Control Surface'
    canvasDetail='Les paramètres réels apparaîtront ici avec leur source et leur portée.'
    principles={[{ title: 'Paramètres séparés de la doctrine', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Aucune valeur silencieuse', detail: 'Le système expose les limites et les écarts.' }, { title: 'Les changements restent auditables', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
