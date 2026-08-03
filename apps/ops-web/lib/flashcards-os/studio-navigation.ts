import {
  Boxes, BrainCircuit, BriefcaseBusiness, Building2, Command, FileText, FolderOpen,
  GalleryVerticalEnd, GraduationCap, HeartHandshake, Layers3, PackageCheck, PackagePlus,
  PanelsTopLeft, ReceiptText, Route, ShoppingBag, Sparkles, Truck, UsersRound, WandSparkles,
  type LucideIcon,
} from 'lucide-react'

export type FlashcardsStudioNavItem = {
  href: string
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  accent: string
  exact?: boolean
}

export type FlashcardsStudioNavGroup = {
  key: string
  label: string
  items: FlashcardsStudioNavItem[]
}

export const FLASHCARDS_STUDIO_NAVIGATION: FlashcardsStudioNavGroup[] = [
  {
    key: 'create', label: 'Créer & concevoir', items: [
      { href: '/flashcards-os', label: 'Command Hall', shortLabel: 'Accueil', description: 'Lancer, poursuivre et piloter le travail produit.', icon: Command, accent: 'navy', exact: true },
      { href: '/flashcards-os/product/collections?create=1', label: 'Nouvelle collection', shortLabel: 'Collection', description: 'Créer une collection dans le catalogue source de vérité.', icon: PackagePlus, accent: 'blue' },
      { href: '/flashcards-os/solutions/composer', label: 'Bundle Engineering', shortLabel: 'Package', description: 'Composer un package B2C ou B2B depuis les collections locales.', icon: Boxes, accent: 'indigo' },
      { href: '/flashcards-os/solutions/learning-journeys/new', label: 'Learning Journey', shortLabel: 'Programme', description: 'Construire un programme jour/session exact.', icon: GraduationCap, accent: 'violet' },
    ],
  },
  {
    key: 'product', label: 'Produit & catalogue', items: [
      { href: '/flashcards-os/product', label: 'Portfolio Landscape', shortLabel: 'Portfolio', description: 'Vue stratégique du portefeuille produit.', icon: PanelsTopLeft, accent: 'cyan' },
      { href: '/flashcards-os/product/taxonomy', label: 'Category Architect', shortLabel: 'Catégories', description: 'Architecture des catégories et couvertures.', icon: Layers3, accent: 'teal' },
      { href: '/flashcards-os/product/collections', label: 'Collection Constellation', shortLabel: 'Collections', description: 'Découvrir, comparer et gérer les collections.', icon: GalleryVerticalEnd, accent: 'blue' },
      { href: '/flashcards-os/intelligence/production-commands', label: 'Production Command Lab', shortLabel: 'Commandes', description: 'Préparer les commandes externes PDF, vidéo et classe.', icon: WandSparkles, accent: 'violet' },
      { href: '/flashcards-os/delivery/vault', label: 'Deliverable Vault', shortLabel: 'Livrables', description: 'PDF, MP4, versions, sources et stockage Windows.', icon: FolderOpen, accent: 'emerald' },
    ],
  },
  {
    key: 'solutions', label: 'Solutions & vitrines', items: [
      { href: '/flashcards-os/solutions', label: 'Product Factory', shortLabel: 'Factory', description: 'Point de départ catalogue vers package ou programme.', icon: Sparkles, accent: 'indigo', exact: true },
      { href: '/flashcards-os/solutions/b2c', label: 'B2C Family Vitrine', shortLabel: 'Vitrine B2C', description: 'Produits familiaux publiés.', icon: HeartHandshake, accent: 'rose' },
      { href: '/flashcards-os/solutions/b2b', label: 'B2B Deployment Portfolio', shortLabel: 'Vitrine B2B', description: 'Solutions institutionnelles et déploiements.', icon: Building2, accent: 'blue' },
      { href: '/flashcards-os/documents', label: 'A4/PDF Publishing House', shortLabel: 'Documents', description: 'Seize modèles professionnels et export PDF.', icon: FileText, accent: 'navy' },
    ],
  },
  {
    key: 'revenue', label: 'Clients & revenus', items: [
      { href: '/flashcards-os/revenue/b2c/households', label: 'B2C Customer Studio', shortLabel: 'CRM B2C', description: 'Familles, apprenants, programmes et opportunités.', icon: UsersRound, accent: 'rose' },
      { href: '/flashcards-os/revenue/b2b/accounts', label: 'B2B Account Studio', shortLabel: 'CRM B2B', description: 'Comptes, sites, contacts et déploiements.', icon: BriefcaseBusiness, accent: 'blue' },
      { href: '/flashcards-os/revenue/devis', label: 'Sales Document Theatre', shortLabel: 'Devis', description: 'Devis vers commande, livraison et facture.', icon: ReceiptText, accent: 'amber' },
      { href: '/flashcards-os/revenue', label: 'Revenue Command', shortLabel: 'Revenue', description: 'Pipeline, documents, paiements et encours.', icon: PackageCheck, accent: 'emerald', exact: true },
      { href: '/flashcards-os/delivery', label: 'Fulfilment & CX', shortLabel: 'Livraison & CX', description: 'Livraison, retours, remboursement et feedback.', icon: Truck, accent: 'orange', exact: true },
    ],
  },
  {
    key: 'intelligence', label: 'Intelligence & continuité', items: [
      { href: '/flashcards-os/intelligence', label: 'Product Intelligence', shortLabel: 'Intelligence', description: 'Recherche, preuves, opportunités et design.', icon: BrainCircuit, accent: 'violet', exact: true },
      { href: '/flashcards-os/my-work', label: 'Mon travail', shortLabel: 'Mon travail', description: 'Brouillons, favoris, vues, commentaires et PDFs.', icon: ShoppingBag, accent: 'navy' },
      { href: '/flashcards-os/solutions/advanced', label: 'Advanced Operations', shortLabel: 'Avancé', description: 'Contrôles avancés hors du chemin principal.', icon: Route, accent: 'slate' },
    ],
  },
]

