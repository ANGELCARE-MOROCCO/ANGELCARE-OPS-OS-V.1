'use client'

import { Gauge } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function FeasibilityConsoleWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Feasibility Console'
    title='Console de faisabilité'
    description='Confrontez durée, capacité, ressources, staffing et risques avant validation technique.'
    icon={Gauge}
    tone='amber'
    stages={[{ label: 'Demande', detail: 'Configurer' }, { label: 'Capacité', detail: 'Structurer' }, { label: 'Ressources', detail: 'Contrôler' }, { label: 'Risques', detail: 'Comparer' }, { label: 'Verdict', detail: 'Décider' }]}
    canvasTitle='Feasibility Matrix'
    canvasDetail='Le verdict réel sera construit à partir des règles locales et des constats déterministes.'
    principles={[{ title: 'Un warning ne devient pas un blocage', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Les vrais risques restent explicites', detail: 'Le système expose les limites et les écarts.' }, { title: 'La décision critique est humaine', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
