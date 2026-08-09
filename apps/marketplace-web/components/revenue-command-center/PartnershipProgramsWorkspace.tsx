"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
  Filter,
  FileText,
  GraduationCap,
  Handshake,
  Hotel,
  Import,
  MoreHorizontal,
  Network,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react"

type Program = {
  id: string
  name: string
  subtitle: string
  partnerType: string
  partners: number
  status: string
  revenueImpact: number
  engagement: number
  icon: any
  accent: string
  city?: string
  owner?: string
  stage?: string
  updatedAt?: string
  offers?: ServiceOffer[]
  pricingRules?: PricingRule[]
  contractTerms?: ContractTerm[]
  eligibilityRequirements?: EligibilityRequirement[]
  publishReview?: PublishReview
}

type AdvisorView = "insights" | "recommendations" | "opportunities" | "actions" | "risks"

type ServiceOffer = {
  id: string
  name: string
  description: string
  category: string
  deliveryMethod: string
  duration: string
  frequency: string
  partnerEligibility: string
  targetAudience: string
  includedFor: string
  pricingModel: string
  unitPrice: string
  revenueShare: string
  costOwner: string
  capacity: string
  sla: string
  requiredResources: string
  documents: string
  operationalOwner: string
  kpi: string
  status: "Included" | "Premium Add-on" | "Optional" | "Pilot"
}

type PricingRule = {
  id: string
  name: string
  model: string
  partnerTier: string
  baseFee: string
  setupFee: string
  monthlyFee: string
  commission: string
  revenueShare: string
  discountRule: string
  minimumCommitment: string
  paymentTerms: string
  billingCycle: string
  currency: string
  taxRule: string
  cancellationFee: string
  renewalRule: string
  marginTarget: string
  forecastPartners: string
  forecastRevenue: string
  condition: string
  notes: string
  status: "Draft" | "Active" | "Negotiable" | "Approval Required"
}

type ContractTerm = {
  id: string
  name: string
  contractType: string
  partnerTier: string
  duration: string
  effectiveDate: string
  renewalType: string
  terminationNotice: string
  exclusivity: string
  territory: string
  serviceScope: string
  partnerObligations: string
  angelcareObligations: string
  paymentTerms: string
  dataProtection: string
  confidentiality: string
  liability: string
  insurance: string
  compliance: string
  disputeResolution: string
  signatureFlow: string
  approvalOwner: string
  attachments: string
  customClause: string
  status: "Draft" | "Active" | "Legal Review" | "Approval Required"
}

type EligibilityRequirement = {
  id: string
  name: string
  requirementType: string
  partnerType: string
  partnerTier: string
  priority: "Mandatory" | "Recommended" | "Optional" | "Conditional"
  verificationMethod: string
  requiredDocument: string
  minimumStandard: string
  condition: string
  evidenceOwner: string
  reviewFrequency: string
  riskLevel: "Low" | "Medium" | "High" | "Critical"
  complianceArea: string
  operationalImpact: string
  approvalOwner: string
  escalationRule: string
  validityPeriod: string
  onboardingGate: string
  renewalGate: string
  notes: string
  status: "Draft" | "Active" | "Needs Review" | "Blocked"
}

type PublishReview = {
  publishStatus: "Draft" | "Ready for Review" | "Approved" | "Published"
  launchDate: string
  launchOwner: string
  approvalRoute: string
  executiveSummary: string
  internalNotes: string
  publishChecklist: string[]
  riskNotes: string
  goLiveConditions: string
  communicationPlan: string
  staffInstructions: string
  partnerInstructions: string
  reportingCadence: string
  reviewFrequency: string
  finalApprovalOwner: string
  publishAudience: string
  activationChannels: string
}

const accentMap: Record<string, string> = {
  violet: "from-violet-600 to-blue-600",
  pink: "from-pink-500 to-rose-500",
  orange: "from-orange-500 to-amber-500",
  blue: "from-blue-500 to-cyan-400",
  emerald: "from-emerald-500 to-teal-400",
  purple: "from-purple-500 to-fuchsia-500",
  red: "from-red-500 to-rose-500",
}

const partnerTypes = [
  { label: "All Programs", count: 24, icon: UsersRound, accent: "violet" },
  { label: "Preschools & Kindergarten", count: 6, icon: GraduationCap, accent: "violet" },
  { label: "Maternity Clinics", count: 4, icon: Stethoscope, accent: "pink" },
  { label: "Orthophonistes", count: 4, icon: Activity, accent: "orange" },
  { label: "Hotels", count: 4, icon: Hotel, accent: "blue" },
  { label: "Corporates", count: 4, icon: Building2, accent: "emerald" },
  { label: "Associations", count: 2, icon: Network, accent: "purple" },
]

const seedPrograms: Program[] = [
  { id: "preschool-network", name: "Angelcare Preschool Network", subtitle: "Premium early education partnership", partnerType: "Preschools & Kindergarten", partners: 86, status: "Active", revenueImpact: 1245800, engagement: 82, icon: GraduationCap, accent: "violet", city: "Casablanca / Rabat", owner: "Partnership Director", stage: "Expansion" },
  { id: "maternity-care", name: "Maternity Care Alliance", subtitle: "Supporting moms, together", partnerType: "Maternity Clinics", partners: 45, status: "Active", revenueImpact: 987500, engagement: 76, icon: Stethoscope, accent: "pink", city: "Rabat / Temara", owner: "Care Partnerships Lead", stage: "Activation" },
  { id: "orthophoniste-learning", name: "Communication & Learning Support", subtitle: "Empowering speech development", partnerType: "Orthophonistes", partners: 38, status: "Active", revenueImpact: 452300, engagement: 71, icon: Activity, accent: "orange", city: "Casablanca", owner: "Clinical Network Owner", stage: "Qualification" },
  { id: "hospitality-family", name: "Hospitality Family Program", subtitle: "Making stays better for families", partnerType: "Hotels", partners: 32, status: "Active", revenueImpact: 745600, engagement: 79, icon: Hotel, accent: "blue", city: "Marrakech / Rabat", owner: "Hospitality Partnerships", stage: "Proposal" },
  { id: "corporate-wellbeing", name: "Corporate Wellbeing Program", subtitle: "Better teams, stronger future", partnerType: "Corporates", partners: 62, status: "Active", revenueImpact: 1089200, engagement: 84, icon: Building2, accent: "emerald", city: "Casablanca / Rabat", owner: "Corporate BD Lead", stage: "Scale" },
  { id: "community-impact", name: "Community Impact Partners", subtitle: "Building stronger communities", partnerType: "Associations", partners: 23, status: "Active", revenueImpact: 298400, engagement: 69, icon: Network, accent: "purple", city: "Rabat / Kenitra", owner: "Community Lead", stage: "Activation" },
]

const defaultOffers: ServiceOffer[] = [
  {
    id: "teacher-training",
    name: "Teacher Training Program",
    description: "Comprehensive training for teaching staff and operational leadership.",
    category: "Training & Capability",
    deliveryMethod: "On-site & Online",
    duration: "40 hours",
    frequency: "Quarterly",
    partnerEligibility: "Active preschool partners",
    targetAudience: "Teachers + Directors",
    includedFor: "All Partners",
    pricingModel: "Included",
    unitPrice: "0 MAD",
    revenueShare: "0%",
    costOwner: "AngelCare Academy",
    capacity: "25 trainees / cohort",
    sla: "Launch within 10 business days",
    requiredResources: "Trainer, curriculum, attendance sheet",
    documents: "Training PDF, attendance proof, attestation template",
    operationalOwner: "Academy Lead",
    kpi: "Completion rate + partner satisfaction",
    status: "Included",
  },
  {
    id: "quality-assessment",
    name: "Quality Assessment",
    description: "Annual quality assessment, scorecard, and improvement roadmap.",
    category: "Quality & Certification",
    deliveryMethod: "On-site Assessment",
    duration: "1 day",
    frequency: "Annual",
    partnerEligibility: "Preferred + strategic partners",
    targetAudience: "Owners + directors",
    includedFor: "Preferred Partners",
    pricingModel: "Premium Add-on",
    unitPrice: "2,500 MAD",
    revenueShare: "100%",
    costOwner: "Partner",
    capacity: "8 assessments / month",
    sla: "Assessment within 15 days",
    requiredResources: "Checklist, auditor, report template",
    documents: "Assessment report, action plan",
    operationalOwner: "Quality Lead",
    kpi: "Quality score improvement",
    status: "Premium Add-on",
  },
]

const defaultPricingRules: PricingRule[] = [
  {
    id: "standard-revenue-share",
    name: "Standard Revenue Share",
    model: "Revenue Share",
    partnerTier: "Standard",
    baseFee: "0 MAD",
    setupFee: "0 MAD",
    monthlyFee: "0 MAD",
    commission: "15%",
    revenueShare: "AngelCare 85% / Partner 15%",
    discountRule: "No discount by default",
    minimumCommitment: "12 months",
    paymentTerms: "Net 30",
    billingCycle: "Monthly",
    currency: "MAD",
    taxRule: "VAT excluded",
    cancellationFee: "0 MAD before activation / 20% after activation",
    renewalRule: "Auto-renew unless cancelled 30 days before end date",
    marginTarget: "35%",
    forecastPartners: "50",
    forecastRevenue: "1,250,000 MAD/year",
    condition: "Applies to referral and lead-sharing partnerships.",
    notes: "Recommended for preschools, clinics, hotels and referral networks.",
    status: "Active",
  },
  {
    id: "premium-fixed-fee",
    name: "Premium Fixed Fee Package",
    model: "Fixed Fee + Add-ons",
    partnerTier: "Preferred",
    baseFee: "7,500 MAD",
    setupFee: "2,500 MAD",
    monthlyFee: "1,500 MAD",
    commission: "0%",
    revenueShare: "AngelCare keeps service revenue",
    discountRule: "10% discount for annual upfront payment",
    minimumCommitment: "6 months",
    paymentTerms: "50% upfront / 50% after activation",
    billingCycle: "Monthly / Annual",
    currency: "MAD",
    taxRule: "VAT excluded",
    cancellationFee: "One month fee",
    renewalRule: "Manual renewal with performance review",
    marginTarget: "45%",
    forecastPartners: "25",
    forecastRevenue: "900,000 MAD/year",
    condition: "Best for premium programs with training, assessment, and certification.",
    notes: "Use where AngelCare delivers heavy operational workload.",
    status: "Negotiable",
  },
]


const defaultContractTerms: ContractTerm[] = [
  {
    id: "standard-mou",
    name: "Standard Partnership MOU",
    contractType: "Memorandum of Understanding",
    partnerTier: "Standard",
    duration: "12 months",
    effectiveDate: "Upon signature",
    renewalType: "Auto-renewal with 30-day notice",
    terminationNotice: "30 days written notice",
    exclusivity: "Non-exclusive",
    territory: "Rabat–Temara / Casablanca",
    serviceScope: "Referral partnership, co-marketing, partner benefits, program activation, reporting.",
    partnerObligations: "Provide decision-maker access, communicate program to families, respect brand and safeguarding guidelines.",
    angelcareObligations: "Provide training, resources, reporting, program management and partner support.",
    paymentTerms: "As defined in Pricing & Revenue rules",
    dataProtection: "Partner data must be handled under confidentiality and limited access rules.",
    confidentiality: "Both parties maintain confidentiality of commercial, family, child and operational information.",
    liability: "Each party is liable for its own staff, actions, omissions and legal obligations.",
    insurance: "Partner confirms required insurance coverage for its premises and operations.",
    compliance: "Safeguarding, child protection, local law, operational policy and AngelCare standards.",
    disputeResolution: "Good-faith escalation, management review, then competent Moroccan jurisdiction.",
    signatureFlow: "Partnership Lead → Finance → Legal → Director Signature",
    approvalOwner: "Partnership Director",
    attachments: "Program brief, pricing annex, service offer annex, safeguarding annex",
    customClause: "Any local or partner-specific condition must be validated before signature.",
    status: "Draft",
  },
  {
    id: "strategic-master-agreement",
    name: "Strategic Master Partnership Agreement",
    contractType: "Master Agreement",
    partnerTier: "Strategic",
    duration: "24 months",
    effectiveDate: "Negotiated start date",
    renewalType: "Manual renewal with performance review",
    terminationNotice: "60 days written notice",
    exclusivity: "Conditional exclusivity by city or category",
    territory: "Multi-city Morocco coverage",
    serviceScope: "Multi-offer activation, revenue sharing, academy sourcing, co-marketing, reporting and expansion governance.",
    partnerObligations: "Nominate owner, approve campaigns, provide monthly data, maintain operational standards and escalation access.",
    angelcareObligations: "Dedicated account management, program execution, analytics, quality review, and growth planning.",
    paymentTerms: "Quarterly invoicing or annual upfront depending on pricing rule.",
    dataProtection: "Restricted data processing and role-based access for all shared information.",
    confidentiality: "Strict confidentiality for commercial terms, pricing, families, children, staff and operational workflows.",
    liability: "Liability capped according to signed contract annex unless mandatory law applies.",
    insurance: "Insurance certificate may be required before launch.",
    compliance: "Legal, safeguarding, partner quality, academy operations and revenue compliance.",
    disputeResolution: "Executive escalation, mediation, then competent Moroccan jurisdiction.",
    signatureFlow: "BD Owner → Finance → Legal → CEO/Director Signature",
    approvalOwner: "Executive Partnerships Lead",
    attachments: "Pricing annex, KPI annex, territory annex, service offer annex, contract checklist",
    customClause: "Strategic terms must include KPI review, renewal review and exit conditions.",
    status: "Legal Review",
  },
]


