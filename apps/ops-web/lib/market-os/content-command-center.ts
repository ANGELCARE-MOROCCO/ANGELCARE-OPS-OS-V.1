export type ContentStage = "idea" | "brief" | "copy" | "design" | "review" | "approved" | "scheduled" | "published"
export type ContentType = "Brochure Ventes" | "Brochure Partenaire" | "Affiche" | "Publication" | "Newsletter" | "Video" | "Presentation" | "Reel" | "Story" | "Temoignage"
export type Channel = "Meta" | "Instagram" | "Facebook" | "Email" | "Landing Page" | "Print" | "WhatsApp" | "Canva"
export type Segment = "B2C Parents" | "B2B Entreprises" | "Partenaires" | "Ambassadeurs" | "Corporate"

export type ContentAsset = {
  id: string
  title: string
  type: ContentType
  stage: ContentStage
  owner: string
  campaign: string
  channel: Channel
  segment: Segment
  deadline: string
  priority: "P0" | "P1" | "P2"
  brandScore: number
  conversionScore: number
  complianceScore: number
  readiness: number
  checklist: string[]
  blockers: string[]
  kpi: string
  nextAction: string
}

export const stageLabels: Record<ContentStage, string> = {
  idea: "Idee",
  brief: "Brief",
  copy: "Copywriting",
  design: "Design Canva",
  review: "Review",
  approved: "Approuve",
  scheduled: "Programme",
  published: "Publie",
}

export const productionStages: ContentStage[] = ["idea", "brief", "copy", "design", "review", "approved", "scheduled", "published"]

export const contentAssets: ContentAsset[] = [
  {
    id: "CNT-001",
    title: "Brochure Ventes - Garde Enfants Premium",
    type: "Brochure Ventes",
    stage: "design",
    owner: "Content Officer",
    campaign: "Acquisition Familles Rabat",
    channel: "Print",
    segment: "B2C Parents",
    deadline: "Aujourd'hui 16:00",
    priority: "P0",
    brandScore: 91,
    conversionScore: 84,
    complianceScore: 88,
    readiness: 72,
    checklist: ["promesse", "prix", "preuves", "CTA", "QR code"],
    blockers: ["Photo hero a valider", "CTA WhatsApp final"],
    kpi: "Messages entrants + demandes devis",
    nextAction: "Finaliser design Canva et envoyer en validation marque.",
  },
  {
    id: "CNT-002",
    title: "Pack Stories quotidiennes - Coulisses AngelCare",
    type: "Story",
    stage: "scheduled",
    owner: "Social Agent",
    campaign: "Credibilite Marque",
    channel: "Instagram",
    segment: "B2C Parents",
    deadline: "Demain 10:30",
    priority: "P1",
    brandScore: 89,
    conversionScore: 71,
    complianceScore: 94,
    readiness: 91,
    checklist: ["story 1", "story 2", "story 3", "sticker", "CTA"],
    blockers: [],
    kpi: "Engagement + reponses DM",
    nextAction: "Verifier ordre de publication et activer rappel publication.",
  },
  {
    id: "CNT-003",
    title: "Newsletter #14 - Solution sereinite parents actifs",
    type: "Newsletter",
    stage: "copy",
    owner: "Content Officer",
    campaign: "Nurturing Parents",
    channel: "Email",
    segment: "B2C Parents",
    deadline: "Vendredi 15:00",
    priority: "P1",
    brandScore: 86,
    conversionScore: 78,
    complianceScore: 83,
    readiness: 58,
    checklist: ["objet", "intro", "benefices", "preuve", "CTA"],
    blockers: ["Temoignage client manquant"],
    kpi: "Taux ouverture + RDV demandes",
    nextAction: "Ajouter temoignage et produire deux variantes d'objet.",
  },
  {
    id: "CNT-004",
    title: "Brochure Partenaire - Programme Ambassadeur",
    type: "Brochure Partenaire",
    stage: "review",
    owner: "Partnership Lead",
    campaign: "Programme Ambassadeur AngelCare",
    channel: "Print",
    segment: "Partenaires",
    deadline: "Jeudi 12:00",
    priority: "P0",
    brandScore: 93,
    conversionScore: 87,
    complianceScore: 76,
    readiness: 80,
    checklist: ["benefices", "commission", "conditions", "process", "contact"],
    blockers: ["Conditions partenaire a confirmer"],
    kpi: "Nouveaux partenaires qualifies",
    nextAction: "Soumettre au manager pour validation conditions commerciales.",
  },
  {
    id: "CNT-005",
    title: "Reels Avant / Apres - Organisation familiale",
    type: "Reel",
    stage: "brief",
    owner: "Video Agent",
    campaign: "Confiance & Conversion",
    channel: "Meta",
    segment: "B2C Parents",
    deadline: "Lundi 18:00",
    priority: "P2",
    brandScore: 82,
    conversionScore: 88,
    complianceScore: 92,
    readiness: 44,
    checklist: ["script", "shotlist", "caption", "hook", "CTA"],
    blockers: ["Script reel a produire", "Choisir famille scenario"],
    kpi: "Engagement eleve + messages entrants",
    nextAction: "Creer script 20 secondes avec hook confiance.",
  },
]

export const contentTemplates = [
  "Brochure Ventes", "Brochure Partenaire", "Affiche", "Publication Meta", "Newsletter", "Video & Presentation", "Reel 1-3/jour", "Stories quotidiennes", "Temoignage client", "Visuel Canva"
]

export const angelCareContentAngles = [
  "Enfants en activite", "Avant / Apres", "Mamans satisfaites", "Coulisses AngelCare", "Securite & confiance", "Gain de temps", "Urgence famille", "Qualite encadrement", "Premium care", "Partenariat local"
]
