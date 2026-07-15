export type ContentStage = "planned" | "brief" | "production" | "review" | "approved" | "rejected" | "published"
export type ContentPriority = "urgent" | "high" | "normal" | "low"
export type ContentType = "brochure" | "post" | "newsletter" | "video" | "story" | "presentation" | "demo_video" | "promo_video" | "affiche" | "reel"

export const contentTypeLabels: Record<ContentType, string> = {
  brochure: "Brochure",
  post: "Post réseaux sociaux",
  newsletter: "Newsletter",
  video: "Vidéo",
  story: "Story",
  presentation: "Présentation",
  demo_video: "Demo video",
  promo_video: "Promo video",
  affiche: "Affiche",
  reel: "Reel",
}

export const stageLabels: Record<ContentStage, string> = {
  planned: "Planifié",
  brief: "Brief",
  production: "Production",
  review: "Review",
  approved: "Approuvé",
  rejected: "Rejeté",
  published: "Publié",
}

export const stageOrder: ContentStage[] = ["planned", "brief", "production", "review", "approved", "rejected", "published"]

export type ServiceOption = {
  id: string
  name: string
  category?: string | null
  price?: number | null
}

export type ContentWorkspaceItem = {
  id: string
  title: string
  content_type: ContentType
  service_id?: string | null
  service_name?: string | null
  creator?: string | null
  asset_url?: string | null
  stage: ContentStage
  priority: ContentPriority
  channel: string
  target: string
  deadline?: string | null
  objective: string
  output_notes?: string | null
  review_notes?: string | null
  approval_status: "none" | "submitted" | "approved" | "rejected"
  production_score: number
  created_at?: string
  updated_at?: string
}

export const creators = ["Content Officer", "Designer Canva", "Video Agent", "Social Media Agent", "Marketing Manager", "Partnership Officer"]
export const channels = ["Meta", "Instagram", "Facebook", "WhatsApp", "Email", "Landing Page", "Print", "Presentation", "Internal Demo"]
export const targets = ["Parents B2C", "B2B Entreprises", "Partenaires", "Ambassadeurs", "Mamans actives", "Familles premium", "HR / Direction"]

export const defaultServices: ServiceOption[] = [
  { id: "svc-garde-enfants", name: "Garde d'enfants à domicile", category: "Famille" },
  { id: "svc-accompagnement", name: "Accompagnement enfants", category: "Famille" },
  { id: "svc-menage", name: "Aide ménagère", category: "Maison" },
  { id: "svc-senior", name: "Assistance senior", category: "Care" },
  { id: "svc-b2b", name: "Solution entreprise / avantages salariés", category: "B2B" },
]

export const seedContentItems: ContentWorkspaceItem[] = [
  {
    id: "seed-1",
    title: "Brochure ventes - Garde d'enfants premium",
    content_type: "brochure",
    service_id: "svc-garde-enfants",
    service_name: "Garde d'enfants à domicile",
    creator: "Content Officer",
    asset_url: "",
    stage: "production",
    priority: "urgent",
    channel: "Print",
    target: "Parents B2C",
    deadline: "Aujourd'hui 17:00",
    objective: "Créer confiance, expliquer l'offre, générer demandes devis WhatsApp.",
    output_notes: "Prévoir QR code + CTA + preuves qualité.",
    review_notes: "Photo hero à valider.",
    approval_status: "none",
    production_score: 68,
  },
  {
    id: "seed-2",
    title: "Stories quotidiennes - Coulisses AngelCare",
    content_type: "story",
    service_id: "svc-garde-enfants",
    service_name: "Garde d'enfants à domicile",
    creator: "Social Media Agent",
    asset_url: "",
    stage: "approved",
    priority: "high",
    channel: "Instagram",
    target: "Mamans actives",
    deadline: "Demain 10:00",
    objective: "Augmenter crédibilité marque et messages entrants.",
    output_notes: "3 stories avec sticker question + CTA DM.",
    review_notes: "Approuvé pour publication matin.",
    approval_status: "approved",
    production_score: 91,
  },
]
