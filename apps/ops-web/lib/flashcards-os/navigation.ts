import {
  Boxes,
  BrainCircuit,
  Command,
  PackageCheck,
  Route,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export type FlashcardsMasterUniverse = {
  key: string
  label: string
  eyebrow: string
  href: string
  icon: LucideIcon
  delivery: number
  active: boolean
  description: string
}

export const FLASHCARDS_MASTER_UNIVERSES: FlashcardsMasterUniverse[] = [
  {
    key: 'command',
    label: 'Command',
    eyebrow: 'Direction & doctrine',
    href: '/flashcards-os',
    icon: Command,
    delivery: 6,
    active: true,
    description: 'Executive command, portfolio, revenue, fulfilment, customer experience and production readiness.',
  },
  {
    key: 'product',
    label: 'Product',
    eyebrow: 'Portfolio engineering',
    href: '/flashcards-os/product',
    icon: Boxes,
    delivery: 1,
    active: true,
    description: 'Taxonomie, collections, contenus, éditions, formats et versions.',
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    eyebrow: 'Research & design',
    href: '/flashcards-os/intelligence',
    icon: BrainCircuit,
    delivery: 2,
    active: true,
    description: 'Tavily, OpenRouter, preuves, opportunités et Product Design gouverné.',
  },
  {
    key: 'solutions',
    label: 'Solutions',
    eyebrow: 'Offer architecture',
    href: '/flashcards-os/solutions',
    icon: Route,
    delivery: 4,
    active: true,
    description: 'Bundles, vitrines B2C/B2B et parcours d’apprentissage.',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    eyebrow: 'CRM & commercial',
    href: '/flashcards-os/revenue',
    icon: PackageCheck,
    delivery: 5,
    active: true,
    description: 'CRM B2C/B2B, opportunités, devis, commandes, livraisons, factures et paiements.',
  },
  {
    key: 'delivery',
    label: 'Delivery & Experience',
    eyebrow: 'Fulfilment & CX',
    href: '/flashcards-os/delivery',
    icon: Truck,
    delivery: 6,
    active: true,
    description: 'Product Vault, physical/digital fulfilment, customer experience, returns, refunds and production operations.',
  },
]

export const PRODUCT_NAVIGATION = [
  { href: '/flashcards-os/product', label: 'Portfolio Landscape', description: 'Vue consolidée des familles et de la couverture.' },
  { href: '/flashcards-os/product/taxonomy', label: 'Taxonomy Atlas', description: 'Architecture dynamique des catégories et sous-catégories.' },
  { href: '/flashcards-os/product/collections', label: 'Collection Registry', description: 'Registre canonique, readiness, anomalies et valeur.' },
  { href: '/flashcards-os/governance/import-control', label: 'Legacy Intake Control', description: 'Contrôle qualité de l’import catalogue 2022.' },
] as const


export const INTELLIGENCE_NAVIGATION = [
  { href: '/flashcards-os/intelligence', label: 'Command Bridge', description: 'Missions, preuves, opportunités, décisions et santé provider.' },
  { href: '/flashcards-os/intelligence/research', label: 'Research Missions', description: 'Définition, approbation et contrôle des missions Tavily.' },
  { href: '/flashcards-os/intelligence/evidence', label: 'Evidence Observatory', description: 'Sources, claims, contradictions et arbitrage humain.' },
  { href: '/flashcards-os/intelligence/opportunities', label: 'Opportunity Radar', description: 'Qualification déterministe et décisions produit.' },
  { href: '/flashcards-os/intelligence/product-design', label: 'Product Design', description: 'War Rooms, alternatives, risques et readiness UMZ3.' },
  { href: '/flashcards-os/intelligence/control/providers', label: 'AI Provider Control', description: 'Tavily Free, OpenRouter Free, tests, usage et politiques de tâches visibles.' },
  { href: '/flashcards-os/intelligence/control/runs', label: 'Run Ledger', description: 'Lignée provider, coûts, latence, erreurs et redactions.' },
] as const


export const PRODUCTION_NAVIGATION = [
  { href: '/flashcards-os/intelligence/production-commands', label: 'Command Forge', description: 'Compilation, validation, versions et clean copy.' },
  { href: '/flashcards-os/product/external-production', label: 'External Dispatch', description: 'Jobs externes, échéances, corrections et retours.' },
] as const

export const DELIVERY_NAVIGATION = [
  { href: '/flashcards-os/delivery', label: 'Experience Command', description: 'Fulfilment, customer experience and operating pressure.' },
  { href: '/flashcards-os/delivery/fulfilment', label: 'Fulfilment', description: 'Physical, digital and hybrid order execution.' },
  { href: '/flashcards-os/delivery/physical', label: 'Physical Ops', description: 'Pick, pack, quality and dispatch readiness.' },
  { href: '/flashcards-os/delivery/digital-entitlements', label: 'Digital Access', description: 'Release-bound entitlements, expiry and audit.' },
  { href: '/flashcards-os/delivery/shipments', label: 'Shipments', description: 'Carrier, tracking, delivery evidence and exceptions.' },
  { href: '/flashcards-os/delivery/customer-experience', label: 'CX Resolution', description: 'Cases, evidence, SLA and customer closure.' },
  { href: '/flashcards-os/delivery/returns', label: 'Returns & Exchange', description: 'RMA, receipt, inspection and replacements.' },
  { href: '/flashcards-os/delivery/refunds', label: 'Refund Authority', description: 'Eligibility, approvals and completion evidence.' },
  { href: '/flashcards-os/delivery/quality-signals', label: 'Quality Signals', description: 'Customer evidence back to product design.' },
  { href: '/flashcards-os/delivery/vault', label: 'Product Vault', description: 'Sources, deliverables, checksums and versions.' },
  { href: '/flashcards-os/delivery/operations/health', label: 'Operations', description: 'Health, reconciliation, incidents, pilot and readiness.' },
] as const


export const SOLUTIONS_NAVIGATION = [
  { href: '/flashcards-os/solutions', label: 'Command Bridge', description: 'Demandes, décisions, vitrines, parcours et alertes commerciales.' },
  { href: '/flashcards-os/solutions/composer', label: 'Solution Composer', description: 'Contraintes, éligibilité et génération de scénarios.' },
  { href: '/flashcards-os/solutions/requests', label: 'Scenario Operations', description: 'Demandes, alternatives, comparaison et assemblage.' },
  { href: '/flashcards-os/solutions/b2c', label: 'B2C Vitrine', description: 'Packs familiaux confirmés, versionnés et publiables.' },
  { href: '/flashcards-os/solutions/b2b', label: 'B2B Portfolio', description: 'Solutions institutionnelles, volumes, licences et déploiement.' },
  { href: '/flashcards-os/solutions/learning-journeys', label: 'Learning Journeys', description: 'Demandes, plans, timeline, mapping et validation.' },
  { href: '/flashcards-os/solutions/ready-plans', label: 'Ready Plans', description: 'Programmes B2C/B2B approuvés et prêts pour UMZ5.' },
  { href: '/flashcards-os/solutions/pricing', label: 'Pricing Control', description: 'Price books, cost books, margins, discounts et taxes.' },
  { href: '/flashcards-os/solutions/governance/objectives', label: 'Objective Ontology', description: 'Cinq dimensions gouvernées et administrativement extensibles.' },
] as const


export const REVENUE_NAVIGATION = [
  { href: '/flashcards-os/revenue', label: 'Revenue Command', description: 'Pipeline, forecast, documents, encours et décisions.' },
  { href: '/flashcards-os/revenue/b2c/households', label: 'B2C Households', description: 'Familles, guardians, learners, besoins et opportunités.' },
  { href: '/flashcards-os/revenue/b2b/accounts', label: 'B2B Accounts', description: 'Organisations, sites, stakeholders et renouvellements.' },
  { href: '/flashcards-os/revenue/devis', label: 'Devis Studio', description: 'Composition, pricing, approvals, PDF et décisions client.' },
  { href: '/flashcards-os/revenue/orders', label: 'Order Ledger', description: 'Obligations confirmées, quantités livrées et facturées.' },
  { href: '/flashcards-os/revenue/deliveries', label: 'Delivery Notes', description: 'Bons de livraison, lignes, preuves et éligibilité facture.' },
  { href: '/flashcards-os/revenue/invoices', label: 'Invoices', description: 'Facturation depuis livraisons, états et avoirs.' },
  { href: '/flashcards-os/revenue/payments', label: 'Payments & AR', description: 'Paiements, allocations, soldes, ageing et relances.' },
  { href: '/flashcards-os/revenue/documents', label: 'Document Registry', description: 'Registre unifié, versions, statuts et lignée.' },
  { href: '/flashcards-os/revenue/approvals', label: 'Approval Chamber', description: 'Remises, marges, émission, avoirs et décisions.' },
] as const