const defaultEligibilityRequirements: EligibilityRequirement[] = [
  {
    id: "partner-license",
    name: "Partner Legal & Operating Authorization",
    requirementType: "Legal Requirement",
    partnerType: "All Partner Types",
    partnerTier: "Standard",
    priority: "Mandatory",
    verificationMethod: "Document review + manager validation",
    requiredDocument: "Business registration, authorization, license or equivalent proof",
    minimumStandard: "Partner must be legally allowed to operate in its category and city.",
    condition: "Required before any partnership is activated or announced.",
    evidenceOwner: "Partnership Owner",
    reviewFrequency: "Annual",
    riskLevel: "High",
    complianceArea: "Legal / Governance",
    operationalImpact: "Blocks activation if missing.",
    approvalOwner: "Legal / Admin Lead",
    escalationRule: "Escalate to Director if documentation is missing after 7 days.",
    validityPeriod: "12 months",
    onboardingGate: "Before contract signature",
    renewalGate: "Before renewal approval",
    notes: "Keep proof attached to partner dossier.",
    status: "Active",
  },
  {
    id: "safeguarding-standard",
    name: "Child Safeguarding & Quality Standard",
    requirementType: "Safeguarding Requirement",
    partnerType: "Preschools & Kindergarten",
    partnerTier: "Preferred",
    priority: "Mandatory",
    verificationMethod: "Checklist + site review",
    requiredDocument: "Safeguarding policy, staff declaration, emergency protocol",
    minimumStandard: "Partner must respect AngelCare child safety, supervision and incident escalation standards.",
    condition: "Required for all child-facing programs, academy placements, events and referrals.",
    evidenceOwner: "Quality Lead",
    reviewFrequency: "Quarterly",
    riskLevel: "Critical",
    complianceArea: "Safeguarding / Quality",
    operationalImpact: "Blocks child-facing activation if failed.",
    approvalOwner: "Quality & Safeguarding Lead",
    escalationRule: "Immediate escalation for any safeguarding gap.",
    validityPeriod: "90 days review cycle",
    onboardingGate: "Before service delivery",
    renewalGate: "Quarterly review required",
    notes: "Use for preschools, kindergartens, events and child-focused partners.",
    status: "Active",
  },
]


const defaultPublishReview: PublishReview = {
  publishStatus: "Ready for Review",
  launchDate: "June 1, 2025",
  launchOwner: "Partnership Programs Owner",
  approvalRoute: "Program Owner → Finance → Legal → Executive Approval",
  executiveSummary: "Final review confirms that the partnership program is structured with offer logic, pricing rules, contract terms, eligibility gates and activation controls.",
  internalNotes: "Validate that all required owners, legal terms, pricing conditions and safeguarding requirements are complete before publishing.",
  publishChecklist: [
    "Program information reviewed",
    "Services and offers configured",
    "Pricing and revenue rules validated",
    "Contract terms reviewed",
    "Eligibility requirements confirmed",
    "Launch owner assigned",
  ],
  riskNotes: "Program should not be published if mandatory eligibility gates, legal review or pricing approval are incomplete.",
  goLiveConditions: "All mandatory requirements approved, contract template attached, pricing validated and launch owner confirmed.",
  communicationPlan: "Notify Revenue Command Center, Academy, Marketing, Finance and assigned partnership owners.",
  staffInstructions: "Use the program dossier as the source of truth. No partner activation outside the approved pricing, contract and eligibility rules.",
  partnerInstructions: "Partner receives the program brief, benefits overview, contract annexes, launch plan and support contacts.",
  reportingCadence: "Weekly for first 30 days, then monthly.",
  reviewFrequency: "Monthly performance review + quarterly executive review",
  finalApprovalOwner: "Executive Partnerships Lead",
  publishAudience: "Revenue team, partnership team, academy team, marketing, finance",
  activationChannels: "CRM, WhatsApp, email campaigns, partner meetings, academy sourcing",
}

function money(value: number) {
  if (value >= 1000000) return `MAD ${(value / 1000000).toFixed(2)}M`
  if (value >= 1000) return `MAD ${Math.round(value / 1000)}K`
  return `MAD ${value}`
}

