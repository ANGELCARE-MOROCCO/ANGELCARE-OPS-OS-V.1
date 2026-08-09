'use client'

import { Bot } from 'lucide-react'
import { PurposeBuiltPlanningWorkspace } from '../PurposeBuiltPlanningWorkspace'

export function AIRunLedgerWorkspace() {
  return <PurposeBuiltPlanningWorkspace
    eyebrow='ANGELCARE · AI Transparency Ledger'
    title='Registre transparence IA'
    description='Route demandée, modèle gratuit réellement sélectionné, usage, durée, erreur et décision humaine restent visibles.'
    icon={Bot}
    tone='violet'
    stages={[{ label: 'Demande', detail: 'Configurer' }, { label: 'Route gratuite', detail: 'Structurer' }, { label: 'Modèle sélectionné', detail: 'Contrôler' }, { label: 'Sortie structurée', detail: 'Comparer' }, { label: 'Décision humaine', detail: 'Décider' }]}
    canvasTitle='Ledger des exécutions'
    canvasDetail='Chaque run réel apparaît avec son statut, son coût, sa durée et son erreur explicite.'
    principles={[{ title: 'OpenRouter Free compose seulement', detail: 'La donnée locale reste la source de vérité.' }, { title: 'Aucun résultat fournisseur n’est fabriqué', detail: 'Le système expose les limites et les écarts.' }, { title: 'L’humain demeure l’autorité', detail: 'La décision finale reste humaine et traçable.' }]}
  />
}
