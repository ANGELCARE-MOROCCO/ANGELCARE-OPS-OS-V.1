export type SanilaPublicKind =
  | 'home'
  | 'product'
  | 'features'
  | 'domain'
  | 'solutions'
  | 'solution'
  | 'trust'
  | 'service'
  | 'pricing'
  | 'resources'
  | 'faq'
  | 'demo'
  | 'access'
  | 'contact'
  | 'onboarding'

export type SanilaAccent =
  | 'navy'
  | 'gold'
  | 'cobalt'
  | 'mint'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'sky'
  | 'rose'
  | 'slate'
  | 'coral'

export type SanilaVisualMode =
  | 'flagship'
  | 'architecture'
  | 'capability-map'
  | 'command'
  | 'structure'
  | 'journey'
  | 'today'
  | 'academic'
  | 'ledger'
  | 'payroll'
  | 'mobility'
  | 'relationship'
  | 'library'
  | 'inventory'
  | 'resolution'
  | 'reporting'
  | 'solutions'
  | 'institution'
  | 'trust'
  | 'implementation'
  | 'pricing'
  | 'resources'
  | 'faq'
  | 'conversion'
  | 'access'
  | 'contact'
  | 'onboarding'

export type SanilaPublicPage = {
  slug: string
  nav: string
  eyebrow: string
  title: string
  subtitle: string
  statement: string
  kind: SanilaPublicKind
  accent: SanilaAccent
  features: string[]
}

export type SanilaWorkflowStep = {
  label: string
  detail: string
}

export type SanilaProofPoint = {
  title: string
  detail: string
}

export type SanilaEvidenceSource = {
  label: string
  sourcePath: string
  type: 'route' | 'component' | 'asset'
}

export type SanilaPageBlueprint = SanilaPublicPage & {
  mode: SanilaVisualMode
  audience: string
  buyerQuestion: string
  problem: string
  outcome: string
  workflow: SanilaWorkflowStep[]
  proofPoints: SanilaProofPoint[]
  nextStep: string
  nextHref: string
  contextualImage?: string
  contextualImageAlt?: string
  evidenceSources: SanilaEvidenceSource[]
}

export type CustomerAccess = {
  key: string
  title: string
  description: string
  href: string
  image?: string
}
