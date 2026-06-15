import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Filter,
  Gauge,
  Layers3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  UserCheck,
  Users,
  Workflow,
} from 'lucide-react'
import { createHrRecord, updateHrRecord, deleteHrRecord } from '../../_lib/actions'
import { HR_TABLES } from '@/lib/hr-production/repository'
import CandidateFullCommunicationEngine from "./CandidateFullCommunicationEngine";
import { createRecruitmentTask, addRecruitmentComment } from '../_actions'

type Row = Record<string, any>

type Props = {
  candidates: Row[]
  openings: Row[]
  departments?: string[]
}

const PIPELINE_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired',
  'rejected',
  'on_hold',
]

const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied',
  new: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  assessment: 'Assessment',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  on_hold: 'On hold',
  pending: 'Pending',
}

const COMMUNICATION_PHASES = [
  {
    key: 'premier_contact',
    label: 'Premier contact',
    intent: 'Initier le contact candidat',
    templates: [
      'Bonjour {candidate}, ici l’équipe RH AngelCare. Nous avons bien reçu votre candidature pour le poste {role}. Nous souhaitons confirmer votre disponibilité et quelques informations avant la prochaine étape.',
      'Bonjour {candidate}, merci pour votre intérêt pour le poste {role}. Votre profil est en cours de revue par notre équipe recrutement. Pouvez-vous nous confirmer votre ville actuelle et votre disponibilité ?',
      'Bonjour {candidate}, votre candidature pour {role} a retenu notre attention. Nous aimerions échanger avec vous afin de mieux comprendre votre parcours et vos attentes.',
      'Bonjour {candidate}, nous vous contactons suite à votre candidature. Merci de confirmer votre disponibilité pour un court échange RH cette semaine.',
      'Bonjour {candidate}, AngelCare vous remercie pour votre candidature au poste {role}. Nous préparons actuellement la première phase de qualification.',
      'Bonjour {candidate}, votre profil est bien enregistré dans notre pipeline recrutement. Merci de nous indiquer le meilleur créneau pour vous joindre.',
      'Bonjour {candidate}, nous souhaitons vérifier quelques éléments liés à votre candidature : disponibilité, expérience, localisation et motivation pour le poste {role}.',
      'Bonjour {candidate}, nous revenons vers vous concernant votre candidature. Merci de confirmer si vous êtes toujours intéressé(e) par le poste {role}.',
      'Bonjour {candidate}, nous sommes l’équipe RH AngelCare. Votre candidature est en phase de préqualification pour le département {department}.',
      'Bonjour {candidate}, merci de répondre à ce message afin de confirmer la réception et votre disponibilité pour la suite du processus.'
    ],
  },
  {
    key: 'screening',
    label: 'Screening RH',
    intent: 'Préqualifier expérience, disponibilité et motivation',
    templates: [
      'Bonjour {candidate}, pour avancer dans le screening RH, merci de confirmer votre expérience liée au poste {role}, votre disponibilité et votre prétention salariale.',
      'Bonjour {candidate}, nous préparons votre qualification RH. Pouvez-vous partager brièvement vos expériences les plus pertinentes pour le poste {role} ?',
      'Bonjour {candidate}, avant entretien, merci de confirmer votre disponibilité, votre ville actuelle ({city}) et votre capacité à rejoindre le département {department}.',
      'Bonjour {candidate}, votre profil avance vers la phase screening. Merci de nous transmettre votre CV actualisé si ce n’est pas encore fait.',
      'Bonjour {candidate}, nous devons compléter votre dossier RH : disponibilité, langues maîtrisées, expérience terrain et attentes salariales.',
      'Bonjour {candidate}, merci de répondre aux points suivants : disponibilité, expérience principale, contraintes horaires, mobilité et motivation pour {role}.',
      'Bonjour {candidate}, votre candidature est en cours d’analyse. Nous souhaitons vérifier votre adéquation avec les exigences opérationnelles du poste.',
      'Bonjour {candidate}, merci de confirmer si vous êtes disponible pour un échange de 10 minutes avec l’équipe recrutement.',
      'Bonjour {candidate}, pour finaliser la préqualification, merci d’indiquer vos horaires de disponibilité pour un appel RH.',
      'Bonjour {candidate}, nous souhaitons documenter votre screening RH. Merci de répondre avec précision afin d’accélérer la suite.'
    ],
  },
  {
    key: 'entretien',
    label: 'Entretien',
    intent: 'Planifier ou confirmer un entretien',
    templates: [
      'Bonjour {candidate}, nous souhaitons planifier un entretien pour le poste {role}. Merci de nous proposer deux créneaux disponibles.',
      'Bonjour {candidate}, votre profil est sélectionné pour un entretien RH. Merci de confirmer votre disponibilité pour cette semaine.',
      'Bonjour {candidate}, l’entretien portera sur votre expérience, votre motivation, votre disponibilité et votre compréhension du poste {role}.',
      'Bonjour {candidate}, merci de confirmer votre présence à l’entretien prévu. En cas d’indisponibilité, merci de proposer un autre créneau.',
      'Bonjour {candidate}, nous vous invitons à préparer un résumé clair de votre parcours et de vos expériences pertinentes pour {role}.',
      'Bonjour {candidate}, l’équipe RH AngelCare souhaite échanger avec vous dans le cadre du processus de recrutement pour le département {department}.',
      'Bonjour {candidate}, merci de confirmer votre numéro de téléphone pour l’entretien RH.',
      'Bonjour {candidate}, votre entretien est en cours de planification. Merci de rester joignable et de vérifier vos messages.',
      'Bonjour {candidate}, nous vous enverrons les détails de l’entretien après confirmation de votre disponibilité.',
      'Bonjour {candidate}, merci de confirmer que vous êtes toujours intéressé(e) par le poste avant planification finale de l’entretien.'
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    intent: 'Collecter ou compléter le dossier',
    templates: [
      'Bonjour {candidate}, merci de nous transmettre votre CV actualisé afin de compléter votre dossier de candidature.',
      'Bonjour {candidate}, pour continuer le processus, merci de partager les documents disponibles : CV, CIN, certificats ou références professionnelles.',
      'Bonjour {candidate}, votre dossier nécessite une mise à jour. Merci d’envoyer les documents manquants dès que possible.',
      'Bonjour {candidate}, merci de confirmer que les informations de votre dossier sont exactes : téléphone, email, ville, disponibilité et expérience.',
      'Bonjour {candidate}, nous avons besoin de documents complémentaires pour valider votre candidature au poste {role}.',
      'Bonjour {candidate}, merci d’envoyer votre CV en format PDF si possible.',
      'Bonjour {candidate}, afin de préparer la suite, merci de transmettre toute attestation ou justificatif lié à votre expérience.',
      'Bonjour {candidate}, votre dossier sera revu après réception des documents demandés.',
      'Bonjour {candidate}, merci de répondre à ce message avec les éléments nécessaires pour finaliser votre dossier.',
      'Bonjour {candidate}, sans les documents demandés, votre candidature restera en attente dans notre pipeline.'
    ],
  },
  {
    key: 'relance',
    label: 'Relance',
    intent: 'Relancer sans réponse ou dossier incomplet',
    templates: [
      'Bonjour {candidate}, nous revenons vers vous concernant votre candidature pour {role}. Merci de nous confirmer si vous êtes toujours disponible.',
      'Bonjour {candidate}, nous n’avons pas encore reçu votre retour. Merci de répondre afin de maintenir votre candidature active.',
      'Bonjour {candidate}, votre dossier est en attente de confirmation. Merci de nous indiquer votre disponibilité.',
      'Bonjour {candidate}, sans retour de votre part, nous devrons mettre votre candidature en attente.',
      'Bonjour {candidate}, merci de confirmer votre intérêt pour le poste {role}.',
      'Bonjour {candidate}, nous vous relançons pour finaliser la prochaine étape du processus recrutement.',
      'Bonjour {candidate}, pouvez-vous nous confirmer votre numéro joignable et vos créneaux disponibles ?',
      'Bonjour {candidate}, votre candidature reste ouverte, mais nécessite votre retour pour avancer.',
      'Bonjour {candidate}, merci de répondre aujourd’hui si vous souhaitez poursuivre le processus.',
      'Bonjour {candidate}, dernière relance concernant votre candidature. Merci de nous confirmer votre position.'
    ],
  },
  {
    key: 'decision',
    label: 'Décision',
    intent: 'Communiquer décision, attente ou suite',
    templates: [
      'Bonjour {candidate}, merci pour votre échange avec notre équipe. Votre candidature est actuellement en revue pour le poste {role}.',
      'Bonjour {candidate}, suite à l’analyse de votre profil, nous reviendrons vers vous avec la prochaine étape dès validation interne.',
      'Bonjour {candidate}, votre profil reste intéressant pour AngelCare. Nous vous tiendrons informé(e) selon l’évolution des besoins.',
      'Bonjour {candidate}, nous vous remercions pour votre disponibilité. Votre candidature est en attente de décision finale.',
      'Bonjour {candidate}, après revue RH, nous devons compléter quelques éléments avant décision finale.',
      'Bonjour {candidate}, votre candidature évolue dans le processus. Merci de rester joignable pour la suite.',
      'Bonjour {candidate}, nous vous remercions pour votre temps. Une décision sera communiquée après revue du manager concerné.',
      'Bonjour {candidate}, votre candidature est actuellement positionnée sur le département {department}.',
      'Bonjour {candidate}, nous vous confirmerons prochainement si votre profil est retenu pour la suite.',
      'Bonjour {candidate}, merci pour votre patience pendant la finalisation du processus de recrutement.'
    ],
  },
]


function phasePrefix(phaseKey: string) {
  const map: Record<string, string> = {
    premier_contact: 'PC',
    screening: 'SCR',
    entretien: 'ENT',
    documents: 'DOC',
    relance: 'REL',
    decision: 'DEC',
  }

  return map[phaseKey] || String(phaseKey || 'TPL').slice(0, 3).toUpperCase()
}

function phaseTemplateCode(phaseKey: string, index: number) {
  return `${phasePrefix(phaseKey)}-${String(index + 1).padStart(2, '0')}`
}

function cleanPhoneForWhatsapp(input: string) {
  const cleaned = String(input || '').replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('+')) return cleaned.replace('+', '')
  if (cleaned.startsWith('00')) return cleaned.slice(2)
  if (cleaned.startsWith('0')) return `212${cleaned.slice(1)}`
  return cleaned
}