function normalizeProgram(p: any): Program {
  const partnerType = p.partner_type || p.partnerType || p.segment || "Preschools & Kindergarten"
  const typeMeta = partnerTypes.find((t) => t.label === partnerType) || partnerTypes[1]
  return {
    id: p.id || p.name || p.title || Math.random().toString(36),
    name: p.name || p.title || "Untitled Partnership Program",
    subtitle: p.subtitle || p.description || "Live synced program",
    partnerType,
    partners: Number(p.partners || p.partner_count || p.total_partners || 0),
    status: p.status || "Active",
    revenueImpact: Number(p.revenueImpact || p.revenue_impact || p.revenue || 0),
    engagement: Number(p.engagement || p.engagement_rate || 0),
    icon: typeMeta.icon,
    accent: typeMeta.accent,
    city: p.city || p.region || "Rabat–Temara",
    owner: p.owner || p.owner_name || "Partnership Owner",
    stage: p.stage || "Active",
    updatedAt: p.updated_at || p.updatedAt,
    offers: p.offers || [],
    pricingRules: p.pricing_rules || p.pricingRules || [],
    contractTerms: p.contract_terms || p.contractTerms || [],
    eligibilityRequirements: p.eligibility_requirements || p.eligibilityRequirements || [],
    publishReview: p.publish_review || p.publishReview || undefined,
  }
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative overflow-hidden rounded-[30px] border border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,.32)] ${className}`}>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  textarea,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  textarea?: boolean
  options?: string[]
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-white">
      {label}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="resize-none rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none placeholder:text-white" />
      ) : options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none">
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none placeholder:text-white" />
      )}
    </label>
  )
}

function Kpi({ icon: Icon, label, value, delta, accent = "violet" }: any) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accentMap[accent]} shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white">{label}</p>
          <p className="mt-1 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs font-black text-white">↑ {delta} vs last 30 days</p>
        </div>
      </div>
    </Card>
  )
}

function Pill({ children, accent = "violet" }: { children: ReactNode; accent?: string }) {
  return <span className={`inline-flex rounded-full border border-white/15 bg-gradient-to-r ${accentMap[accent]} px-3 py-1 text-xs font-black text-white shadow-lg`}>{children}</span>
}

function ProgramDetailsModal({ program, onClose, onSave, onEdit }: { program: Program; onClose: () => void; onSave: (updated: Program) => void; onEdit: (program: Program) => void }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Program>(program)
  const Icon = draft.icon || GraduationCap

  const selectedTypeMeta = partnerTypes.find((type) => type.label === draft.partnerType) || partnerTypes[1]
  const selectedAccent = draft.accent || selectedTypeMeta.accent || "violet"

  const programOffers = draft.offers?.length ? draft.offers : defaultOffers.map((offer, index) => ({
    ...offer,
    includedFor: index === 0 ? draft.partnerType : offer.includedFor,
    operationalOwner: draft.owner || offer.operationalOwner,
  }))

  const programPricingRules = draft.pricingRules?.length ? draft.pricingRules : defaultPricingRules.map((rule, index) => ({
    ...rule,
    forecastRevenue: index === 0 ? money(Number(draft.revenueImpact || 0)) : rule.forecastRevenue,
    forecastPartners: String(draft.partners || rule.forecastPartners),
  }))

  const programContractTerms = draft.contractTerms?.length ? draft.contractTerms : defaultContractTerms.map((term) => ({
    ...term,
    partnerTier: draft.stage || term.partnerTier,
    approvalOwner: draft.owner || term.approvalOwner,
  }))

  const programEligibilityRequirements = draft.eligibilityRequirements?.length ? draft.eligibilityRequirements : defaultEligibilityRequirements.map((req) => ({
    ...req,
    partnerType: draft.partnerType || req.partnerType,
    approvalOwner: draft.owner || req.approvalOwner,
  }))

  const reviewSummary = draft.publishReview || {
    ...defaultPublishReview,
    publishStatus: draft.status === "Active" ? "Published" : "Ready for Review",
    launchOwner: draft.owner || defaultPublishReview.launchOwner,
    executiveSummary: `${draft.name} is structured as a ${draft.partnerType} partnership program with ${draft.partners} connected partners, ${money(Number(draft.revenueImpact || 0))} revenue impact, and ${draft.engagement}% engagement.`,
  }

  function setDraftField(key: keyof Program, value: string) {
    setDraft((prev) => ({
      ...prev,
      [key]: key === "partners" || key === "revenueImpact" || key === "engagement" ? Number(value.replace(/[^\d.]/g, "")) : value,
    }))
  }

  function generateProgramPdf() {
    const referenceId = `AC-PROG-${String(draft.id || "PROGRAM").slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`
    const rows = [
      ["Program", draft.name],
      ["Partner Type", draft.partnerType],
      ["Status", draft.status],
      ["Stage", draft.stage || "Active"],
      ["Owner", draft.owner || "Partnership Owner"],
      ["City Scope", draft.city || "Rabat–Temara"],
      ["Partners", String(draft.partners || 0)],
      ["Revenue Impact", money(Number(draft.revenueImpact || 0))],
      ["Engagement", `${draft.engagement || 0}%`],
    ]

    const tableRows = rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("")
    const offerRows = programOffers.map((offer) => `<tr><td>${offer.name}</td><td>${offer.status}</td><td>${offer.deliveryMethod}</td><td>${offer.duration}</td><td>${offer.operationalOwner}</td></tr>`).join("")
    const pricingRows = programPricingRules.map((rule) => `<tr><td>${rule.name}</td><td>${rule.model}</td><td>${rule.partnerTier}</td><td>${rule.revenueShare}</td><td>${rule.forecastRevenue}</td></tr>`).join("")
    const contractRows = programContractTerms.map((term) => `<tr><td>${term.name}</td><td>${term.contractType}</td><td>${term.duration}</td><td>${term.status}</td><td>${term.approvalOwner}</td></tr>`).join("")
    const eligibilityRows = programEligibilityRequirements.map((req) => `<tr><td>${req.name}</td><td>${req.priority}</td><td>${req.riskLevel}</td><td>${req.reviewFrequency}</td><td>${req.approvalOwner}</td></tr>`).join("")

    const html = `<!doctype html>
<html>
<head>
  <title>${referenceId}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font-family: Inter, Arial, sans-serif; background: #fff; }
    .page { min-height: 268mm; page-break-after: always; padding: 0; position: relative; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: .18em; color: #111827; }
    .subtitle { margin-top: 4px; color:#4b5563; font-size: 12px; font-weight: 700; }
    .ref { text-align:right; font-size: 11px; color:#374151; font-weight: 700; line-height:1.7; }
    h1 { font-size: 31px; margin: 20px 0 8px; letter-spacing: -.04em; color:#111827; }
    h2 { font-size: 18px; margin: 18px 0 10px; color:#111827; border-left: 5px solid #7c3aed; padding-left: 10px; }
    p { color:#374151; line-height:1.55; font-size: 12px; }
    .grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
    .card { border:1px solid #e5e7eb; border-radius: 14px; padding: 12px; background:#f8fafc; }
    .label { font-size:10px; text-transform: uppercase; letter-spacing:.14em; font-weight:900; color:#6b7280; }
    .value { margin-top: 6px; font-size: 18px; font-weight: 900; color:#111827; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 11px; }
    th { background:#111827; color:#fff; text-align:left; padding:9px; font-size:10px; text-transform:uppercase; letter-spacing:.08em; }
    td { border:1px solid #e5e7eb; padding:9px; vertical-align:top; color:#111827; }
    .footer { position:absolute; bottom:0; left:0; right:0; display:flex; justify-content:space-between; border-top:1px solid #e5e7eb; padding-top:8px; font-size:10px; color:#6b7280; font-weight:700; }
    .badge { display:inline-block; background:#ede9fe; color:#5b21b6; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:900; }
    .notice { background:#eef2ff; border:1px solid #c7d2fe; border-radius:16px; padding:14px; margin:14px 0; }
  </style>
</head>
<body>
  <section class="page">
    <div class="header">
      <div>
        <div class="brand">ANGELCARE</div>
        <div class="subtitle">Partnership Program Corporate Dossier</div>
      </div>
      <div class="ref">
        Reference: ${referenceId}<br/>
        Generated: ${new Date().toLocaleDateString()}<br/>
        Status: ${draft.status}
      </div>
    </div>
    <span class="badge">${draft.partnerType}</span>
    <h1>${draft.name}</h1>
    <p>${draft.subtitle}</p>
    <div class="grid">
      <div class="card"><div class="label">Partners</div><div class="value">${draft.partners}</div></div>
      <div class="card"><div class="label">Revenue Impact</div><div class="value">${money(Number(draft.revenueImpact || 0))}</div></div>
      <div class="card"><div class="label">Engagement</div><div class="value">${draft.engagement}%</div></div>
    </div>
    <h2>Program Identity</h2>
    <table>${tableRows}</table>
    <h2>Executive Summary</h2>
    <div class="notice"><p>${reviewSummary.executiveSummary}</p></div>
    <h2>Services & Offers</h2>
    <table><thead><tr><th>Offer</th><th>Status</th><th>Delivery</th><th>Duration</th><th>Owner</th></tr></thead><tbody>${offerRows}</tbody></table>
    <div class="footer"><span>${referenceId}</span><span>AngelCare Revenue Command Center · Page 1/2</span></div>
  </section>

  <section class="page">
    <div class="header">
      <div>
        <div class="brand">ANGELCARE</div>
        <div class="subtitle">Commercial, Contractual & Publishing Controls</div>
      </div>
      <div class="ref">
        Reference: ${referenceId}<br/>
        Program: ${draft.name}<br/>
        Confidential Corporate Document
      </div>
    </div>
    <h2>Pricing & Revenue Rules</h2>
    <table><thead><tr><th>Rule</th><th>Model</th><th>Tier</th><th>Share</th><th>Forecast</th></tr></thead><tbody>${pricingRows}</tbody></table>
    <h2>Contracts & Terms</h2>
    <table><thead><tr><th>Contract</th><th>Type</th><th>Duration</th><th>Status</th><th>Approval Owner</th></tr></thead><tbody>${contractRows}</tbody></table>
    <h2>Eligibility & Requirements</h2>
    <table><thead><tr><th>Requirement</th><th>Priority</th><th>Risk</th><th>Review</th><th>Owner</th></tr></thead><tbody>${eligibilityRows}</tbody></table>
    <h2>Review & Publish</h2>
    <table>
      <tr><th>Publish Status</th><td>${reviewSummary.publishStatus}</td></tr>
      <tr><th>Launch Owner</th><td>${reviewSummary.launchOwner}</td></tr>
      <tr><th>Approval Route</th><td>${reviewSummary.approvalRoute}</td></tr>
      <tr><th>Go-Live Conditions</th><td>${reviewSummary.goLiveConditions}</td></tr>
      <tr><th>Reporting Cadence</th><td>${reviewSummary.reportingCadence}</td></tr>
    </table>
    <div class="footer"><span>${referenceId}</span><span>AngelCare Revenue Command Center · Page 2/2</span></div>
  </section>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

    const pdfWindow = window.open("", "_blank", "width=1200,height=900")
    if (!pdfWindow) return
    pdfWindow.document.open()
    pdfWindow.document.write(html)
    pdfWindow.document.close()
  }

  const steps = [
    { id: 1, title: "Program Information", desc: "Identity and core details" },
    { id: 2, title: "Service Offers", desc: "Configured offers and benefits" },
    { id: 3, title: "Pricing & Revenue", desc: "Commercial parameters" },
    { id: 4, title: "Contracts & Terms", desc: "Legal and contractual controls" },
    { id: 5, title: "Eligibility & Requirements", desc: "Activation requirements" },
    { id: 6, title: "Review & Publish", desc: "Final approval and PDF" },
  ]

  return (
    <div className="fixed inset-0 z-[2300] overflow-y-auto bg-black/75 p-5 backdrop-blur-xl">
      <div className="mx-auto min-h-[94vh] w-full max-w-[1900px] rounded-[34px] border border-white/15 bg-[#081224] p-8 text-white shadow-2xl">
        <div className="mb-7 flex items-start justify-between">
          <div className="flex items-start gap-5">
            <div className={`flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br ${accentMap[selectedAccent] || accentMap.violet} shadow-xl`}>
              <Icon className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white">Selected Partnership Program</p>
              <h2 className="mt-2 text-4xl font-black text-white">{draft.name}</h2>
              <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-white">
                View mode by default. Click Edit to manually update program information, then Save & Close. Generate PDF exports a corporate two-page dossier.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill accent={selectedAccent}>{draft.partnerType}</Pill>
                <Pill accent="emerald">{draft.status}</Pill>
                <Pill accent="blue">{draft.stage || "Active"}</Pill>
                <Pill accent="purple">View Mode</Pill>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={() => onEdit(draft)} className="rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-3 font-black text-white hover:bg-white/[0.14]">
              <Pencil className="mr-2 inline h-4 w-4 text-white" />
              Edit Full Program
            </button>
            <button onClick={generateProgramPdf} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 font-black text-white shadow-xl">
              <FileText className="mr-2 inline h-4 w-4 text-white" />
              Generate PDF
            </button>
            <button onClick={() => { onSave(draft); onClose(); }} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-black text-white shadow-xl">
              <Save className="mr-2 inline h-4 w-4 text-white" />
              Save & Close
            </button>
            <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3 text-white hover:bg-white/[0.14]">
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[300px_1fr_330px]">
          <aside className="space-y-4">
            {steps.map((item) => (
              <button key={item.id} onClick={() => setStep(item.id)} className={`flex w-full gap-4 rounded-2xl border p-5 text-left ${step === item.id ? "border-violet-300/40 bg-violet-600/25" : "border-white/15 bg-white/[0.07]"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${step === item.id ? "bg-violet-600" : "bg-white/15"}`}>{item.id}</span>
                <span>
                  <span className="block font-black text-white">{item.title}</span>
                  <span className="mt-1 block text-xs font-bold text-white">{item.desc}</span>
                </span>
              </button>
            ))}

            <Card className="bg-violet-600/10">
              <p className="text-lg font-black text-white">Program Dossier</p>
              <p className="mt-3 text-sm font-bold leading-6 text-white">Selected program is opened with the same six-step enterprise structure used for creation, but starts in protected view mode.</p>
            </Card>
          </aside>

          <main className="space-y-7">
            {step === 1 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Program Information</h3>
                <p className="mt-2 text-sm font-bold text-white">Core identity, ownership, status, market scope and operational metrics.</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[
                    ["Program Name", "name"],
                    ["Short Description", "subtitle"],
                    ["Partner Type", "partnerType"],
                    ["Status", "status"],
                    ["Owner", "owner"],
                    ["City Scope", "city"],
                    ["Stage", "stage"],
                    ["Partners", "partners"],
                    ["Revenue Impact", "revenueImpact"],
                    ["Engagement", "engagement"],
                  ].map(([label, key]) => (
                    <label key={key} className="grid gap-2 text-sm font-black text-white">
                      {label}
                      <input
                        disabled
                        value={String((draft as any)[key] ?? "")}
                        onChange={(e) => setDraftField(key as keyof Program, e.target.value)}
                        className="rounded-2xl border border-white/15 bg-[#070d1c] px-4 py-3 text-white outline-none disabled:opacity-100"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 2 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Services & Offers</h3>
                <p className="mt-2 text-sm font-bold text-white">Program service offers displayed from the selected program structure.</p>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {programOffers.map((offer) => (
                    <div key={offer.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-black text-white">{offer.name}</h4>
                          <p className="mt-2 text-sm font-bold leading-6 text-white">{offer.description}</p>
                        </div>
                        <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white">{offer.status}</span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          ["Delivery", offer.deliveryMethod],
                          ["Duration", offer.duration],
                          ["Pricing", offer.pricingModel],
                          ["Owner", offer.operationalOwner],
                          ["KPI", offer.kpi],
                          ["Documents", offer.documents],
                        ].map(([a, b]) => (
                          <div key={a} className="rounded-2xl bg-white/[0.06] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{a}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-white">{b}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 3 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Pricing & Revenue</h3>
                <p className="mt-2 text-sm font-bold text-white">Commercial parameters, forecast, fees, margin and revenue-share logic.</p>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {programPricingRules.map((rule) => (
                    <div key={rule.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                      <h4 className="text-xl font-black text-white">{rule.name}</h4>
                      <p className="mt-2 text-sm font-bold leading-6 text-white">{rule.condition}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          ["Model", rule.model],
                          ["Tier", rule.partnerTier],
                          ["Base Fee", rule.baseFee],
                          ["Monthly Fee", rule.monthlyFee],
                          ["Revenue Share", rule.revenueShare],
                          ["Forecast", rule.forecastRevenue],
                          ["Payment Terms", rule.paymentTerms],
                          ["Margin Target", rule.marginTarget],
                        ].map(([a, b]) => (
                          <div key={a} className="rounded-2xl bg-white/[0.06] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{a}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-white">{b}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 4 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Contracts & Terms</h3>
                <p className="mt-2 text-sm font-bold text-white">Contractual controls, obligations, approval flow, compliance and annex references.</p>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {programContractTerms.map((term) => (
                    <div key={term.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                      <h4 className="text-xl font-black text-white">{term.name}</h4>
                      <p className="mt-2 text-sm font-bold leading-6 text-white">{term.serviceScope}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          ["Type", term.contractType],
                          ["Duration", term.duration],
                          ["Renewal", term.renewalType],
                          ["Termination", term.terminationNotice],
                          ["Territory", term.territory],
                          ["Approval Owner", term.approvalOwner],
                          ["Signature Flow", term.signatureFlow],
                          ["Attachments", term.attachments],
                        ].map(([a, b]) => (
                          <div key={a} className="rounded-2xl bg-white/[0.06] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{a}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-white">{b}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 5 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Eligibility & Requirements</h3>
                <p className="mt-2 text-sm font-bold text-white">Activation gates, verification logic, risk levels, required documents and review cycles.</p>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {programEligibilityRequirements.map((req) => (
                    <div key={req.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                      <h4 className="text-xl font-black text-white">{req.name}</h4>
                      <p className="mt-2 text-sm font-bold leading-6 text-white">{req.minimumStandard}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {[
                          ["Type", req.requirementType],
                          ["Priority", req.priority],
                          ["Risk", req.riskLevel],
                          ["Document", req.requiredDocument],
                          ["Verification", req.verificationMethod],
                          ["Review", req.reviewFrequency],
                          ["Owner", req.approvalOwner],
                          ["Gate", req.onboardingGate],
                        ].map(([a, b]) => (
                          <div key={a} className="rounded-2xl bg-white/[0.06] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-white">{a}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-white">{b}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {step === 6 ? (
              <Card className="bg-[#0a1020]">
                <h3 className="text-3xl font-black text-white">Review & Publish</h3>
                <p className="mt-2 text-sm font-bold text-white">Final corporate review and export-ready publishing control.</p>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {[
                    ["Publish Status", reviewSummary.publishStatus],
                    ["Launch Owner", reviewSummary.launchOwner],
                    ["Approval Route", reviewSummary.approvalRoute],
                    ["Go-Live Conditions", reviewSummary.goLiveConditions],
                    ["Communication Plan", reviewSummary.communicationPlan],
                    ["Reporting Cadence", reviewSummary.reportingCadence],
                    ["Staff Instructions", reviewSummary.staffInstructions],
                    ["Partner Instructions", reviewSummary.partnerInstructions],
                  ].map(([a, b]) => (
                    <div key={a} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{a}</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-white">{b}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button onClick={generateProgramPdf} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-4 font-black text-white">
                    <FileText className="mr-2 inline h-5 w-5 text-white" />
                    Generate Corporate PDF
                  </button>
                  <button onClick={() => { onSave(draft); onClose(); }} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-black text-white">
                    <Save className="mr-2 inline h-5 w-5 text-white" />
                    Save & Close
                  </button>
                </div>
              </Card>
            ) : null}
          </main>

          <aside className="space-y-6">
            <Card className="bg-[#0a1020]">
              <h3 className="text-xl font-black text-white">Selected Program Summary</h3>
              <div className="mt-5 space-y-4">
                {[
                  ["Program", draft.name],
                  ["Partner Type", draft.partnerType],
                  ["Status", draft.status],
                  ["Partners", String(draft.partners || 0)],
                  ["Revenue Impact", money(Number(draft.revenueImpact || 0))],
                  ["Engagement", `${draft.engagement || 0}%`],
                  ["Owner", draft.owner || "Partnership Owner"],
                  ["City", draft.city || "Rabat–Temara"],
                ].map(([a, b]) => (
                  <div key={a}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{a}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-white">{b}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-[#0a1020]">
              <h3 className="text-xl font-black text-white">Dossier Coverage</h3>
              <div className="mt-5 space-y-3">
                {[
                  ["Program Information", true],
                  ["Services & Offers", true],
                  ["Pricing & Revenue", true],
                  ["Contracts & Terms", true],
                  ["Eligibility & Requirements", true],
                  ["Review & Publish", true],
                ].map(([label]) => (
                  <label key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-sm font-black text-white">
                    <input type="checkbox" checked readOnly className="h-5 w-5 accent-emerald-500" />
                    {label}
                  </label>
                ))}
              </div>
            </Card>

            <Card className="bg-violet-600/10">
              <h3 className="text-xl font-black text-white">PDF Export</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-white">Generates a corporate two-page dossier with structured tables, sectioning, footer, reference ID and full program summary.</p>
              <button onClick={generateProgramPdf} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-4 font-black text-white">
                Generate PDF
              </button>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}


function PricingRuleCard({
  rule,
  active,
  index,
  onClick,
}: {
  rule: PricingRule
  active: boolean
  index: number
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`w-full rounded-3xl border p-5 text-left transition ${active ? "border-emerald-300 bg-emerald-500/20" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.11]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Pricing Rule {index + 1}</p>
          <h4 className="mt-2 text-lg font-black text-white">{rule.name}</h4>
          <p className="mt-2 text-xs font-bold leading-5 text-white">{rule.condition}</p>
        </div>
        <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white">{rule.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white">
        <span className="rounded-xl bg-white/[0.08] px-3 py-2">{rule.model}</span>
        <span className="rounded-xl bg-white/[0.08] px-3 py-2">{rule.partnerTier}</span>
        <span className="rounded-xl bg-white/[0.08] px-3 py-2">{rule.monthlyFee}</span>
        <span className="rounded-xl bg-white/[0.08] px-3 py-2">{rule.marginTarget}</span>
      </div>
    </button>
  )
}

function CreateProgramModal({
  selectedType,
  onClose,
  onSave,
  mode = "create",
  initialProgram = null,
}: {
  selectedType: string
  onClose: () => void
  onSave: (program: Program) => void
  mode?: "create" | "edit"
  initialProgram?: Program | null
}) {
  const [step, setStep] = useState(1)
  const initialPartnerType = initialProgram?.partnerType || (selectedType === "All Programs" ? "Preschools & Kindergarten" : selectedType)
  const [status, setStatus] = useState<"Draft" | "Active">(initialProgram?.status === "Active" ? "Active" : "Draft")
  const [form, setForm] = useState({
    name: initialProgram?.name || "Angelcare Preschool Excellence Program",
    partnerType: initialPartnerType,
    category: initialProgram?.stage || "Education Partnership",
    shortDescription: initialProgram?.subtitle || "Premium partnership program for preschools and kindergartens to enhance early childhood education standards.",
    detailedDescription:
      initialProgram?.subtitle ||
      "The Angelcare Preschool Excellence Program is designed to support preschools and kindergartens in delivering exceptional early childhood education and care. Through comprehensive training, resources, and ongoing support, we help our partners achieve excellence in child development and operational management.",
    color: "#8B5CF6",
    launch: initialProgram?.updatedAt || "June 1, 2025",
    targetPartners: `${initialProgram?.partners || 50}+ partners`,
    revenue: initialProgram?.revenueImpact ? money(Number(initialProgram.revenueImpact)) : "MAD 1,250,000/year",
  })
  const initialOffers = initialProgram?.offers?.length ? initialProgram.offers : defaultOffers
  const initialPricingRules = initialProgram?.pricingRules?.length ? initialProgram.pricingRules : defaultPricingRules
  const initialContractTerms = initialProgram?.contractTerms?.length ? initialProgram.contractTerms : defaultContractTerms
  const initialEligibilityRequirements = initialProgram?.eligibilityRequirements?.length ? initialProgram.eligibilityRequirements : defaultEligibilityRequirements
  const [offers, setOffers] = useState<ServiceOffer[]>(initialOffers)
  const [selectedOfferId, setSelectedOfferId] = useState(initialOffers[0]?.id || "")
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(initialPricingRules)
  const [selectedPricingId, setSelectedPricingId] = useState(initialPricingRules[0]?.id || "")
  const [contractTerms, setContractTerms] = useState<ContractTerm[]>(initialContractTerms)
  const [selectedContractId, setSelectedContractId] = useState(initialContractTerms[0]?.id || "")
  const [eligibilityRequirements, setEligibilityRequirements] = useState<EligibilityRequirement[]>(initialEligibilityRequirements)
  const [selectedEligibilityId, setSelectedEligibilityId] = useState(initialEligibilityRequirements[0]?.id || "")
  const [publishReview, setPublishReview] = useState<PublishReview>(initialProgram?.publishReview || defaultPublishReview)

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0]
  const selectedPricing = pricingRules.find((p) => p.id === selectedPricingId) || pricingRules[0]
  const selectedContract = contractTerms.find((c) => c.id === selectedContractId) || contractTerms[0]
  const selectedEligibility = eligibilityRequirements.find((e) => e.id === selectedEligibilityId) || eligibilityRequirements[0]

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateOffer(key: keyof ServiceOffer, value: string) {
    setOffers((prev) => prev.map((offer) => offer.id === selectedOfferId ? { ...offer, [key]: value } : offer))
  }

  function updatePricing(key: keyof PricingRule, value: string) {
    setPricingRules((prev) => prev.map((rule) => rule.id === selectedPricingId ? { ...rule, [key]: value } : rule))
  }

  function addOffer() {
    const id = `offer-${Date.now()}`
    const offer: ServiceOffer = {
      id,
      name: "New Service Offer",
      description: "Describe the service, benefit, operational promise and partner value.",
      category: "Service Offer",
      deliveryMethod: "Hybrid",
      duration: "Ongoing",
      frequency: "Monthly",
      partnerEligibility: "All active partners",
      targetAudience: "Parents + partner team",
      includedFor: "All Partners",
      pricingModel: "Included",
      unitPrice: "0 MAD",
      revenueShare: "0%",
      costOwner: "AngelCare",
      capacity: "To define",
      sla: "To define",
      requiredResources: "To define",
      documents: "To define",
      operationalOwner: "Program Owner",
      kpi: "Engagement + conversion",
      status: "Included",
    }
    setOffers((prev) => [offer, ...prev])
    setSelectedOfferId(id)
  }

  function removeOffer(id: string) {
    setOffers((prev) => prev.filter((o) => o.id !== id))
    if (selectedOfferId === id) setSelectedOfferId(offers.find((o) => o.id !== id)?.id || "")
  }

  function addPricingRule() {
    const id = `pricing-${Date.now()}`
    const rule: PricingRule = {
      id,
      name: "New Pricing Parameter",
      model: "Custom Quote",
      partnerTier: "Standard",
      baseFee: "0 MAD",
      setupFee: "0 MAD",
      monthlyFee: "0 MAD",
      commission: "0%",
      revenueShare: "To define",
      discountRule: "To define",
      minimumCommitment: "To define",
      paymentTerms: "Net 30",
      billingCycle: "Monthly",
      currency: "MAD",
      taxRule: "VAT excluded",
      cancellationFee: "To define",
      renewalRule: "To define",
      marginTarget: "35%",
      forecastPartners: "0",
      forecastRevenue: "0 MAD/year",
      condition: "Define when this pricing rule applies.",
      notes: "Manual enterprise pricing rule.",
      status: "Draft",
    }
    setPricingRules((prev) => [rule, ...prev])
    setSelectedPricingId(id)
  }

  function removePricingRule(id: string) {
    setPricingRules((prev) => prev.filter((rule) => rule.id !== id))
    if (selectedPricingId === id) setSelectedPricingId(pricingRules.find((rule) => rule.id !== id)?.id || "")
  }

  function updateContract(key: keyof ContractTerm, value: string) {
    setContractTerms((prev) => prev.map((term) => term.id === selectedContractId ? { ...term, [key]: value } : term))
  }

  function addContractTerm() {
    const id = `contract-${Date.now()}`
    const term: ContractTerm = {
      id,
      name: "New Contract Type / Terms Set",
      contractType: "Custom Agreement",
      partnerTier: "Standard",
      duration: "12 months",
      effectiveDate: "Upon signature",
      renewalType: "Manual renewal",
      terminationNotice: "30 days written notice",
      exclusivity: "Non-exclusive",
      territory: "To define",
      serviceScope: "Define exact scope of services, offers and program activation.",
      partnerObligations: "Define partner obligations.",
      angelcareObligations: "Define AngelCare obligations.",
      paymentTerms: "As per pricing rules",
      dataProtection: "To define",
      confidentiality: "Standard confidentiality",
      liability: "To define",
      insurance: "To define",
      compliance: "Safeguarding, child protection and operational compliance",
      disputeResolution: "Management escalation then legal route",
      signatureFlow: "Partnership Owner → Finance → Legal → Director",
      approvalOwner: "Partnership Director",
      attachments: "Pricing annex, service annex, compliance annex",
      customClause: "Manual clause to define.",
      status: "Draft",
    }
    setContractTerms((prev) => [term, ...prev])
    setSelectedContractId(id)
  }

  function removeContractTerm(id: string) {
    setContractTerms((prev) => prev.filter((term) => term.id !== id))
    if (selectedContractId === id) setSelectedContractId(contractTerms.find((term) => term.id !== id)?.id || "")
  }

  function updateEligibility(key: keyof EligibilityRequirement, value: string) {
    setEligibilityRequirements((prev) => prev.map((req) => req.id === selectedEligibilityId ? { ...req, [key]: value } : req))
  }

  function addEligibilityRequirement() {
    const id = `eligibility-${Date.now()}`
    const requirement: EligibilityRequirement = {
      id,
      name: "New Eligibility / Requirement Rule",
      requirementType: "Operational Requirement",
      partnerType: form.partnerType,
      partnerTier: "Standard",
      priority: "Mandatory",
      verificationMethod: "Manual review",
      requiredDocument: "To define",
      minimumStandard: "To define",
      condition: "Define when this requirement applies.",
      evidenceOwner: "Partnership Owner",
      reviewFrequency: "Annual",
      riskLevel: "Medium",
      complianceArea: "Operations",
      operationalImpact: "To define",
      approvalOwner: "Program Manager",
      escalationRule: "Escalate if missing before activation.",
      validityPeriod: "12 months",
      onboardingGate: "Before activation",
      renewalGate: "Before renewal",
      notes: "Manual enterprise requirement.",
      status: "Draft",
    }
    setEligibilityRequirements((prev) => [requirement, ...prev])
    setSelectedEligibilityId(id)
  }

  function removeEligibilityRequirement(id: string) {
    setEligibilityRequirements((prev) => prev.filter((req) => req.id !== id))
    if (selectedEligibilityId === id) setSelectedEligibilityId(eligibilityRequirements.find((req) => req.id !== id)?.id || "")
  }

  function updatePublishReview(key: keyof PublishReview, value: string) {
    setPublishReview((prev) => ({ ...prev, [key]: value }))
  }

  function togglePublishChecklist(item: string) {
    setPublishReview((prev) => ({
      ...prev,
      publishChecklist: prev.publishChecklist.includes(item)
        ? prev.publishChecklist.filter((x) => x !== item)
        : [...prev.publishChecklist, item],
    }))
  }

  function addPublishChecklistItem() {
    const item = `Manual approval item ${publishReview.publishChecklist.length + 1}`
    setPublishReview((prev) => ({ ...prev, publishChecklist: [...prev.publishChecklist, item] }))
  }

  function save() {
    const meta = partnerTypes.find((p) => p.label === form.partnerType) || partnerTypes[1]
    const forecastRevenue = pricingRules.reduce((total, rule) => {
      const clean = Number(String(rule.forecastRevenue).replace(/[^\d]/g, "")) || 0
      return total + clean
    }, 0)
    const targetPartners = Number(String(form.targetPartners).replace(/[^\d]/g, "")) || initialProgram?.partners || 0

    onSave({
      ...(initialProgram || {}),
      id: initialProgram?.id || `program-${Date.now()}`,
      name: form.name,
      subtitle: form.shortDescription,
      partnerType: form.partnerType,
      partners: targetPartners,
      status,
      revenueImpact: forecastRevenue || initialProgram?.revenueImpact || 1250000,
      engagement: initialProgram?.engagement || 0,
      icon: meta.icon,
      accent: meta.accent,
      city: initialProgram?.city || "Rabat–Temara",
      owner: publishReview.launchOwner || initialProgram?.owner || "Partnership Programs Owner",
      stage: step >= 6 ? publishReview.publishStatus : initialProgram?.stage || "Draft",
      offers,
      pricingRules,
      contractTerms,
      eligibilityRequirements,
      publishReview,
      updatedAt: new Date().toISOString(),
    })
  }

  const stepMeta = [
    ["Program Information", "Basic program details"],
    ["Service Offers", "Configure offers & benefits"],
    ["Pricing & Revenue", "Pricing structure & revenue share"],
    ["Contract & Terms", "Contract duration & terms"],
    ["Eligibility & Requirements", "Partner requirements"],
    ["Review & Publish", "Review and publish program"],
  ]

  const forecastTotal = pricingRules.reduce((total, rule) => total + (Number(String(rule.forecastRevenue).replace(/[^\d]/g, "")) || 0), 0)
  const avgMargin = Math.round(pricingRules.reduce((total, rule) => total + (Number(String(rule.marginTarget).replace(/[^\d]/g, "")) || 0), 0) / Math.max(1, pricingRules.length))
  const totalForecastPartners = pricingRules.reduce((total, rule) => total + (Number(String(rule.forecastPartners).replace(/[^\d]/g, "")) || 0), 0)
  const legalReviewCount = contractTerms.filter((term) => term.status === "Legal Review" || term.status === "Approval Required").length
  const activeContractCount = contractTerms.filter((term) => term.status === "Active").length
  const mandatoryRequirements = eligibilityRequirements.filter((req) => req.priority === "Mandatory").length
  const criticalRequirements = eligibilityRequirements.filter((req) => req.riskLevel === "Critical" || req.riskLevel === "High").length
  const blockedRequirements = eligibilityRequirements.filter((req) => req.status === "Blocked" || req.status === "Needs Review").length

  return (
    <div className="fixed inset-0 z-[2300] overflow-y-auto bg-black/75 p-5 backdrop-blur-xl">
      <div className="mx-auto min-h-[94vh] w-full max-w-[1900px] rounded-[34px] border border-white/15 bg-[#081224] p-8 text-white shadow-2xl">
        <div className="mb-7 flex items-start justify-between">
          <div>
            <h2 className="text-4xl font-black text-white">{mode === "edit" ? "Edit Partnership Program" : "Create New Partnership Program"}</h2>
            <p className="mt-2 text-sm font-bold text-white">{mode === "edit" ? "Edit every layer of the selected program. Saving updates the preview and PDF data immediately." : "Build a comprehensive partnership program with multiple offers, pricing, and contract terms."}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3 text-white hover:bg-white/[0.14]"><X className="h-5 w-5 text-white" /></button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[300px_1fr_330px]">
          <aside className="space-y-4">
            {stepMeta.map(([title, sub], i) => (
              <button key={title} onClick={() => setStep(i + 1)} className={`flex w-full gap-4 rounded-2xl border p-5 text-left ${step === i + 1 ? "border-violet-300/40 bg-violet-600/25" : "border-white/15 bg-white/[0.07]"}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${step === i + 1 ? "bg-violet-600" : i + 1 < step ? "bg-emerald-600" : "bg-white/15"}`}>{i + 1}</span>
                <span><span className="block font-black text-white">{title}</span><span className="mt-1 block text-xs font-bold text-white">{sub}</span></span>
              </button>
            ))}

            <div className="mt-20 rounded-3xl border border-violet-300/20 bg-violet-600/10 p-6">
              <p className="text-lg font-black text-white">Multi-layer Program</p>
              <p className="mt-3 text-sm font-bold leading-6 text-white">Create comprehensive programs with multiple service offers, flexible pricing model, and advanced contract management.</p>
              <button className="mt-5 text-sm font-black text-white">Learn more →</button>
            </div>
          </aside>

          <main className="space-y-7">
            {step === 1 ? (
              <Card className="bg-[#0a1020]">
                <div className="grid gap-8 xl:grid-cols-[1fr_220px]">
                  <div><h3 className="text-2xl font-black text-white">Program Information</h3><p className="mt-2 text-sm font-bold text-white">Basic details about your partnership program</p></div>
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white">Program Status</p>
                    <div className="grid grid-cols-2 rounded-2xl border border-white/15 bg-white/[0.07] p-1">
                      {["Draft", "Active"].map((s) => <button key={s} onClick={() => setStatus(s as "Draft" | "Active")} className={`rounded-xl px-4 py-3 text-sm font-black text-white ${status === s ? "bg-violet-600" : ""}`}>{s}</button>)}
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-5">
                  <Field label="Program Name *" value={form.name} onChange={(v) => update("name", v)} />
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Partner Type *" value={form.partnerType} onChange={(v) => update("partnerType", v)} options={partnerTypes.filter((t) => t.label !== "All Programs").map((t) => t.label)} />
                    <Field label="Program Category" value={form.category} onChange={(v) => update("category", v)} options={["Education Partnership", "Healthcare Partnership", "Hospitality Family Program", "Corporate Benefit Program", "Community Impact Program"]} />
                  </div>
                  <Field label="Short Description *" value={form.shortDescription} onChange={(v) => update("shortDescription", v)} />
                  <Field label="Detailed Description" value={form.detailedDescription} onChange={(v) => update("detailedDescription", v)} textarea />
                </div>
              </Card>
            ) : null}

            {step === 2 ? (
              <>
                <Card className="bg-[radial-gradient(circle_at_12%_0%,rgba(124,58,237,.24),transparent_32%),linear-gradient(145deg,rgba(10,16,32,.99),rgba(8,18,40,.98))]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-100">Step 2 • Enterprise Services & Offers</p>
                      <h3 className="mt-2 text-3xl font-black text-white">Service Offers & Benefits Builder</h3>
                      <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-white">
                        Add one or multiple services, benefits, offers, pricing rules, delivery logic, eligibility, resources, documents, owners and KPIs for this partnership program.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={addOffer} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4 text-white" />Add Service Offer</button>
                      <button className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Import className="mr-2 inline h-4 w-4 text-white" />Bulk Import</button>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="space-y-3">
                      {offers.map((offer, index) => (
                        <button key={offer.id} onClick={() => setSelectedOfferId(offer.id)} className={`w-full rounded-3xl border p-5 text-left transition ${selectedOfferId === offer.id ? "border-violet-300 bg-violet-600/30" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.11]"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Offer {index + 1}</p>
                              <h4 className="mt-2 text-lg font-black text-white">{offer.name}</h4>
                              <p className="mt-2 text-xs font-bold leading-5 text-white">{offer.description}</p>
                            </div>
                            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">{offer.status}</span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white">
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{offer.deliveryMethod}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{offer.duration}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[30px] border border-white/15 bg-[#070d1c] p-6">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-white">Offer Details</h4>
                          <p className="mt-2 text-sm font-bold text-white">Configure the selected service or benefit with enterprise operational depth.</p>
                        </div>
                        <button onClick={() => removeOffer(selectedOffer.id)} className="rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-white"><Trash2 className="mr-2 inline h-4 w-4 text-white" />Remove</button>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Offer / Service Name *" value={selectedOffer.name} onChange={(v) => updateOffer("name", v)} />
                        <Field label="Offer Status" value={selectedOffer.status} onChange={(v) => updateOffer("status", v as ServiceOffer["status"])} options={["Included", "Premium Add-on", "Optional", "Pilot"]} />
                        <Field label="Offer Category" value={selectedOffer.category} onChange={(v) => updateOffer("category", v)} options={["Training & Capability", "Resources", "Quality & Certification", "Co-Marketing", "Referral Engine", "Operational Support", "Family Benefit", "Recruitment & Academy"]} />
                        <Field label="Delivery Method" value={selectedOffer.deliveryMethod} onChange={(v) => updateOffer("deliveryMethod", v)} options={["On-site", "Online", "Hybrid", "Digital Access", "Co-marketing", "On-site Assessment", "Partner Location"]} />
                        <Field label="Duration" value={selectedOffer.duration} onChange={(v) => updateOffer("duration", v)} />
                        <Field label="Frequency / Renewal Cycle" value={selectedOffer.frequency} onChange={(v) => updateOffer("frequency", v)} />
                        <Field label="Partner Eligibility" value={selectedOffer.partnerEligibility} onChange={(v) => updateOffer("partnerEligibility", v)} />
                        <Field label="Target Audience" value={selectedOffer.targetAudience} onChange={(v) => updateOffer("targetAudience", v)} />
                        <Field label="Included For" value={selectedOffer.includedFor} onChange={(v) => updateOffer("includedFor", v)} />
                        <Field label="Pricing Model" value={selectedOffer.pricingModel} onChange={(v) => updateOffer("pricingModel", v)} options={["Included", "Fixed Fee", "Revenue Share", "Premium Add-on", "Per Partner", "Per Family", "Custom Quote"]} />
                        <Field label="Unit Price / Package Value" value={selectedOffer.unitPrice} onChange={(v) => updateOffer("unitPrice", v)} />
                        <Field label="Revenue Share / Margin Rule" value={selectedOffer.revenueShare} onChange={(v) => updateOffer("revenueShare", v)} />
                        <Field label="Cost Owner" value={selectedOffer.costOwner} onChange={(v) => updateOffer("costOwner", v)} options={["AngelCare", "Partner", "Shared", "Sponsored", "Client Paid"]} />
                        <Field label="Capacity / Limit" value={selectedOffer.capacity} onChange={(v) => updateOffer("capacity", v)} />
                        <Field label="SLA / Activation Time" value={selectedOffer.sla} onChange={(v) => updateOffer("sla", v)} />
                        <Field label="Operational Owner" value={selectedOffer.operationalOwner} onChange={(v) => updateOffer("operationalOwner", v)} />
                        <Field label="Required Resources" value={selectedOffer.requiredResources} onChange={(v) => updateOffer("requiredResources", v)} textarea />
                        <Field label="Documents / Attachments Needed" value={selectedOffer.documents} onChange={(v) => updateOffer("documents", v)} textarea />
                        <div className="md:col-span-2"><Field label="Description / Partner Value Proposition" value={selectedOffer.description} onChange={(v) => updateOffer("description", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="Success KPI / Measurement" value={selectedOffer.kpi} onChange={(v) => updateOffer("kpi", v)} /></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#0a1020]">
                  <div className="mb-5 flex items-center justify-between">
                    <div><h3 className="text-2xl font-black text-white">Offers Summary</h3><p className="mt-1 text-sm font-bold text-white">Review all configured services before moving to pricing and revenue.</p></div>
                    <p className="text-xl font-black text-white">Total Offers: {offers.length}</p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {offers.map((offer) => (
                      <div key={offer.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div><h4 className="text-lg font-black text-white">{offer.name}</h4><p className="mt-1 text-sm font-bold leading-6 text-white">{offer.description}</p></div>
                          <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white">{offer.status}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-white">
                          <p><span className="font-black">Delivery:</span> {offer.deliveryMethod}</p>
                          <p><span className="font-black">Duration:</span> {offer.duration}</p>
                          <p><span className="font-black">Pricing:</span> {offer.pricingModel}</p>
                          <p><span className="font-black">Owner:</span> {offer.operationalOwner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Card className="bg-[radial-gradient(circle_at_12%_0%,rgba(16,185,129,.24),transparent_34%),linear-gradient(145deg,rgba(10,16,32,.99),rgba(8,18,40,.98))]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100">Step 3 • Pricing & Revenue Command</p>
                      <h3 className="mt-2 text-3xl font-black text-white">Pricing Parameters, Revenue Rules & Conditions</h3>
                      <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-white">
                        Build one or multiple pricing rules with full manual control: fixed fees, setup fees, monthly retainers, revenue share, commission, discounts, payment terms, renewal rules, tax logic, cancellation terms, margin targets and forecast impact.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={addPricingRule} className="rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4 text-white" />Add Pricing Rule</button>
                      <button className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Import className="mr-2 inline h-4 w-4 text-white" />Import Template</button>
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-4">
                    {[
                      ["Forecast Revenue", forecastTotal ? money(forecastTotal) : "MAD 0"],
                      ["Pricing Rules", pricingRules.length],
                      ["Forecast Partners", totalForecastPartners],
                      ["Avg Margin Target", `${avgMargin || 0}%`],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p>
                        <p className="mt-2 text-2xl font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
                    <div className="space-y-3">
                      {pricingRules.map((rule, index) => (
                        <PricingRuleCard key={rule.id} rule={rule} index={index} active={selectedPricingId === rule.id} onClick={() => setSelectedPricingId(rule.id)} />
                      ))}
                    </div>

                    <div className="rounded-[30px] border border-white/15 bg-[#070d1c] p-6">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-white">Pricing Rule Details</h4>
                          <p className="mt-2 text-sm font-bold text-white">Manually configure the selected pricing condition and its enterprise financial logic.</p>
                        </div>
                        <button onClick={() => removePricingRule(selectedPricing.id)} className="rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-white"><Trash2 className="mr-2 inline h-4 w-4 text-white" />Remove</button>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Pricing Rule Name *" value={selectedPricing.name} onChange={(v) => updatePricing("name", v)} />
                        <Field label="Rule Status" value={selectedPricing.status} onChange={(v) => updatePricing("status", v as PricingRule["status"])} options={["Draft", "Active", "Negotiable", "Approval Required"]} />
                        <Field label="Pricing Model" value={selectedPricing.model} onChange={(v) => updatePricing("model", v)} options={["Revenue Share", "Fixed Fee", "Fixed Fee + Add-ons", "Monthly Retainer", "Commission", "Hybrid", "Per Partner", "Per Family", "Custom Quote"]} />
                        <Field label="Partner Tier" value={selectedPricing.partnerTier} onChange={(v) => updatePricing("partnerTier", v)} options={["Standard", "Preferred", "Strategic", "Premium", "Pilot", "Enterprise"]} />
                        <Field label="Base Fee" value={selectedPricing.baseFee} onChange={(v) => updatePricing("baseFee", v)} />
                        <Field label="Setup / Activation Fee" value={selectedPricing.setupFee} onChange={(v) => updatePricing("setupFee", v)} />
                        <Field label="Monthly Fee / Retainer" value={selectedPricing.monthlyFee} onChange={(v) => updatePricing("monthlyFee", v)} />
                        <Field label="Commission %" value={selectedPricing.commission} onChange={(v) => updatePricing("commission", v)} />
                        <Field label="Revenue Share Rule" value={selectedPricing.revenueShare} onChange={(v) => updatePricing("revenueShare", v)} />
                        <Field label="Discount / Promo Rule" value={selectedPricing.discountRule} onChange={(v) => updatePricing("discountRule", v)} />
                        <Field label="Minimum Commitment" value={selectedPricing.minimumCommitment} onChange={(v) => updatePricing("minimumCommitment", v)} />
                        <Field label="Payment Terms" value={selectedPricing.paymentTerms} onChange={(v) => updatePricing("paymentTerms", v)} options={["Due on receipt", "Net 7", "Net 15", "Net 30", "50% upfront / 50% after activation", "Annual upfront", "Custom"]} />
                        <Field label="Billing Cycle" value={selectedPricing.billingCycle} onChange={(v) => updatePricing("billingCycle", v)} options={["One-time", "Monthly", "Quarterly", "Annual", "Per campaign", "Per trainee", "Per family", "Custom"]} />
                        <Field label="Currency" value={selectedPricing.currency} onChange={(v) => updatePricing("currency", v)} options={["MAD", "EUR", "USD"]} />
                        <Field label="Tax / VAT Rule" value={selectedPricing.taxRule} onChange={(v) => updatePricing("taxRule", v)} />
                        <Field label="Cancellation Fee" value={selectedPricing.cancellationFee} onChange={(v) => updatePricing("cancellationFee", v)} />
                        <Field label="Renewal Rule" value={selectedPricing.renewalRule} onChange={(v) => updatePricing("renewalRule", v)} />
                        <Field label="Margin Target" value={selectedPricing.marginTarget} onChange={(v) => updatePricing("marginTarget", v)} />
                        <Field label="Forecast Partners" value={selectedPricing.forecastPartners} onChange={(v) => updatePricing("forecastPartners", v)} />
                        <Field label="Forecast Revenue" value={selectedPricing.forecastRevenue} onChange={(v) => updatePricing("forecastRevenue", v)} />
                        <div className="md:col-span-2"><Field label="Applicability Condition" value={selectedPricing.condition} onChange={(v) => updatePricing("condition", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="Manual Notes / Approval Logic" value={selectedPricing.notes} onChange={(v) => updatePricing("notes", v)} textarea /></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#0a1020]">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white">Pricing Conditions Summary</h3>
                      <p className="mt-1 text-sm font-bold text-white">Review all configured financial parameters before moving to contract and terms.</p>
                    </div>
                    <p className="text-xl font-black text-white">Total Rules: {pricingRules.length}</p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {pricingRules.map((rule) => (
                      <div key={rule.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-white">{rule.name}</h4>
                            <p className="mt-1 text-sm font-bold leading-6 text-white">{rule.condition}</p>
                          </div>
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">{rule.status}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-white">
                          <p><span className="font-black">Model:</span> {rule.model}</p>
                          <p><span className="font-black">Tier:</span> {rule.partnerTier}</p>
                          <p><span className="font-black">Billing:</span> {rule.billingCycle}</p>
                          <p><span className="font-black">Forecast:</span> {rule.forecastRevenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Card className="bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,.24),transparent_34%),linear-gradient(145deg,rgba(10,16,32,.99),rgba(8,18,40,.98))]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">Step 4 • Contracts & Terms Command</p>
                      <h3 className="mt-2 text-3xl font-black text-white">Contract Types, Legal Parameters & Commercial Terms</h3>
                      <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-white">
                        Build one or multiple contract structures with manual enterprise control: contract type, duration, renewal, termination, exclusivity, territory, service scope, obligations, payment terms, data protection, confidentiality, liability, insurance, compliance, dispute handling, signature flow, approvals and custom clauses.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={addContractTerm} className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4 text-white" />Add Contract Type</button>
                      <button className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Import className="mr-2 inline h-4 w-4 text-white" />Import Legal Template</button>
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-4">
                    {[
                      ["Contract Types", contractTerms.length],
                      ["Legal Review", legalReviewCount],
                      ["Active Contracts", activeContractCount],
                      ["Approval Owner", selectedContract.approvalOwner],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p>
                        <p className="mt-2 text-2xl font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
                    <div className="space-y-3">
                      {contractTerms.map((term, index) => (
                        <button key={term.id} onClick={() => setSelectedContractId(term.id)} className={`w-full rounded-3xl border p-5 text-left transition ${selectedContractId === term.id ? "border-blue-300 bg-blue-500/20" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.11]"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Contract Type {index + 1}</p>
                              <h4 className="mt-2 text-lg font-black text-white">{term.name}</h4>
                              <p className="mt-2 text-xs font-bold leading-5 text-white">{term.serviceScope}</p>
                            </div>
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{term.status}</span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white">
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{term.contractType}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{term.partnerTier}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{term.duration}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{term.renewalType}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[30px] border border-white/15 bg-[#070d1c] p-6">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-white">Contract & Terms Details</h4>
                          <p className="mt-2 text-sm font-bold text-white">Manually configure legal, operational, commercial and approval terms for this contract structure.</p>
                        </div>
                        <button onClick={() => removeContractTerm(selectedContract.id)} className="rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-white"><Trash2 className="mr-2 inline h-4 w-4 text-white" />Remove</button>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Contract / Terms Name *" value={selectedContract.name} onChange={(v) => updateContract("name", v)} />
                        <Field label="Contract Status" value={selectedContract.status} onChange={(v) => updateContract("status", v as ContractTerm["status"])} options={["Draft", "Active", "Legal Review", "Approval Required"]} />
                        <Field label="Contract Type" value={selectedContract.contractType} onChange={(v) => updateContract("contractType", v)} options={["Memorandum of Understanding", "Master Agreement", "Service Agreement", "Referral Agreement", "Co-Marketing Agreement", "Corporate Benefits Agreement", "Academy Placement Agreement", "Custom Agreement"]} />
                        <Field label="Partner Tier" value={selectedContract.partnerTier} onChange={(v) => updateContract("partnerTier", v)} options={["Standard", "Preferred", "Strategic", "Premium", "Pilot", "Enterprise"]} />
                        <Field label="Contract Duration" value={selectedContract.duration} onChange={(v) => updateContract("duration", v)} />
                        <Field label="Effective Date" value={selectedContract.effectiveDate} onChange={(v) => updateContract("effectiveDate", v)} />
                        <Field label="Renewal Type" value={selectedContract.renewalType} onChange={(v) => updateContract("renewalType", v)} options={["Auto-renewal with 30-day notice", "Manual renewal", "Manual renewal with performance review", "No renewal", "Custom renewal"]} />
                        <Field label="Termination Notice" value={selectedContract.terminationNotice} onChange={(v) => updateContract("terminationNotice", v)} />
                        <Field label="Exclusivity" value={selectedContract.exclusivity} onChange={(v) => updateContract("exclusivity", v)} options={["Non-exclusive", "Category exclusivity", "Territory exclusivity", "Conditional exclusivity", "Full exclusivity", "Custom"]} />
                        <Field label="Territory / Geographic Scope" value={selectedContract.territory} onChange={(v) => updateContract("territory", v)} />
                        <Field label="Payment Terms Reference" value={selectedContract.paymentTerms} onChange={(v) => updateContract("paymentTerms", v)} />
                        <Field label="Signature / Approval Flow" value={selectedContract.signatureFlow} onChange={(v) => updateContract("signatureFlow", v)} />
                        <Field label="Approval Owner" value={selectedContract.approvalOwner} onChange={(v) => updateContract("approvalOwner", v)} />
                        <Field label="Insurance Requirements" value={selectedContract.insurance} onChange={(v) => updateContract("insurance", v)} />
                        <div className="md:col-span-2"><Field label="Service Scope" value={selectedContract.serviceScope} onChange={(v) => updateContract("serviceScope", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="Partner Obligations" value={selectedContract.partnerObligations} onChange={(v) => updateContract("partnerObligations", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="AngelCare Obligations" value={selectedContract.angelcareObligations} onChange={(v) => updateContract("angelcareObligations", v)} textarea /></div>
                        <Field label="Data Protection / Privacy" value={selectedContract.dataProtection} onChange={(v) => updateContract("dataProtection", v)} textarea />
                        <Field label="Confidentiality" value={selectedContract.confidentiality} onChange={(v) => updateContract("confidentiality", v)} textarea />
                        <Field label="Liability Clause" value={selectedContract.liability} onChange={(v) => updateContract("liability", v)} textarea />
                        <Field label="Compliance Requirements" value={selectedContract.compliance} onChange={(v) => updateContract("compliance", v)} textarea />
                        <Field label="Dispute Resolution" value={selectedContract.disputeResolution} onChange={(v) => updateContract("disputeResolution", v)} textarea />
                        <Field label="Attachments / Annexes" value={selectedContract.attachments} onChange={(v) => updateContract("attachments", v)} textarea />
                        <div className="md:col-span-2"><Field label="Custom Clause / Manual Legal Terms" value={selectedContract.customClause} onChange={(v) => updateContract("customClause", v)} textarea /></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#0a1020]">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white">Contracts & Terms Summary</h3>
                      <p className="mt-1 text-sm font-bold text-white">Review contract structures before moving to eligibility, requirements and publishing.</p>
                    </div>
                    <p className="text-xl font-black text-white">Total Contracts: {contractTerms.length}</p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {contractTerms.map((term) => (
                      <div key={term.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-white">{term.name}</h4>
                            <p className="mt-1 text-sm font-bold leading-6 text-white">{term.serviceScope}</p>
                          </div>
                          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">{term.status}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-white">
                          <p><span className="font-black">Type:</span> {term.contractType}</p>
                          <p><span className="font-black">Tier:</span> {term.partnerTier}</p>
                          <p><span className="font-black">Duration:</span> {term.duration}</p>
                          <p><span className="font-black">Owner:</span> {term.approvalOwner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            {step === 5 ? (
              <>
                <Card className="bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,.24),transparent_34%),linear-gradient(145deg,rgba(10,16,32,.99),rgba(8,18,40,.98))]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-100">Step 5 • Eligibility & Requirements Command</p>
                      <h3 className="mt-2 text-3xl font-black text-white">Eligibility Types, Requirements Conditions & Activation Gates</h3>
                      <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-white">
                        Build one or multiple eligibility and requirement layers with full manual control: legal proof, safeguarding standards, partner tier, minimum standard, verification method, required documents, evidence owner, review cycle, risk level, onboarding gate, renewal gate, escalation logic and compliance conditions.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={addEligibilityRequirement} className="rounded-2xl bg-gradient-to-r from-amber-500 to-violet-600 px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4 text-white" />Add Requirement</button>
                      <button className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Import className="mr-2 inline h-4 w-4 text-white" />Import Checklist</button>
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-4">
                    {[
                      ["Requirement Types", eligibilityRequirements.length],
                      ["Mandatory", mandatoryRequirements],
                      ["Critical / High Risk", criticalRequirements],
                      ["Needs Review", blockedRequirements],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p>
                        <p className="mt-2 text-2xl font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
                    <div className="space-y-3">
                      {eligibilityRequirements.map((req, index) => (
                        <button key={req.id} onClick={() => setSelectedEligibilityId(req.id)} className={`w-full rounded-3xl border p-5 text-left transition ${selectedEligibilityId === req.id ? "border-amber-300 bg-amber-500/20" : "border-white/15 bg-white/[0.07] hover:bg-white/[0.11]"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">Requirement {index + 1}</p>
                              <h4 className="mt-2 text-lg font-black text-white">{req.name}</h4>
                              <p className="mt-2 text-xs font-bold leading-5 text-white">{req.minimumStandard}</p>
                            </div>
                            <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white">{req.priority}</span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-white">
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{req.requirementType}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{req.riskLevel}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{req.reviewFrequency}</span>
                            <span className="rounded-xl bg-white/[0.08] px-3 py-2">{req.status}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[30px] border border-white/15 bg-[#070d1c] p-6">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-white">Eligibility & Requirement Details</h4>
                          <p className="mt-2 text-sm font-bold text-white">Manually configure the selected requirement, activation gate and compliance rule.</p>
                        </div>
                        <button onClick={() => removeEligibilityRequirement(selectedEligibility.id)} className="rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-black text-white"><Trash2 className="mr-2 inline h-4 w-4 text-white" />Remove</button>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Eligibility / Requirement Name *" value={selectedEligibility.name} onChange={(v) => updateEligibility("name", v)} />
                        <Field label="Requirement Status" value={selectedEligibility.status} onChange={(v) => updateEligibility("status", v as EligibilityRequirement["status"])} options={["Draft", "Active", "Needs Review", "Blocked"]} />
                        <Field label="Requirement Type" value={selectedEligibility.requirementType} onChange={(v) => updateEligibility("requirementType", v)} options={["Legal Requirement", "Safeguarding Requirement", "Quality Requirement", "Operational Requirement", "Financial Requirement", "Commercial Requirement", "Data Protection Requirement", "Custom Requirement"]} />
                        <Field label="Partner Type Scope" value={selectedEligibility.partnerType} onChange={(v) => updateEligibility("partnerType", v)} options={["All Partner Types", "Preschools & Kindergarten", "Maternity Clinics", "Orthophonistes", "Hotels", "Corporates", "Associations"]} />
                        <Field label="Partner Tier Scope" value={selectedEligibility.partnerTier} onChange={(v) => updateEligibility("partnerTier", v)} options={["Standard", "Preferred", "Strategic", "Premium", "Pilot", "Enterprise"]} />
                        <Field label="Priority" value={selectedEligibility.priority} onChange={(v) => updateEligibility("priority", v as EligibilityRequirement["priority"])} options={["Mandatory", "Recommended", "Optional", "Conditional"]} />
                        <Field label="Verification Method" value={selectedEligibility.verificationMethod} onChange={(v) => updateEligibility("verificationMethod", v)} options={["Document review", "Site visit", "Checklist", "Interview", "Manual review", "Finance review", "Legal review", "Document review + manager validation"]} />
                        <Field label="Required Document" value={selectedEligibility.requiredDocument} onChange={(v) => updateEligibility("requiredDocument", v)} />
                        <Field label="Evidence Owner" value={selectedEligibility.evidenceOwner} onChange={(v) => updateEligibility("evidenceOwner", v)} />
                        <Field label="Review Frequency" value={selectedEligibility.reviewFrequency} onChange={(v) => updateEligibility("reviewFrequency", v)} options={["Once", "Monthly", "Quarterly", "Semi-annual", "Annual", "Before renewal", "Before each activation"]} />
                        <Field label="Risk Level" value={selectedEligibility.riskLevel} onChange={(v) => updateEligibility("riskLevel", v as EligibilityRequirement["riskLevel"])} options={["Low", "Medium", "High", "Critical"]} />
                        <Field label="Compliance Area" value={selectedEligibility.complianceArea} onChange={(v) => updateEligibility("complianceArea", v)} options={["Legal / Governance", "Safeguarding / Quality", "Finance", "Data Protection", "Operations", "Commercial", "HR / Academy", "Insurance"]} />
                        <Field label="Approval Owner" value={selectedEligibility.approvalOwner} onChange={(v) => updateEligibility("approvalOwner", v)} />
                        <Field label="Validity Period" value={selectedEligibility.validityPeriod} onChange={(v) => updateEligibility("validityPeriod", v)} />
                        <Field label="Onboarding Gate" value={selectedEligibility.onboardingGate} onChange={(v) => updateEligibility("onboardingGate", v)} />
                        <Field label="Renewal Gate" value={selectedEligibility.renewalGate} onChange={(v) => updateEligibility("renewalGate", v)} />
                        <div className="md:col-span-2"><Field label="Minimum Standard / Acceptance Criteria" value={selectedEligibility.minimumStandard} onChange={(v) => updateEligibility("minimumStandard", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="Applicability Condition" value={selectedEligibility.condition} onChange={(v) => updateEligibility("condition", v)} textarea /></div>
                        <Field label="Operational Impact" value={selectedEligibility.operationalImpact} onChange={(v) => updateEligibility("operationalImpact", v)} textarea />
                        <Field label="Escalation Rule" value={selectedEligibility.escalationRule} onChange={(v) => updateEligibility("escalationRule", v)} textarea />
                        <div className="md:col-span-2"><Field label="Manual Notes / Internal Instructions" value={selectedEligibility.notes} onChange={(v) => updateEligibility("notes", v)} textarea /></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#0a1020]">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white">Eligibility & Requirements Summary</h3>
                      <p className="mt-1 text-sm font-bold text-white">Review requirements before moving to final review and publishing.</p>
                    </div>
                    <p className="text-xl font-black text-white">Total Requirements: {eligibilityRequirements.length}</p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {eligibilityRequirements.map((req) => (
                      <div key={req.id} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-white">{req.name}</h4>
                            <p className="mt-1 text-sm font-bold leading-6 text-white">{req.minimumStandard}</p>
                          </div>
                          <span className="rounded-full bg-amber-600 px-3 py-1 text-xs font-black text-white">{req.status}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-white">
                          <p><span className="font-black">Type:</span> {req.requirementType}</p>
                          <p><span className="font-black">Priority:</span> {req.priority}</p>
                          <p><span className="font-black">Risk:</span> {req.riskLevel}</p>
                          <p><span className="font-black">Owner:</span> {req.approvalOwner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            {step === 6 ? (
              <>
                <Card className="bg-[radial-gradient(circle_at_12%_0%,rgba(139,92,246,.30),transparent_34%),linear-gradient(145deg,rgba(10,16,32,.99),rgba(8,18,40,.98))]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-100">Step 6 • Final Review & Publish Command</p>
                      <h3 className="mt-2 text-3xl font-black text-white">Review, Approval, Launch Controls & Publishing Governance</h3>
                      <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-white">
                        Final enterprise layer for manual validation before go-live: approval route, launch owner, publish status, executive summary, risks, go-live conditions, audience, channels, staff instructions, partner instructions and reporting cadence.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={addPublishChecklistItem} className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Plus className="mr-2 inline h-4 w-4 text-white" />Add Checklist Item</button>
                      <button onClick={save} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-black text-white"><Save className="mr-2 inline h-4 w-4 text-white" />Publish Program</button>
                    </div>
                  </div>

                  <div className="mb-6 grid gap-4 md:grid-cols-5">
                    {[
                      ["Offers", offers.length],
                      ["Pricing Rules", pricingRules.length],
                      ["Contract Types", contractTerms.length],
                      ["Requirements", eligibilityRequirements.length],
                      ["Forecast Revenue", forecastTotal ? money(forecastTotal) : "MAD 0"],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{label}</p>
                        <p className="mt-2 text-2xl font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[30px] border border-white/15 bg-[#070d1c] p-6">
                      <h4 className="text-2xl font-black text-white">Publishing Governance</h4>
                      <p className="mt-2 text-sm font-bold text-white">Manually control final status, owners, launch rules and governance.</p>

                      <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <Field label="Publish Status" value={publishReview.publishStatus} onChange={(v) => updatePublishReview("publishStatus", v)} options={["Draft", "Ready for Review", "Approved", "Published"]} />
                        <Field label="Launch Date" value={publishReview.launchDate} onChange={(v) => updatePublishReview("launchDate", v)} />
                        <Field label="Launch Owner" value={publishReview.launchOwner} onChange={(v) => updatePublishReview("launchOwner", v)} />
                        <Field label="Final Approval Owner" value={publishReview.finalApprovalOwner} onChange={(v) => updatePublishReview("finalApprovalOwner", v)} />
                        <Field label="Approval Route" value={publishReview.approvalRoute} onChange={(v) => updatePublishReview("approvalRoute", v)} />
                        <Field label="Publish Audience" value={publishReview.publishAudience} onChange={(v) => updatePublishReview("publishAudience", v)} />
                        <Field label="Activation Channels" value={publishReview.activationChannels} onChange={(v) => updatePublishReview("activationChannels", v)} />
                        <Field label="Reporting Cadence" value={publishReview.reportingCadence} onChange={(v) => updatePublishReview("reportingCadence", v)} />
                        <Field label="Review Frequency" value={publishReview.reviewFrequency} onChange={(v) => updatePublishReview("reviewFrequency", v)} />
                        <Field label="Communication Plan" value={publishReview.communicationPlan} onChange={(v) => updatePublishReview("communicationPlan", v)} />
                        <div className="md:col-span-2"><Field label="Executive Summary" value={publishReview.executiveSummary} onChange={(v) => updatePublishReview("executiveSummary", v)} textarea /></div>
                        <div className="md:col-span-2"><Field label="Go-Live Conditions" value={publishReview.goLiveConditions} onChange={(v) => updatePublishReview("goLiveConditions", v)} textarea /></div>
                        <Field label="Staff Instructions" value={publishReview.staffInstructions} onChange={(v) => updatePublishReview("staffInstructions", v)} textarea />
                        <Field label="Partner Instructions" value={publishReview.partnerInstructions} onChange={(v) => updatePublishReview("partnerInstructions", v)} textarea />
                        <Field label="Risk Notes / Blocking Issues" value={publishReview.riskNotes} onChange={(v) => updatePublishReview("riskNotes", v)} textarea />
                        <Field label="Internal Notes / Manual Approval Logic" value={publishReview.internalNotes} onChange={(v) => updatePublishReview("internalNotes", v)} textarea />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Card className="bg-[#0a1020]">
                        <h4 className="text-2xl font-black text-white">Publish Checklist</h4>
                        <p className="mt-2 text-sm font-bold text-white">Click to confirm or unconfirm each final validation item.</p>
                        <div className="mt-5 space-y-3">
                          {publishReview.publishChecklist.map((item) => (
                            <label key={item} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-sm font-black text-white">
                              <input type="checkbox" checked={publishReview.publishChecklist.includes(item)} onChange={() => togglePublishChecklist(item)} className="h-5 w-5 accent-violet-500" />
                              {item}
                            </label>
                          ))}
                        </div>
                      </Card>

                      <Card className="bg-[#0a1020]">
                        <h4 className="text-2xl font-black text-white">Final Publishing Summary</h4>
                        <div className="mt-5 space-y-4">
                          {[
                            ["Status", publishReview.publishStatus],
                            ["Launch Owner", publishReview.launchOwner],
                            ["Approval Owner", publishReview.finalApprovalOwner],
                            ["Audience", publishReview.publishAudience],
                            ["Channels", publishReview.activationChannels],
                            ["Cadence", publishReview.reportingCadence],
                          ].map(([a, b]) => (
                            <div key={a}>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{a}</p>
                              <p className="mt-1 text-sm font-bold leading-6 text-white">{b}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </Card>

                <Card className="bg-[#0a1020]">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white">Full Program Review Matrix</h3>
                      <p className="mt-1 text-sm font-bold text-white">Final cross-check of every enterprise layer before publishing.</p>
                    </div>
                    <p className="text-xl font-black text-white">{publishReview.publishStatus}</p>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-4">
                    {[
                      ["Program", form.name, form.shortDescription],
                      ["Services & Offers", `${offers.length} configured`, offers.map((o) => o.name).join(", ")],
                      ["Pricing & Revenue", `${pricingRules.length} rules`, forecastTotal ? money(forecastTotal) : "MAD 0"],
                      ["Contracts & Terms", `${contractTerms.length} contract types`, contractTerms.map((c) => c.name).join(", ")],
                      ["Eligibility", `${eligibilityRequirements.length} requirements`, `${mandatoryRequirements} mandatory / ${criticalRequirements} critical-high`],
                      ["Approval Route", publishReview.approvalRoute, publishReview.finalApprovalOwner],
                      ["Launch Plan", publishReview.launchDate, publishReview.communicationPlan],
                      ["Risk Control", publishReview.riskNotes, publishReview.goLiveConditions],
                    ].map(([title, value, note]) => (
                      <div key={String(title)} className="rounded-3xl border border-white/15 bg-white/[0.07] p-5">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white">{title}</p>
                        <p className="mt-2 text-lg font-black text-white">{value}</p>
                        <p className="mt-2 text-xs font-bold leading-5 text-white">{note}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : null}
          </main>

          <aside className="space-y-6">
            <Card className="bg-[#0a1020]">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Program Summary</h3>
                <ChevronUp className="h-5 w-5 text-white" />
              </div>
              {[["Program Name", form.name], ["Partner Type", form.partnerType], ["Category", form.category], ["Status", status], ["Expected Launch", form.launch], ["Target Partners", form.targetPartners], ["Estimated Revenue Impact", forecastTotal ? money(forecastTotal) : form.revenue], ["Configured Offers", String(offers.length)], ["Pricing Rules", String(pricingRules.length)], ["Contract Types", String(contractTerms.length)], ["Requirements", String(eligibilityRequirements.length)], ["Publish Status", publishReview.publishStatus]].map(([a, b]) => (
                <div key={a} className="mb-4">
                  <p className="text-xs font-black text-white">{a}</p>
                  <p className="mt-1 text-sm font-bold text-white">{b}</p>
                </div>
              ))}
            </Card>

            <Card className="bg-[#0a1020]">
              <h3 className="text-xl font-black text-white">{step === 6 ? "Publish Health" : step === 5 ? "Eligibility Health" : step === 4 ? "Contract Health" : step === 3 ? "Pricing Health" : "Service Offer Health"}</h3>
              <div className="mt-4 space-y-4">
                {(step === 6
                  ? [["Publish status", publishReview.publishStatus], ["Checklist", `${publishReview.publishChecklist.length} items`], ["Launch owner", publishReview.launchOwner], ["Approval owner", publishReview.finalApprovalOwner]]
                  : step === 5
                    ? [["Requirements", `${eligibilityRequirements.length} configured`], ["Mandatory", `${mandatoryRequirements} mandatory`], ["Critical / high risk", `${criticalRequirements} critical/high`], ["Needs review", `${blockedRequirements} blocked/review`]]
                    : step === 4
                    ? [["Contract types", `${contractTerms.length} configured`], ["Legal review", `${legalReviewCount} needs review`], ["Active contracts", `${activeContractCount} active`], ["Approval owner", selectedContract.approvalOwner]]
                    : step === 3
                    ? [["Pricing rules", `${pricingRules.length} configured`], ["Forecast revenue", forecastTotal ? money(forecastTotal) : "MAD 0"], ["Avg margin target", `${avgMargin || 0}%`], ["Forecast partners", String(totalForecastPartners)]]
                    : [["Offers configured", `${offers.length} service offers`], ["Pricing models", `${new Set(offers.map((o) => o.pricingModel)).size} models`], ["Delivery methods", `${new Set(offers.map((o) => o.deliveryMethod)).size} methods`], ["Operational owners", `${new Set(offers.map((o) => o.operationalOwner)).size} owners`]]
                ).map(([a, b]) => (
                  <div key={a} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    <div><p className="text-sm font-black text-white">{a}</p><p className="text-xs font-bold text-white">{b}</p></div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-[#0a1020]">
              <h3 className="text-xl font-black text-white">Next Steps</h3>
              <div className="mt-4 space-y-3">
                {stepMeta.map(([x], i) => (
                  <label key={String(x)} className="flex items-center gap-3 text-sm font-bold text-white">
                    <input type="checkbox" checked={i + 1 <= step} readOnly className="h-4 w-4 accent-emerald-500" />
                    {x}
                  </label>
                ))}
              </div>
            </Card>

            <Card className="bg-violet-600/12">
              <p className="text-lg font-black text-white">AI Recommendation</p>
              <p className="mt-3 text-sm font-bold leading-6 text-white">
                {step === 6
                  ? "Publish only when all mandatory requirements are validated, pricing is approved, legal terms are reviewed and a launch owner is assigned."
                  : step === 5
                    ? "Do not allow program activation until mandatory legal, safeguarding, data, insurance and operational requirements are verified. Use critical requirements as hard gates."
                    : step === 4
                    ? "Use a clear MOU for standard partners and a master agreement for strategic partners. Always include scope, obligations, data protection, liability, termination, signature flow, and annex references."
                    : step === 3
                    ? "Use a hybrid model for strategic partners: low entry barrier, clear revenue share, annual renewal protection, and margin target above 35%."
                    : `For ${form.partnerType}, include at least one training offer, one parent-facing benefit, one measurable quality/control service and one co-marketing/referral action.`}
              </p>
              <button className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">Apply AI Suggestion →</button>
            </Card>
          </aside>
        </div>

        <div className="mt-8 flex justify-end gap-4 border-t border-white/15 pt-6">
          <button onClick={save} className="rounded-2xl border border-white/15 bg-white/[0.07] px-8 py-4 font-black text-white">Save Draft</button>
          <button onClick={onClose} className="rounded-2xl border border-white/15 bg-white/[0.07] px-8 py-4 font-black text-white">Cancel</button>
          <button
            onClick={() => {
              if (step < 6) setStep(step + 1)
              else save()
            }}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-4 font-black text-white"
          >
            {step < 6 ? "Next Step" : "Publish Program"} <ArrowRight className="ml-2 inline h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AdvisorModal({ view, programs, onClose }: { view: AdvisorView; programs: Program[]; onClose: () => void }) {
  const top = [...programs].sort((a, b) => b.engagement - a.engagement)[0]
  const revenue = [...programs].sort((a, b) => b.revenueImpact - a.revenueImpact)[0]
  const weak = [...programs].sort((a, b) => a.engagement - b.engagement)[0]
  const content: Record<AdvisorView, { title: string; rows: [string, string][] }> = {
    insights: { title: "Live Program Performance Insights", rows: [["Top performer", `${top?.name || "No program"} leads with ${top?.engagement || 0}% engagement.`], ["Revenue driver", `${revenue?.name || "No program"} drives ${money(revenue?.revenueImpact || 0)} in impact.`], ["Expansion signal", "Prioritize Rabat–Temara and Casablanca where partner density is strongest."]] },
    recommendations: { title: "AI Recommendations", rows: [["Scale", `Expand ${top?.partnerType || "Preschools & Kindergarten"} benefits with high-conversion partner packs.`], ["Fix", `${weak?.name || "Lowest engagement program"} needs a refreshed offer, owner follow-up and meeting sprint.`], ["Activate", "Create tasks for every program below 75% engagement."]] },
    opportunities: { title: "Top Opportunities", rows: [["Hotels", "Marrakech family hospitality programs show strong potential."], ["Corporates", "Corporate parent benefit programs can generate recurring B2B channels."], ["Clinics", "Maternity clinics are ideal for early family acquisition and referrals."]] },
    actions: { title: "Suggested Actions", rows: [["Today", "Assign owners to programs with low engagement."], ["This week", "Launch a 5-day partner activation sprint by partner type."], ["Next", "Add parent workshops and academy hiring benefits to corporate programs."]] },
    risks: { title: "Program Risks", rows: [["Low engagement", `${weak?.name || "Lowest program"} requires immediate manager review.`], ["Owner gaps", "Programs without owner accountability should be escalated."], ["Revenue leakage", "High partner count but low revenue impact needs pricing and benefit review."]] },
  }
  const selected = content[view]
  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/75 p-6 backdrop-blur-xl">
      <div className="w-full max-w-5xl rounded-[36px] border border-white/15 bg-[#081224] p-8 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-5 border-b border-white/15 pb-6">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-white">Angelcare AI Advisor • Live Data</p><h2 className="mt-2 text-4xl font-black text-white">{selected.title}</h2><p className="mt-2 text-sm font-bold text-white">Generated from the current programs table and partner-type performance.</p></div>
          <button onClick={onClose} className="rounded-2xl bg-white/[0.08] p-3 text-white hover:bg-white/[0.14]"><X className="h-5 w-5 text-white" /></button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {selected.rows.map(([label, text]) => (
            <Card key={label}><p className="text-xs font-black uppercase tracking-[0.2em] text-white">{label}</p><p className="mt-3 text-lg font-black leading-8 text-white">{text}</p></Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PartnershipProgramsWorkspace({ livePrograms = [] }: { livePrograms?: any[] }) {
  const [modalProgram, setModalProgram] = useState<Program | null>(null)
  const [editProgram, setEditProgram] = useState<Program | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [advisorView, setAdvisorView] = useState<AdvisorView | null>(null)
  const [selectedType, setSelectedType] = useState("All Programs")
  const [sortBy, setSortBy] = useState("recent")
  const [query, setQuery] = useState("")
  const [programsState, setProgramsState] = useState<Program[]>(() => (livePrograms.length ? livePrograms.map(normalizeProgram) : seedPrograms))

  const allPrograms = livePrograms.length ? livePrograms.map(normalizeProgram) : programsState
  const programs = useMemo(() => {
    let rows = [...allPrograms]
    if (selectedType !== "All Programs") rows = rows.filter((p) => p.partnerType === selectedType)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      rows = rows.filter((p) => [p.name, p.subtitle, p.partnerType, p.city, p.owner, p.stage].filter(Boolean).join(" ").toLowerCase().includes(q))
    }
    rows.sort((a, b) => {
      if (sortBy === "revenue") return b.revenueImpact - a.revenueImpact
      if (sortBy === "engagement") return b.engagement - a.engagement
      if (sortBy === "partners") return b.partners - a.partners
      return a.name.localeCompare(b.name)
    })
    return rows
  }, [allPrograms, selectedType, query, sortBy])

  const totalPrograms = allPrograms.length
  const activePrograms = allPrograms.filter((p) => String(p.status).toLowerCase() === "active").length
  const totalPartners = allPrograms.reduce((s, p) => s + Number(p.partners || 0), 0)
  const totalRevenue = allPrograms.reduce((s, p) => s + Number(p.revenueImpact || 0), 0)
  const avgEngagement = Math.round(allPrograms.reduce((s, p) => s + Number(p.engagement || 0), 0) / Math.max(1, allPrograms.length))

  function saveProgram(updated: Program) {
    setProgramsState((prev) => {
      const exists = prev.some((p) => p.id === updated.id)
      return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev]
    })
    setModalProgram((current) => (current && current.id === updated.id ? updated : current))
    setEditProgram(null)
    setCreateModal(false)
  }

  return (
    <div className="w-full space-y-7 text-white">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-6">
        <Kpi icon={BarChart3} label="Total Programs" value={totalPrograms} delta="20%" accent="emerald" />
        <Kpi icon={ShieldCheck} label="Active Programs" value={activePrograms} delta="12%" accent="blue" />
        <Kpi icon={UsersRound} label="Total Partners" value={totalPartners || 286} delta="16%" accent="violet" />
        <Kpi icon={Handshake} label="Total Revenue Impact" value={money(totalRevenue || 4820000)} delta="22%" accent="pink" />
        <Kpi icon={Activity} label="Engagement Rate" value={`${avgEngagement || 78}%`} delta="8%" accent="orange" />
        <Kpi icon={TrendingUp} label="Avg. Program ROI" value="5.6x" delta="14%" accent="blue" />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-7">
        {partnerTypes.map((type) => {
          const Icon = type.icon
          const active = selectedType === type.label
          const count = type.label === "All Programs" ? allPrograms.length : allPrograms.filter((p) => p.partnerType === type.label).length
          return (
            <button key={type.label} onClick={() => setSelectedType(type.label)} className={`rounded-2xl border p-5 text-left text-white shadow-lg transition hover:-translate-y-1 ${active ? "border-violet-300 bg-violet-600/35" : "border-white/15 bg-[linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))]"}`}>
              <Icon className="h-6 w-6 text-white" />
              <p className="mt-3 text-sm font-black text-white">{type.label}</p>
              <p className="text-2xl font-black text-white">{count || type.count}</p>
            </button>
          )
        })}
      </div>

      <div className="grid gap-7 2xl:grid-cols-[1fr_460px]">
        <div className="space-y-7">
          <Card>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-3xl font-black text-white">AngelCare Partnership Programs</h2><p className="mt-2 text-sm font-bold text-white">Sort, navigate, click, edit, save and manage every program by partner type.</p></div>
              <div className="flex flex-wrap gap-3">
                <div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-white" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search programs..." className="w-[300px] rounded-2xl border border-white/15 bg-[#070d1c] py-3 pl-12 pr-4 font-bold text-white outline-none placeholder:text-white" /></div>
                <button onClick={() => setSelectedType("All Programs")} className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-3 font-black text-white"><Filter className="mr-2 inline h-4 w-4 text-white" />All Types</button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-2xl border border-white/15 bg-[#070d1c] px-5 py-3 font-black text-white">
                  <option value="recent">Sort: Recently Updated</option><option value="revenue">Sort: Revenue Impact</option><option value="engagement">Sort: Engagement</option><option value="partners">Sort: Partners</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-white">
                <thead className="border-b border-white/15 text-xs uppercase tracking-[0.18em] text-white"><tr>{["Program", "Partner Type", "Partners", "Status", "Benefits", "Revenue Impact", "Engagement", "Actions"].map((h) => <th key={h} className="py-4 pr-4 text-white">{h}</th>)}</tr></thead>
                <tbody>
                  {programs.map((program) => {
                    const Icon = program.icon || GraduationCap
                    const accent = program.accent || "violet"
                    return (
                      <tr key={program.id} onClick={() => setModalProgram(program)} className="cursor-pointer border-b border-white/10 text-white hover:bg-white/[0.05]">
                        <td className="py-5 pr-4"><div className="flex items-center gap-4"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentMap[accent] || accentMap.violet}`}><Icon className="h-6 w-6 text-white" /></div><div><p className="font-black text-white">{program.name}</p><p className="text-xs font-bold text-white">{program.subtitle}</p></div></div></td>
                        <td className="py-5 pr-4"><Pill accent={accent}>{program.partnerType}</Pill></td>
                        <td className="py-5 pr-4 font-black text-white">{program.partners}</td>
                        <td className="py-5 pr-4"><span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">{program.status}</span></td>
                        <td className="py-5 pr-4"><div className="flex gap-2"><span className="rounded-lg bg-blue-500/20 p-2"><UsersRound className="h-4 w-4 text-white" /></span><span className="rounded-lg bg-blue-500/20 p-2"><CalendarDays className="h-4 w-4 text-white" /></span><span className="rounded-lg bg-blue-500/20 p-2"><ShieldCheck className="h-4 w-4 text-white" /></span></div></td>
                        <td className="py-5 pr-4 font-black text-white">{money(program.revenueImpact)}</td>
                        <td className="py-5 pr-4"><div className="flex items-center gap-3"><span className="font-black text-white">{program.engagement}%</span><div className="h-2 w-28 rounded-full bg-white/15"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${program.engagement}%` }} /></div></div></td>
                        <td className="py-5 pr-4"><button onClick={(e) => { e.stopPropagation(); setModalProgram(program) }} className="rounded-xl border border-white/15 bg-white/[0.07] p-3 text-white hover:bg-violet-600"><MoreHorizontal className="h-5 w-5 text-white" /></button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,.24),transparent_34%),linear-gradient(145deg,rgba(18,30,54,.98),rgba(8,16,31,.99))]">
            <div className="mb-6 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600"><Sparkles className="h-7 w-7 text-white" /></div><div><h2 className="text-3xl font-black text-white">Create New Partnership Program</h2><p className="text-sm font-bold text-white">Build a program in minutes with live partner type logic, benefits, terms and publication workflow.</p></div></div>
            <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
              <div className="space-y-3">{["Select Partner Type", "Program Details", "Benefits & Offers", "Terms & Conditions", "Review & Publish"].map((s, i) => <button key={s} className={`flex w-full items-center gap-3 rounded-2xl border border-white/15 p-4 text-left font-black text-white ${i === 0 ? "bg-violet-600" : "bg-white/[0.07]"}`}><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs text-white">{i + 1}</span>{s}</button>)}</div>
              <div className="rounded-[26px] border border-white/15 bg-[#070d1c] p-6">
                <h3 className="text-2xl font-black text-white">Select Partner Type</h3><p className="mt-2 text-sm font-bold text-white">Choose the type of partner for this program.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                  {partnerTypes.filter((t) => t.label !== "All Programs").map((type) => { const Icon = type.icon; const active = selectedType === type.label; return <button key={type.label} onClick={() => setSelectedType(type.label)} className={`rounded-3xl border p-6 text-center text-white transition hover:-translate-y-1 ${active ? "border-violet-300 bg-violet-600/35" : "border-white/15 bg-white/[0.07]"}`}><Icon className="mx-auto h-12 w-12 text-white" /><p className="mt-4 text-sm font-black text-white">{type.label}</p></button> })}
                </div>
                <div className="mt-6 flex justify-end gap-3"><button className="rounded-2xl border border-white/15 bg-white/[0.07] px-6 py-3 font-black text-white">Cancel</button><button onClick={() => setCreateModal(true)} className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 font-black text-white">Next Step <ArrowRight className="ml-2 inline h-4 w-4 text-white" /></button></div>
              </div>
            </div>
          </Card>
        </div>

        <aside className="space-y-7">
          <Card>
            <div className="mb-5 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600"><Bot className="h-8 w-8 text-white" /></div><div><h3 className="text-2xl font-black text-white">Angelcare AI Advisor</h3><p className="text-sm font-bold text-white">Live program growth intelligence</p><span className="mt-2 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-white">Active</span></div></div>
            <div className="grid grid-cols-2 gap-3">{[["insights", "Insights"], ["recommendations", "Recommendations"], ["opportunities", "Opportunities"], ["actions", "Actions"], ["risks", "Risks"]].map(([key, label]) => <button key={key} onClick={() => setAdvisorView(key as AdvisorView)} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-sm font-black text-white hover:bg-violet-600">{label}</button>)}</div>
            <div className="mt-5 space-y-4">{[["Program Performance Insight", `${allPrograms[0]?.name || "Top program"} is leading with ${allPrograms[0]?.engagement || 0}% engagement.`, "View Recommendation", "insights"], ["Top Opportunity", "Hotels and corporate programs show strong family-benefit expansion potential.", "View Opportunities", "opportunities"], ["Suggested Action", "Add parent workshops, academy hiring benefits and referral bonuses.", "Apply Suggestion", "actions"]].map(([title, text, action, view]) => <button key={title} onClick={() => setAdvisorView(view as AdvisorView)} className="w-full rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-left text-white hover:bg-violet-600/30"><p className="font-black text-white">{title}</p><p className="mt-2 text-sm font-bold leading-6 text-white">{text}</p><span className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">{action}</span></button>)}</div>
          </Card>

          <Card><div className="flex items-center justify-between"><h3 className="text-xl font-black text-white">Program Impact Overview</h3><button className="rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-black text-white">This Month</button></div><MiniChart /><div className="mt-5 grid grid-cols-3 gap-3">{[["Revenue", money(totalRevenue || 412850), "18%"], ["New Partners", totalPartners || 28, "12%"], ["Engagement", `${avgEngagement || 78}%`, "8%"]].map(([a, b, c]) => <div key={String(a)} className="rounded-2xl border border-white/15 bg-white/[0.07] p-4"><p className="text-xs font-black text-white">{a}</p><p className="mt-2 text-lg font-black text-white">{b}</p><p className="text-xs font-black text-white">↑ {c}</p></div>)}</div></Card>
        </aside>
      </div>

      {modalProgram ? <ProgramDetailsModal program={modalProgram} onClose={() => setModalProgram(null)} onSave={saveProgram} onEdit={setEditProgram} /> : null}
      {createModal ? <CreateProgramModal mode="create" selectedType={selectedType} onClose={() => setCreateModal(false)} onSave={saveProgram} /> : null}
      {editProgram ? <CreateProgramModal mode="edit" initialProgram={editProgram} selectedType={editProgram.partnerType || selectedType} onClose={() => setEditProgram(null)} onSave={saveProgram} /> : null}
      {advisorView ? <AdvisorModal view={advisorView} programs={allPrograms} onClose={() => setAdvisorView(null)} /> : null}
    </div>
  )
}

function MiniChart() {
  return (
    <div className="mt-6 h-44 rounded-3xl border border-white/15 bg-white/[0.07] p-4">
      <svg viewBox="0 0 600 160" className="h-full w-full">
        <defs><linearGradient id="programChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".45" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
        <path d="M0,120 L40,102 L80,95 L120,110 L160,62 L200,82 L240,116 L280,96 L320,104 L360,86 L400,72 L440,90 L480,76 L520,52 L560,68 L600,38 L600,160 L0,160 Z" fill="url(#programChartFill)" />
        <polyline fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points="0,120 40,102 80,95 120,110 160,62 200,82 240,116 280,96 320,104 360,86 400,72 440,90 480,76 520,52 560,68 600,38" />
      </svg>
    </div>
  )
}