export const FLASHCARDS_STUDIO_ALL_ITEMS = FLASHCARDS_STUDIO_NAVIGATION.flatMap((group) => group.items)

export function flashcardsWorkspaceIdentity(pathname: string) {
  const exact = FLASHCARDS_STUDIO_ALL_ITEMS.find((item) => item.exact && item.href === pathname)
  const item = exact || [...FLASHCARDS_STUDIO_ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((candidate) => !candidate.href.includes('?') && pathname.startsWith(candidate.href))
  if (pathname.includes('/product/collections/') && pathname.endsWith('/cards')) return { label: 'Card Architecture Laboratory', description: 'Storyboard, contenu, objectifs, versions et production des cartes.', accent: 'cyan' }
  if (pathname.includes('/product/collections/')) return { label: 'Collection Product Atelier', description: 'Dossier produit complet, versionnement, commandes et livrables.', accent: 'blue' }
  if (pathname.includes('/workbench/package/')) return { label: 'Bundle Engineering Canvas', description: 'Composition directe, tiers, quantités, prix et comparaison.', accent: 'indigo' }
  if (pathname.includes('/workbench/journey/')) return { label: 'Learning Journey Theatre', description: 'Programme multi-jours, sessions et collections directement éditables.', accent: 'violet' }
  if (pathname.includes('/compare/')) return { label: 'Scenario Comparison Theatre', description: 'Différences, choix et fusion de propositions.', accent: 'amber' }
  if (pathname.includes('/intelligence/production-commands/')) return { label: 'External Production Command Lab', description: 'Commande structurée pour production externe, versions et clean copy.', accent: 'violet' }
  if (pathname.includes('/delivery/vault/')) return { label: 'Deliverable Vault Gallery', description: 'Livrables, versions, prévisualisation et dépendances.', accent: 'emerald' }
  if (pathname.includes('/revenue/b2c/')) return { label: 'B2C Customer Studio', description: 'Famille, apprenant, produits possédés et prochaine meilleure offre.', accent: 'rose' }
  if (pathname.includes('/revenue/b2b/')) return { label: 'B2B Account Deployment Studio', description: 'Compte, sites, opportunités, solutions et expansion.', accent: 'blue' }
  return { label: item?.label || 'Flashcards Product & Learning Studio', description: item?.description || 'Catalogue, apprentissage, production, commercialisation et expérience client.', accent: item?.accent || 'navy' }
}
