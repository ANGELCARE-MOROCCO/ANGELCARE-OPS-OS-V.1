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

export type CustomerAccess = {
  key: string
  title: string
  description: string
  href: string
}
