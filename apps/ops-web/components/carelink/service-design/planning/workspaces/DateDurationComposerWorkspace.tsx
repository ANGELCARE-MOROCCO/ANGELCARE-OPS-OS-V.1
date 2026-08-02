'use client'

import { CalendarClock } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function DateDurationComposerWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · Date & Duration Composer'
    title='Dates, durées et fenêtres de service'
    description='Construisez une ou plusieurs dates, copiez les horaires et contrôlez la couverture sans calcul manuel.'
    icon={CalendarClock}
    tone='blue'
    stages={[{ label: 'Dates', detail: 'Configurer' }, { label: 'Fenêtres', detail: 'Structurer' }, { label: 'Répétition', detail: 'Contrôler' }, { label: 'Couverture', detail: 'Comparer' }, { label: 'Confirmation', detail: 'Décider' }]}
    canvasTitle='Calendar Command'
    canvasDetail='Les dates et heures réelles apparaîtront sous forme de calendrier et de fenêtres contrôlées.'
    principles={[{ title: 'Les dates restent déterministes', detail: 'La donnée locale reste la source de vérité.' }, { title: 'La couverture doit être complète', detail: 'Le système expose les limites et les écarts.' }, { title: 'Aucune date n’est modifiée par l’IA', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
