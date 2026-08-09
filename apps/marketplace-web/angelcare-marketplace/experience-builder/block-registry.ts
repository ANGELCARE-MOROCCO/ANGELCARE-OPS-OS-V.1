import type { CmsBlockType } from './types'

export interface BlockDefinition {
  type: CmsBlockType
  name: string
  purpose: string
  allowedKeys: string[]
  requiresCta: boolean
  sensitive: boolean
}

export const CMS_BLOCK_REGISTRY: BlockDefinition[] = [
  { type: 'hero', name: 'Hero de conversion', purpose: 'Positionnement, promesse et action primaire.', allowedKeys: ['eyebrow','title','lead','primaryCtaKey','secondaryCtaKey','trustNote'], requiresCta: true, sensitive: false },
  { type: 'audience_router', name: 'Routeur d’audiences', purpose: 'Orienter familles, établissements, hôtels, cliniques et entreprises.', allowedKeys: ['title','lead','audiences'], requiresCta: false, sensitive: false },
  { type: 'service_grid', name: 'Architecture de services', purpose: 'Présenter les familles d’offres sans prix inventé.', allowedKeys: ['title','lead','items'], requiresCta: false, sensitive: false },
  { type: 'trust_strip', name: 'Bande de confiance', purpose: 'Afficher des engagements dont les preuves sont gouvernées.', allowedKeys: ['items','disclaimer'], requiresCta: false, sensitive: true },
  { type: 'proof_grid', name: 'Preuves et méthode', purpose: 'Relier chaque affirmation à une preuve ou un standard.', allowedKeys: ['title','items'], requiresCta: false, sensitive: true },
  { type: 'editorial', name: 'Narration éditoriale', purpose: 'Texte structuré, lisible et localisable.', allowedKeys: ['kicker','title','body','aside'], requiresCta: false, sensitive: false },
  { type: 'cta_band', name: 'Bande d’action', purpose: 'Conversion vers une action enregistrée.', allowedKeys: ['title','lead','ctaKey','secondaryCtaKey'], requiresCta: true, sensitive: false },
  { type: 'faq', name: 'Questions fréquentes', purpose: 'Réponses gouvernées et sensibles au territoire.', allowedKeys: ['title','items'], requiresCta: false, sensitive: false },
  { type: 'stats', name: 'Indicateurs prouvés', purpose: 'Afficher uniquement des métriques reliées à une source réelle.', allowedKeys: ['title','items','sourceNote'], requiresCta: false, sensitive: true },
  { type: 'timeline', name: 'Parcours et étapes', purpose: 'Expliquer un cycle opérationnel.', allowedKeys: ['title','steps'], requiresCta: false, sensitive: false },
  { type: 'inquiry_form', name: 'Formulaire de prise de contact', purpose: 'Créer une entrée publique persistante.', allowedKeys: ['title','lead','audience','successMessage'], requiresCta: false, sensitive: true },
  { type: 'marketplace_entry', name: 'Entrée Marketplace', purpose: 'Présenter la future expérience commerce sans disponibilité fictive.', allowedKeys: ['title','lead','availabilityLabel','ctaKey'], requiresCta: true, sensitive: false },
  { type: 'partner_os_entry', name: 'Entrée Partner OS', purpose: 'Présenter la proposition SaaS et collecter une demande de démonstration.', allowedKeys: ['title','lead','benefits','ctaKey'], requiresCta: true, sensitive: false },
  { type: 'academy_entry', name: 'Entrée Academy', purpose: 'Présenter le catalogue et collecter un besoin de formation.', allowedKeys: ['title','lead','tracks','ctaKey'], requiresCta: true, sensitive: false },
  { type: 'family_story', name: 'Parcours famille', purpose: 'Illustrer un parcours sans témoignage fabriqué.', allowedKeys: ['title','stages','disclaimer'], requiresCta: false, sensitive: true },
]

export function blockDefinition(type: CmsBlockType): BlockDefinition {
  const definition = CMS_BLOCK_REGISTRY.find((item) => item.type === type)
  if (!definition) throw new Error(`Type de bloc non enregistré : ${type}`)
  return definition
}