function templateText(template: string, candidate: Row) {
  return template
    .replaceAll('{candidate}', candidateName(candidate))
    .replaceAll('{role}', candidateRole(candidate))
    .replaceAll('{department}', candidateDepartment(candidate))
    .replaceAll('{city}', candidateCity(candidate))
    .replaceAll('{email}', candidateEmail(candidate) || 'email non renseigné')
    .replaceAll('{phone}', candidatePhone(candidate) || 'téléphone non renseigné')
}

function mailtoFor(candidate: Row, subject: string, body: string) {
  const email = candidateEmail(candidate)
  if (!email) return '#'
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function whatsappFor(candidate: Row, body: string) {
  const phone = cleanPhoneForWhatsapp(candidatePhone(candidate))
  if (!phone) return '#'
  return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`
}

function safeTelHref(candidate: Row) {
  const phone = candidatePhone(candidate).trim()
  return phone ? `tel:${phone}` : ''
}

function safeMailHref(candidate: Row, subject: string, body: string) {
  return candidateEmail(candidate) ? mailtoFor(candidate, subject, body) : ''
}

function safeWhatsappHref(candidate: Row, body: string) {
  return cleanPhoneForWhatsapp(candidatePhone(candidate)) ? whatsappFor(candidate, body) : ''
}

function DisabledCommunicationButton({ label }: { label: string }) {
  return (
    <span className="shrink-0 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black text-slate-400">
      {label} indisponible
    </span>
  )
}


function value(row: Row | null | undefined, keys: string[], fallback = '') {
  if (!row) return fallback

  for (const key of keys) {
    const item = row?.[key]
    if (item !== undefined && item !== null && String(item).trim()) {
      return String(item).trim()
    }
  }

  return fallback
}

function normalize(input: any) {
  return String(input || '').toLowerCase().replace(/\s+/g, '_').trim()
}

function candidateId(candidate: Row) {
  return value(candidate, ['id', 'candidate_id'], '')
}

function candidateName(candidate: Row) {
  return value(candidate, ['full_name', 'name', 'candidate_name', 'email'], 'Candidate file')
}

function candidateRole(candidate: Row) {
  return value(candidate, ['desired_position', 'job_title', 'position', 'title', 'role'], 'Open role')
}

function candidateEmail(candidate: Row) {
  return value(candidate, ['email', 'candidate_email'], '')
}

function candidatePhone(candidate: Row) {
  return value(candidate, ['phone', 'mobile', 'candidate_phone'], '')
}

function candidateCity(candidate: Row) {
  return value(candidate, ['city', 'location', 'work_city', 'office_city'], 'Morocco')
}

function candidateSource(candidate: Row) {
  return value(candidate, ['source', 'candidate_source', 'channel'], 'Manual')
}

function candidateDepartment(candidate: Row) {
  return value(candidate, ['department', 'department_name', 'team', 'business_unit'], 'Unassigned')
}

function candidateStage(candidate: Row) {
  const stage = normalize(value(candidate, ['pipeline_stage', 'stage', 'status', 'decision'], 'applied'))
  return stage === 'new' ? 'applied' : stage
}

function candidateScore(candidate: Row) {
  const raw = Number(value(candidate, ['score', 'rating', 'readiness_score', 'candidate_score'], '0'))
  return Number.isFinite(raw) ? raw : 0
}

function candidateRisk(candidate: Row) {
  const score = candidateScore(candidate)
  const stage = candidateStage(candidate)
  const decision = normalize(value(candidate, ['decision'], ''))

  if (decision.includes('reject') || stage.includes('reject')) return 'high'
  if (score > 0 && score < 45) return 'high'
  if (score >= 45 && score < 70) return 'medium'
  return 'normal'
}

function dateLabel(input: any) {
  if (!input) return 'No date'
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return String(input)

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

function stageTone(stage: string) {
  const value = normalize(stage)

  if (value.includes('hired')) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (value.includes('reject')) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (value.includes('hold')) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (value.includes('interview') || value.includes('assessment')) return 'border-violet-200 bg-violet-50 text-violet-700'
  if (value.includes('offer')) return 'border-cyan-200 bg-cyan-50 text-cyan-700'

  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function riskTone(risk: string) {
  if (risk === 'high') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (risk === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue = '',
  placeholder = '',
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  defaultValue?: string | number
  placeholder?: string
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-300"
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  options,
  defaultValue = '',
  required = false,
}: {
  label: string
  name: string
  options: string[]
  defaultValue?: string
  required?: boolean
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-2 w-full bg-transparent text-sm font-black text-slate-950 outline-none"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {STAGE_LABEL[option] || option}
          </option>
        ))}
      </select>
    </label>
  )
}

function Area({
  label,
  name,
  rows = 4,
  defaultValue = '',
  placeholder = '',
  required = false,
}: {
  label: string
  name: string
  rows?: number
  defaultValue?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-6 text-slate-800 outline-none placeholder:text-slate-300"
      />
    </label>
  )
}

function CandidateForm({
  mode,
  candidate,
  openings,
  departments,
}: {
  mode: 'create' | 'edit' | 'duplicate'
  candidate?: Row
  openings: Row[]
  departments: string[]
}) {
  const id = candidate ? candidateId(candidate) : ''
  const action = mode === 'edit' ? updateHrRecord : createHrRecord
  const name = candidate ? candidateName(candidate) : ''

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="_table" value={HR_TABLES.candidates} />
      <input type="hidden" name="_redirect" value="/hr/recruitment#candidate-command-center" />
      {mode === 'edit' && id ? <input type="hidden" name="_id" value={id} /> : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <Field
          label="Full name"
          name="full_name"
          required
          defaultValue={mode === 'duplicate' && name ? `${name} — Copy` : name}
          placeholder="Candidate full name"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={candidate ? candidateEmail(candidate) : ''}
          placeholder="candidate@email.com"
        />
        <Field
          label="Phone"
          name="phone"
          defaultValue={candidate ? candidatePhone(candidate) : ''}
          placeholder="+212 ..."
        />
        <Field
          label="City / location"
          name="city"
          defaultValue={candidate ? candidateCity(candidate) : ''}
          placeholder="Rabat, Temara, Casablanca..."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Field
          label="Desired position"
          name="desired_position"
          required
          defaultValue={candidate ? candidateRole(candidate) : ''}
          placeholder="Role / position"
        />
        <SelectField
          label="Department / team"
          name="department"
          options={departments}
          defaultValue={candidate ? candidateDepartment(candidate) : ''}
        />
        <SelectField
          label="Pipeline stage"
          name="pipeline_stage"
          options={PIPELINE_STAGES}
          defaultValue={candidate ? candidateStage(candidate) : 'applied'}
        />
        <Field
          label="Source / channel"
          name="source"
          defaultValue={candidate ? candidateSource(candidate) : ''}
          placeholder="Manual, website, referral..."
        />
        <Field
          label="Score"
          name="score"
          type="number"
          defaultValue={candidate ? candidateScore(candidate) : 0}
          placeholder="0-100"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SelectField
          label="Linked requisition"
          name="opening_id"
          options={openings.map((opening) => value(opening, ['id'], '')).filter(Boolean)}
          defaultValue={candidate ? value(candidate, ['opening_id', 'job_id', 'requisition_id'], '') : ''}
        />
        <Field
          label="Expected salary"
          name="salary_expectation"
          defaultValue={value(candidate, ['salary_expectation'], '')}
          placeholder="MAD / month"
        />
        <Field
          label="Availability"
          name="availability"
          defaultValue={value(candidate, ['availability'], '')}
          placeholder="Immediate, 15 days..."
        />
        <Field
          label="Interview date"
          name="interview_date"
          type="datetime-local"
          defaultValue={value(candidate, ['interview_date'], '')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Area
          label="Candidate summary"
          name="notes"
          rows={6}
          defaultValue={value(candidate, ['notes', 'summary'], '')}
          placeholder="Experience, strengths, risk, motivation, salary expectation, availability..."
        />
        <Area
          label="Screening notes / next steps"
          name="screening_notes"
          rows={6}
          defaultValue={value(candidate, ['screening_notes', 'next_step'], '')}
          placeholder="Screening decision, recruiter comment, documents needed, next action..."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-black text-slate-950">
            {mode === 'edit'
              ? 'Save candidate changes'
              : mode === 'duplicate'
                ? 'Create duplicated candidate'
                : 'Create candidate in production'}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Saved candidate records sync into pipeline, interviews, map, source analytics and recruitment activity.
          </p>
        </div>

        <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5">
          <Save className="mr-2 inline h-4 w-4" />
          {mode === 'edit' ? 'Save changes' : 'Save candidate'}
        </button>
      </div>
    </form>
  )
}



function communicationVersionsForTemplate(candidate: Row, template: string, code: string, phaseLabel: string) {
  const base = templateText(template, candidate).replace(/^Bonjour\s+[^,]+,\s*/i, '')
  const name = candidateName(candidate)
  const role = candidateRole(candidate)
  const department = candidateDepartment(candidate)
  const city = candidateCity(candidate)

  const call = [
    {
      ref: `${code}-CALL-01`,
      label: 'Qualification directe',
      content: [
        `[${code}-CALL-01] Script appel RH — Qualification directe`,
        '',
        `Bonjour ${name}, ici l’équipe RH AngelCare. Je vous appelle concernant votre candidature pour le poste ${role}.`,
        '',
        `Objectif : ${base}`,
        '',
        'Points à confirmer :',
        '- Disponibilité actuelle',
        `- Ville / mobilité : ${city}`,
        `- Expérience pertinente pour le département ${department}`,
        '- Prétention salariale',
        '- Disponibilité pour entretien',
        '- Prochaine étape acceptée par le candidat',
        '',
        'Clôture : Merci pour votre disponibilité. Nous mettons à jour votre dossier et revenons vers vous avec la prochaine étape.',
      ].join('\n'),
    },
    {
      ref: `${code}-CALL-02`,
      label: 'Motivation & adéquation',
      content: [
        `[${code}-CALL-02] Script appel RH — Motivation & adéquation`,
        '',
        `Bonjour ${name}, je vous contacte de la part d’AngelCare concernant le poste ${role}.`,
        '',
        'Objectif : évaluer la motivation, le sérieux, la compréhension du poste et la compatibilité opérationnelle.',
        '',
        'Questions recommandées :',
        `- Pourquoi souhaitez-vous rejoindre le poste ${role} ?`,
        `- Quelle expérience avez-vous en lien avec le département ${department} ?`,
        '- Quel environnement de travail recherchez-vous ?',
        '- Quelles sont vos contraintes horaires ou de mobilité ?',
        '- Êtes-vous disponible pour une prochaine étape cette semaine ?',
        '',
        'Clôture : Votre retour sera ajouté au dossier candidat pour revue RH.',
      ].join('\n'),
    },
    {
      ref: `${code}-CALL-03`,
      label: 'Dossier incomplet',
      content: [
        `[${code}-CALL-03] Script appel RH — Dossier incomplet`,
        '',
        `Bonjour ${name}, je vous appelle concernant votre candidature AngelCare pour ${role}.`,
        '',
        'Objectif : compléter le dossier avant décision ou entretien.',
        '',
        'Éléments à récupérer :',
        '- CV actualisé',
        '- Disponibilité exacte',
        '- Ville et mobilité',
        '- Références ou documents utiles',
        '- Prétention salariale',
        '- Confirmation d’intérêt pour le poste',
        '',
        'Clôture : Dès réception des éléments, nous pourrons accélérer la suite du processus.',
      ].join('\n'),
    },
    {
      ref: `${code}-CALL-04`,
      label: 'Relance décision',
      content: [
        `[${code}-CALL-04] Script appel RH — Relance décision`,
        '',
        `Bonjour ${name}, ici AngelCare RH. Je reviens vers vous concernant votre candidature pour ${role}.`,
        '',
        'Objectif : obtenir une confirmation claire et fixer la prochaine action.',
        '',
        'À confirmer :',
        '- Souhaitez-vous toujours poursuivre le processus ?',
        '- Êtes-vous disponible pour la prochaine étape ?',
        '- Avez-vous besoin d’informations complémentaires ?',
        '- Pouvez-vous confirmer vos coordonnées ?',
        '',
        'Clôture : Sans retour confirmé, votre candidature pourra être mise en attente.',
      ].join('\n'),
    },
  ]

  const email = [
    {
      ref: `${code}-EMAIL-01`,
      label: 'Qualification RH',
      subject: `AngelCare RH — Qualification candidature ${code} — ${role}`,
      body: [
        `Bonjour ${name},`,
        '',
        `Nous vous contactons dans le cadre de votre candidature pour le poste ${role}.`,
        '',
        base,
        '',
        'Afin de poursuivre la qualification RH, merci de nous confirmer les éléments suivants :',
        '- Votre disponibilité actuelle',
        `- Votre ville / mobilité : ${city}`,
        '- Votre expérience la plus pertinente',
        '- Votre prétention salariale',
        '- Votre disponibilité pour un entretien',
        '',
        `Référence communication : ${code}-EMAIL-01`,
        `Département concerné : ${department}`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${code}-EMAIL-02`,
      label: 'Proposition entretien',
      subject: `AngelCare RH — Proposition entretien ${code} — ${role}`,
      body: [
        `Bonjour ${name},`,
        '',
        `Votre profil a retenu notre attention pour le poste ${role}.`,
        '',
        'Nous souhaitons organiser un entretien afin d’échanger sur votre parcours, votre motivation et votre disponibilité.',
        '',
        'Merci de nous proposer deux créneaux disponibles cette semaine.',
        '',
        `Référence communication : ${code}-EMAIL-02`,
        `Département : ${department}`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${code}-EMAIL-03`,
      label: 'Documents candidature',
      subject: `AngelCare RH — Documents candidature ${code} — ${role}`,
      body: [
        `Bonjour ${name},`,
        '',
        `Pour compléter votre dossier de candidature au poste ${role}, merci de nous transmettre les éléments disponibles :`,
        '',
        '- CV actualisé',
        '- Certificats ou attestations',
        '- Références professionnelles',
        '- Disponibilité',
        '- Informations de contact à jour',
        '',
        `Référence communication : ${code}-EMAIL-03`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${code}-EMAIL-04`,
      label: 'Relance / décision',
      subject: `AngelCare RH — Suivi candidature ${code} — ${role}`,
      body: [
        `Bonjour ${name},`,
        '',
        `Nous revenons vers vous concernant votre candidature pour le poste ${role}.`,
        '',
        'Votre dossier est actuellement en attente de confirmation ou de prochaine étape.',
        '',
        'Merci de nous confirmer si vous êtes toujours intéressé(e) et disponible pour poursuivre le processus.',
        '',
        `Référence communication : ${code}-EMAIL-04`,
        `Ville renseignée : ${city}`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
  ]

  const whatsapp = [
    {
      ref: `${code}-WA-01`,
      label: 'Qualification courte',
      content: `[${code}-WA-01] Bonjour ${name}, ici l’équipe RH AngelCare. Nous revenons vers vous concernant votre candidature pour le poste ${role}. Merci de confirmer votre disponibilité, votre ville actuelle et votre intérêt pour la suite du processus.`,
    },
    {
      ref: `${code}-WA-02`,
      label: 'Entretien',
      content: `[${code}-WA-02] Bonjour ${name}, votre profil est sélectionné pour une prochaine étape RH concernant le poste ${role}. Merci de nous proposer deux créneaux disponibles pour un entretien.`,
    },
    {
      ref: `${code}-WA-03`,
      label: 'Documents',
      content: `[${code}-WA-03] Bonjour ${name}, pour compléter votre dossier AngelCare, merci de nous envoyer votre CV actualisé et de confirmer votre disponibilité pour le poste ${role}.`,
    },
    {
      ref: `${code}-WA-04`,
      label: 'Relance',
      content: `[${code}-WA-04] Bonjour ${name}, nous vous relançons concernant votre candidature ${role}. Merci de confirmer si vous souhaitez toujours poursuivre le processus de recrutement.`,
    },
  ]

  return { call, email, whatsapp }
}


function CandidateCard({
  candidate,
  openings,
  departments,
}: {
  candidate: Row
  openings: Row[]
  departments: string[]
}) {
  const id = candidateId(candidate)
  const stage = candidateStage(candidate)
  const risk = candidateRisk(candidate)
  const score = candidateScore(candidate)

  return (
    <details name="candidate-dossier" className="candidate-card-details group min-h-[300px] overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_14px_42px_rgba(15,23,42,0.06)] ring-1 ring-slate-100">
      <summary className="cursor-pointer list-none p-5 transition hover:bg-violet-50/40">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${stageTone(stage)}`}>
                {STAGE_LABEL[stage] || stage}
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${riskTone(risk)}`}>
                Risk {risk}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
                Score {score}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black text-white shadow-lg shadow-violet-200">
                {candidateName(candidate).slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h4 className="truncate text-2xl font-black tracking-tight text-slate-950">
                  {candidateName(candidate)}
                </h4>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {candidateRole(candidate)} · {candidateDepartment(candidate)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-cyan-700">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                {candidateCity(candidate)}
              </span>
              <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-violet-700">
                <Target className="mr-1 inline h-3.5 w-3.5" />
                {candidateSource(candidate)}
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
                <CalendarCheck className="mr-1 inline h-3.5 w-3.5" />
                {dateLabel(value(candidate, ['interview_date'], ''))}
              </span>
            </div>
          </div>

          <div className="grid min-w-[300px] grid-cols-3 gap-3">
            <div className="col-span-3 hidden rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-center text-xs font-black text-violet-700 group-open:block">
              Selected candidate workspace open · click this candidate header again to close and return to normal cards.
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Score</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{score}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Stage</p>
              <p className="mt-1 text-sm font-black text-violet-700">{STAGE_LABEL[stage] || stage}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Risk</p>
              <p className="mt-1 text-sm font-black text-rose-700">{risk}</p>
            </div>
          </div>
        </div>
      </summary>

      <div className="border-t border-slate-100 bg-slate-50/80 p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <Mail className="h-5 w-5 text-violet-600" />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Email</p>
                <p className="mt-1 break-all text-sm font-black text-slate-800">
                  {candidateEmail(candidate) || 'Not available'}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <Phone className="h-5 w-5 text-emerald-600" />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Phone</p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {candidatePhone(candidate) || 'Not available'}
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <BriefcaseBusiness className="h-5 w-5 text-cyan-600" />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Role</p>
                <p className="mt-1 text-sm font-black text-slate-800">{candidateRole(candidate)}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <Building2 className="h-5 w-5 text-amber-600" />
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Department</p>
                <p className="mt-1 text-sm font-black text-slate-800">{candidateDepartment(candidate)}</p>
              </div>
            </div>

                        <CandidateFullCommunicationEngine
              candidate={{
                id,
                name: candidateName(candidate),
                role: candidateRole(candidate),
                department: candidateDepartment(candidate),
                city: candidateCity(candidate),
                email: candidateEmail(candidate),
                phone: candidatePhone(candidate),
              }}
              commentAction={addRecruitmentComment}
              sourceTable={HR_TABLES.candidates}
            />

<details className="rounded-[28px] border border-violet-100 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-black text-slate-950">
                <FileText className="mr-2 inline h-4 w-4 text-violet-600" />
                View / edit candidate full file
              </summary>
              <div className="mt-4">
                <CandidateForm mode="edit" candidate={candidate} openings={openings} departments={departments} />
              </div>
            </details>

            <details className="rounded-[28px] border border-cyan-100 bg-cyan-50 p-4">
              <summary className="cursor-pointer list-none text-sm font-black text-cyan-800">
                <Copy className="mr-2 inline h-4 w-4" />
                Duplicate as new candidate
              </summary>
              <div className="mt-4 rounded-[24px] bg-white p-4">
                <CandidateForm mode="duplicate" candidate={candidate} openings={openings} departments={departments} />
              </div>
            </details>
          </main>

          <section className="space-y-4">
            <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                    Candidate task layer
                  </p>
                  <h5 className="text-lg font-black text-slate-950">
                    Add task linked to this candidate
                  </h5>
                </div>
              </div>

              <form action={createRecruitmentTask} className="mt-4 grid gap-3">
                <input type="hidden" name="related_record_id" value={id} />
                <input type="hidden" name="source_table" value={HR_TABLES.candidates} />

                <select
                  name="category"
                  defaultValue="screening"
                  className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-slate-900"
                >
                  <option value="screening">Screening task</option>
                  <option value="interview">Interview preparation</option>
                  <option value="documents">Documents / compliance</option>
                  <option value="reference_check">Reference check</option>
                  <option value="offer">Offer preparation</option>
                  <option value="follow_up">Follow-up / reminder</option>
                </select>

                <select
                  name="priority"
                  defaultValue="medium"
                  className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-slate-900"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                  <option value="urgent">Urgent</option>
                </select>

                <Field
                  label="Task title"
                  name="title"
                  required
                  placeholder="Ex: Validate availability, request documents, schedule HR call..."
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Owner" name="owner" placeholder="Recruiter / HR owner" />
                  <Field label="Due date" name="due_date" type="date" />
                </div>

                <Area
                  label="Task details"
                  name="description"
                  rows={4}
                  placeholder="Detailed action plan, context, blocker, expected output and next milestone..."
                />

                <button className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100">
                  <ClipboardCheck className="mr-2 inline h-4 w-4" />
                  Save candidate task
                </button>
              </form>
            </div>

            <div className="rounded-[28px] border border-violet-100 bg-violet-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-violet-700">
                    Candidate action layer
                  </p>
                  <h5 className="text-lg font-black text-slate-950">
                    Add action, decision or recruiter memo
                  </h5>
                </div>
              </div>

              <form action={addRecruitmentComment} className="mt-4 grid gap-3">
                <input type="hidden" name="source_table" value={HR_TABLES.candidates} />
                <input type="hidden" name="source_record_id" value={id} />

                <select
                  name="action_category"
                  defaultValue="recruiter_note"
                  className="rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-black text-slate-900"
                >
                  <option value="recruiter_note">Recruiter note</option>
                  <option value="screening_decision">Screening decision</option>
                  <option value="interview_feedback">Interview feedback</option>
                  <option value="risk_flag">Risk flag</option>
                  <option value="manager_review">Manager review</option>
                  <option value="offer_action">Offer action</option>
                  <option value="rejection_reason">Rejection reason</option>
                </select>

                <Area
                  label="Action / memo detail"
                  name="comment"
                  rows={5}
                  required
                  placeholder="Write the full action, decision, reason, risk, feedback, next step and ownership..."
                />

                <Field
                  label="Next step"
                  name="next_step"
                  placeholder="Ex: call candidate tomorrow, request CV, send test, manager validation..."
                />

                <button className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100">
                  <MessageSquareText className="mr-2 inline h-4 w-4" />
                  Save candidate action
                </button>
              </form>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Candidate notes
              </p>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                {value(candidate, ['notes', 'summary', 'screening_notes'], 'No detailed notes yet.')}
              </p>
            </div>

            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-black text-rose-800">Danger zone</p>
              <p className="mt-1 text-xs font-bold leading-5 text-rose-600">
                Permanent delete removes this candidate from the production recruitment candidates table.
              </p>

              {id ? (
                <form action={deleteHrRecord} className="mt-4">
                  <input type="hidden" name="_table" value={HR_TABLES.candidates} />
                  <input type="hidden" name="_redirect" value="/hr/recruitment#candidate-command-center" />
                  <input type="hidden" name="_id" value={id} />
                  <button className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-700 shadow-sm transition hover:bg-rose-100">
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Delete permanently
                  </button>
                </form>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </details>
  )
}

export default function RecruitmentCandidateCommandCenter({
  candidates,
  openings,
  departments = [],
}: Props) {
  const safeDepartments = unique([
    ...departments,
    ...candidates.map(candidateDepartment),
    ...openings.map((opening) => value(opening, ['department', 'department_name', 'team', 'business_unit'], '')),
    'Marketing',
    'Operations',
    'Academy',
    'RH',
    'CSA',
    'Commercial',
  ])

  const stages = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: candidates.filter((candidate) => candidateStage(candidate) === stage).length,
  }))

  const activeCandidates = candidates.filter((candidate) => {
    const stage = candidateStage(candidate)
    return !['hired', 'rejected', 'archived'].includes(stage)
  })

  const interviewReady = candidates.filter((candidate) => {
    const stage = candidateStage(candidate)
    return stage.includes('interview') || stage.includes('assessment') || candidateScore(candidate) >= 70
  })

  const highRisk = candidates.filter((candidate) => candidateRisk(candidate) === 'high')
  const cities = unique(candidates.map(candidateCity))
  const sources = unique(candidates.map(candidateSource))
  const topSource = sources
    .map((source) => ({
      source,
      count: candidates.filter((candidate) => candidateSource(candidate) === source).length,
    }))
    .sort((a, b) => b.count - a.count)[0]

  const sortedCandidates = [...candidates].sort((a, b) => {
    const scoreDiff = candidateScore(b) - candidateScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return candidateName(a).localeCompare(candidateName(b))
  })

  return (
    <section
      id="candidate-command-center"
      className="xl:col-span-full overflow-hidden rounded-[42px] border border-white/80 bg-white shadow-[0_28px_95px_rgba(15,23,42,0.10)] ring-1 ring-slate-100"
    >
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-violet-50/40 to-cyan-50/60 p-5 lg:p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_680px] xl:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Live candidate management
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">
                Cards + list view
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700">
                Production synced
              </span>
            </div>

            <h2 className="mt-4 max-w-5xl text-4xl font-black tracking-[-0.05em] text-slate-950 lg:text-5xl">
              Candidate full management command center
            </h2>

            <p className="mt-3 max-w-4xl text-sm font-bold leading-7 text-slate-500">
              Create, filter, manage, edit, duplicate and permanently delete candidate files directly
              inside the recruitment page. Candidate records remain connected to requisitions,
              pipeline stages, interviews, source analytics, map coverage and HR production data.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-5 text-violet-700 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">Total</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{candidates.length}</p>
            </div>
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-700 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">Active</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{activeCandidates.length}</p>
            </div>
            <div className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-5 text-cyan-700 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">Interview-ready</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{interviewReady.length}</p>
            </div>
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">Risk</p>
              <p className="mt-3 text-4xl font-black tracking-tight">{highRisk.length}</p>
            </div>
          </div>
        </div>

        

      </div>

      <div className="overflow-x-auto border-b border-slate-200 bg-slate-50/70">
        <div className="flex min-w-[1120px] gap-3 p-5">
          {stages.map(({ stage, count }) => (
            <a
              key={stage}
              href={`#candidate-stage-${stage}`}
              className={`min-w-[170px] rounded-[24px] border p-4 shadow-sm transition hover:-translate-y-0.5 ${stageTone(stage)}`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                {STAGE_LABEL[stage] || stage}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">{count}</p>
            </a>
          ))}

          <div className="min-w-[220px] rounded-[24px] border border-cyan-200 bg-cyan-50 p-4 text-cyan-700 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Top source</p>
            <p className="mt-2 text-xl font-black text-slate-950">{topSource?.source || '—'}</p>
            <p className="mt-1 text-xs font-bold">{topSource?.count || 0} candidate(s)</p>
          </div>

          <div className="min-w-[220px] rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-amber-700 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">Cities</p>
            <p className="mt-2 text-xl font-black text-slate-950">{cities.length}</p>
            <p className="mt-1 text-xs font-bold">Live mapped locations</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[34px] border border-slate-200 bg-slate-50 p-4">
            <p className="px-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Smart live filters
            </p>

            <div className="mt-4 space-y-3">
              <a href="#candidate-card-view" className="flex items-center justify-between rounded-[24px] border border-violet-200 bg-violet-50 p-4 text-violet-700">
                <span className="font-black"><Users className="mr-2 inline h-5 w-5" />All candidates</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{candidates.length}</span>
              </a>
              <a href="#candidate-stage-interview" className="flex items-center justify-between rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <span className="font-black"><CalendarCheck className="mr-2 inline h-5 w-5" />Interview ready</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{interviewReady.length}</span>
              </a>
              <a href="#candidate-risk-zone" className="flex items-center justify-between rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-rose-700">
                <span className="font-black"><AlertTriangle className="mr-2 inline h-5 w-5" />Risk files</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{highRisk.length}</span>
              </a>
            </div>
          </div>

          <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              Source intelligence
            </p>
            <div className="mt-4 space-y-3">
              {sources.slice(0, 8).map((source) => {
                const count = candidates.filter((candidate) => candidateSource(candidate) === source).length
                const pct = candidates.length ? Math.round((count / candidates.length) * 100) : 0

                return (
                  <div key={source} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-slate-800">{source}</p>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">{count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <details id="candidate-create-layer" open className="rounded-[34px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-[0_18px_60px_rgba(124,58,237,0.08)]">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-700">
                    Deep creation layer
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Add a complete candidate file inside recruitment
                  </h3>
                  <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                    Create a candidate with role, department, stage, source, city, contact details, salary expectation,
                    interview date, score, notes and screening context.
                  </p>
                </div>

                <span className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">
                  Candidate cockpit open
                </span>
              </div>
            </summary>

            <div className="mt-5 rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70">
              <CandidateForm mode="create" openings={openings} departments={safeDepartments} />
            </div>
          </details>

          <section id="candidate-card-view" className="scroll-mt-32 rounded-[34px] border border-slate-200 bg-slate-50/80 p-4">
            <style>{`
              #candidate-view-cards:checked ~ .candidate-view-panels .candidate-cards-panel { display: block; }
              #candidate-view-cards:checked ~ .candidate-view-panels .candidate-list-panel { display: none; }
              #candidate-view-list:checked ~ .candidate-view-panels .candidate-cards-panel { display: none; }
              #candidate-view-list:checked ~ .candidate-view-panels .candidate-list-panel { display: block; }
              #candidate-view-cards:checked ~ .candidate-view-tabs label[for="candidate-view-cards"],
              #candidate-view-list:checked ~ .candidate-view-tabs label[for="candidate-view-list"] {
                background: #020617;
                color: white;
                border-color: #020617;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.20);
              }

              #candidate-command-center {
                font-size: 0.92rem;
              }

              #candidate-command-center h2 {
                font-size: clamp(2rem, 2.5vw, 3rem) !important;
                letter-spacing: -0.045em;
              }

              #candidate-command-center h3 {
                font-size: clamp(1.25rem, 1.5vw, 1.75rem) !important;
                letter-spacing: -0.025em;
              }

              #candidate-command-center h4 {
                font-size: clamp(1.05rem, 1.25vw, 1.35rem) !important;
                letter-spacing: -0.02em;
              }

              #candidate-command-center .candidate-card-details > summary {
                padding: 1rem !important;
              }

              #candidate-command-center .candidate-filter-item:has(.candidate-card-details[open]) {
                grid-column: 1 / -1;
                order: -1;
              }

              #candidate-command-center .candidate-card-details[open] {
                grid-column: 1 / -1;
                min-height: auto;
                border-color: rgb(196 181 253 / 0.9);
                box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
              }

              #candidate-command-center .candidate-card-details[open] > div > div {
                grid-template-columns: minmax(0, 1fr) !important;
              }

              #candidate-command-center .candidate-card-details[open] section.space-y-4 {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
              }

              #candidate-command-center .candidate-card-details[open] aside.space-y-4 {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 1rem;
              }

              @media (max-width: 1100px) {
                #candidate-command-center .candidate-card-details[open] section.space-y-4,
                #candidate-command-center .candidate-card-details[open] aside.space-y-4 {
                  grid-template-columns: 1fr;
                }
              }

              #candidate-command-center .candidate-card-details[open] .grid.min-w-\[300px\] {
                min-width: 320px;
              }

              #candidate-command-center .candidate-card-details[open] > summary {
                padding: 1.15rem !important;
                border-bottom: 1px solid rgb(226 232 240 / 0.8);
              }

              #candidate-command-center .candidate-card-details[open] > div {
                padding: 1rem !important;
              }

              #candidate-command-center .candidate-card-details:not([open]) h4 {
                font-size: 1.15rem !important;
                line-height: 1.2;
              }

              #candidate-command-center .candidate-card-details:not([open]) .grid.min-w-\[300px\] {
                min-width: 230px;
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }

              #candidate-command-center input,
              #candidate-command-center select,
              #candidate-command-center textarea {
                font-size: 0.82rem !important;
              }

              #candidate-command-center label {
                padding: 0.85rem !important;
              }

              #candidate-command-center label span,
              #candidate-command-center p.text-\[10px\],
              #candidate-command-center p.text-\[11px\] {
                letter-spacing: 0.14em !important;
              }

              #candidate-command-center .rounded-\[34px\] {
                border-radius: 1.6rem;
              }

              #candidate-command-center .rounded-\[32px\] {
                border-radius: 1.45rem;
              }

              #candidate-command-center .rounded-\[28px\] {
                border-radius: 1.3rem;
              }

              #filter-all:checked ~ .candidate-view-panels .candidate-filter-item { display: block; }
              #filter-interview:checked ~ .candidate-view-panels .candidate-filter-item:not(.stage-interview):not(.stage-assessment) { display: none; }
              #filter-screening:checked ~ .candidate-view-panels .candidate-filter-item:not(.stage-screening) { display: none; }
              #filter-high-score:checked ~ .candidate-view-panels .candidate-filter-item:not(.score-high) { display: none; }
              #filter-risk:checked ~ .candidate-view-panels .candidate-filter-item:not(.risk-high):not(.risk-medium) { display: none; }
              #filter-no-email:checked ~ .candidate-view-panels .candidate-filter-item:not(.no-email) { display: none; }

              #filter-all:checked ~ .candidate-filter-tabs label[for="filter-all"],
              #filter-interview:checked ~ .candidate-filter-tabs label[for="filter-interview"],
              #filter-screening:checked ~ .candidate-filter-tabs label[for="filter-screening"],
              #filter-high-score:checked ~ .candidate-filter-tabs label[for="filter-high-score"],
              #filter-risk:checked ~ .candidate-filter-tabs label[for="filter-risk"],
              #filter-no-email:checked ~ .candidate-filter-tabs label[for="filter-no-email"] {
                background: #7c3aed;
                color: white;
                border-color: #7c3aed;
                box-shadow: 0 14px 35px rgba(124, 58, 237, 0.22);
              }
            `}</style>

            <input id="candidate-view-cards" name="candidate-view-mode" type="radio" defaultChecked className="hidden" />
            <input id="candidate-view-list" name="candidate-view-mode" type="radio" className="hidden" />

            <input id="filter-all" name="candidate-filter-mode" type="radio" defaultChecked className="hidden" />
            <input id="filter-interview" name="candidate-filter-mode" type="radio" className="hidden" />
            <input id="filter-screening" name="candidate-filter-mode" type="radio" className="hidden" />
            <input id="filter-high-score" name="candidate-filter-mode" type="radio" className="hidden" />
            <input id="filter-risk" name="candidate-filter-mode" type="radio" className="hidden" />
            <input id="filter-no-email" name="candidate-filter-mode" type="radio" className="hidden" />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Candidate command workspace
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Smart candidate cards & enterprise list switcher
                </h3>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Cards are optimized for daily candidate management. Switch to list view only when needed.
                </p>
              </div>

              <div className="candidate-view-tabs flex flex-wrap gap-2">
                <label
                  htmlFor="candidate-view-cards"
                  className="cursor-pointer rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
                >
                  <Layers3 className="mr-2 inline h-4 w-4" />
                  Premium cards
                </label>
                <label
                  htmlFor="candidate-view-list"
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText className="mr-2 inline h-4 w-4" />
                  List view
                </label>
                <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                  <ShieldCheck className="mr-2 inline h-4 w-4" />
                  {candidates.length} synced
                </span>
              </div>
            </div>

            <div className="candidate-filter-tabs mt-5 flex gap-2 overflow-x-auto pb-2">
              <label htmlFor="filter-all" className="shrink-0 cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition">
                <Users className="mr-2 inline h-4 w-4" />
                Tous les candidats
              </label>
              <label htmlFor="filter-interview" className="shrink-0 cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 transition">
                <CalendarCheck className="mr-2 inline h-4 w-4" />
                Interview / Assessment
              </label>
              <label htmlFor="filter-screening" className="shrink-0 cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700 transition">
                <Filter className="mr-2 inline h-4 w-4" />
                Screening
              </label>
              <label htmlFor="filter-high-score" className="shrink-0 cursor-pointer rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-black text-violet-700 transition">
                <Star className="mr-2 inline h-4 w-4" />
                Score élevé
              </label>
              <label htmlFor="filter-risk" className="shrink-0 cursor-pointer rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700 transition">
                <AlertTriangle className="mr-2 inline h-4 w-4" />
                Risque / vigilance
              </label>
              <label htmlFor="filter-no-email" className="shrink-0 cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-700 transition">
                <Mail className="mr-2 inline h-4 w-4" />
                Sans email
              </label>
            </div>

            <div className="candidate-view-panels mt-4">
              <div className="candidate-cards-panel">
                <div className="max-h-[760px] overflow-y-auto pr-2 scroll-smooth">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
                    {sortedCandidates.map((candidate) => {
                      const stage = candidateStage(candidate)
                      const risk = candidateRisk(candidate)
                      const score = candidateScore(candidate)
                      const hasEmail = Boolean(candidateEmail(candidate))
                      return (
                        <div
                          key={candidateId(candidate) || candidateName(candidate)}
                          className={[
                            'candidate-filter-item',
                            `stage-${stage}`,
                            `risk-${risk}`,
                            score >= 70 ? 'score-high' : 'score-low',
                            hasEmail ? 'has-email' : 'no-email',
                          ].join(' ')}
                        >
                          <CandidateCard
                            candidate={candidate}
                            openings={openings}
                            departments={safeDepartments}
                          />
                        </div>
                      )
                    })}

                    {!sortedCandidates.length ? (
                      <div className="sm:col-span-2 2xl:col-span-3 rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
                        <Users className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-4 text-xl font-black text-slate-950">No candidates yet</p>
                        <p className="mt-2 text-sm font-bold text-slate-500">
                          Create the first candidate above to activate recruitment tracking.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="candidate-list-panel hidden">
                <div className="max-h-[760px] overflow-y-auto rounded-[28px] border border-slate-100 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1100px] w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-400">
                        <tr>
                          {['Candidate', 'Role', 'Department', 'Stage', 'Source', 'City', 'Score', 'Contact'].map((head) => (
                            <th key={head} className="px-4 py-4 font-black uppercase tracking-[0.12em]">
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedCandidates.map((candidate) => {
                          const stage = candidateStage(candidate)
                          return (
                            <tr
                            key={candidateId(candidate) || candidateName(candidate)}
                            className={[
                              'candidate-filter-item font-bold',
                              `stage-${stage}`,
                              `risk-${candidateRisk(candidate)}`,
                              candidateScore(candidate) >= 70 ? 'score-high' : 'score-low',
                              candidateEmail(candidate) ? 'has-email' : 'no-email',
                            ].join(' ')}
                          >
                              <td className="px-4 py-4 font-black text-slate-950">{candidateName(candidate)}</td>
                              <td className="px-4 py-4">{candidateRole(candidate)}</td>
                              <td className="px-4 py-4">{candidateDepartment(candidate)}</td>
                              <td className="px-4 py-4">
                                <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${stageTone(stage)}`}>
                                  {STAGE_LABEL[stage] || stage}
                                </span>
                              </td>
                              <td className="px-4 py-4">{candidateSource(candidate)}</td>
                              <td className="px-4 py-4">{candidateCity(candidate)}</td>
                              <td className="px-4 py-4 font-black">{candidateScore(candidate)}</td>
                              <td className="px-4 py-4">
                                <div className="space-y-1">
                                  <p>{candidateEmail(candidate) || 'No email'}</p>
                                  <p className="text-slate-400">{candidatePhone(candidate) || 'No phone'}</p>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="candidate-risk-zone" className="scroll-mt-32 rounded-[34px] border border-rose-100 bg-rose-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">
              Risk candidates
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              High-risk candidate files
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {highRisk.length ? (
                highRisk.map((candidate) => (
                  <div key={candidateId(candidate) || candidateName(candidate)} className="rounded-2xl bg-white p-4">
                    <p className="font-black text-slate-950">{candidateName(candidate)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {candidateRole(candidate)} · {STAGE_LABEL[candidateStage(candidate)] || candidateStage(candidate)} · Score {candidateScore(candidate)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 rounded-2xl bg-white p-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-3 font-black text-slate-950">No high-risk candidate files detected</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </section>
  )
}
