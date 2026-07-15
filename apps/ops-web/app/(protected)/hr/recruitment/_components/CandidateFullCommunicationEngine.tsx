'use client'

import { useMemo, useState } from 'react'
import { Mail, MessageSquareText, Phone, Save, Workflow } from 'lucide-react'

type CandidatePayload = {
  id: string
  name: string
  role: string
  department: string
  city: string
  email: string
  phone: string
}

const PHASES = [
  { key: 'premier_contact', code: 'PC', label: 'Premier contact' },
  { key: 'screening', code: 'SCR', label: 'Screening RH' },
  { key: 'entretien', code: 'ENT', label: 'Entretien' },
  { key: 'documents', code: 'DOC', label: 'Documents' },
  { key: 'relance', code: 'REL', label: 'Relance' },
  { key: 'decision', code: 'DEC', label: 'Décision' },
]

const BASE_TEMPLATES = [
  'Prise de contact initiale',
  'Confirmation disponibilité',
  'Qualification expérience',
  'Validation motivation',
  'Demande documents',
  'Planification entretien',
  'Préparation entretien',
  'Relance sans réponse',
  'Suivi décision RH',
  'Clôture / prochaine étape',
]

function codeFor(phaseCode: string, templateIndex: number) {
  return `${phaseCode}-${String(templateIndex + 1).padStart(2, '0')}`
}

function cleanPhone(input: string) {
  const cleaned = String(input || '').replace(/[^\d+]/g, '')
  if (!cleaned) return ''
  if (cleaned.startsWith('+')) return cleaned.replace('+', '')
  if (cleaned.startsWith('00')) return cleaned.slice(2)
  if (cleaned.startsWith('0')) return `212${cleaned.slice(1)}`
  return cleaned
}

function contextLine(candidate: CandidatePayload) {
  return `Candidat : ${candidate.name} · Poste : ${candidate.role} · Département : ${candidate.department || 'non renseigné'} · Ville : ${candidate.city || 'non renseignée'}`
}

function buildCall(candidate: CandidatePayload, baseCode: string, phaseLabel: string, intent: string) {
  return [
    {
      ref: `${baseCode}-CALL-01`,
      title: 'Qualification directe',
      body: [
        `[${baseCode}-CALL-01] Script appel RH — ${phaseLabel} — ${intent}`,
        '',
        `Bonjour ${candidate.name}, ici l’équipe RH AngelCare. Je vous appelle concernant votre candidature pour le poste ${candidate.role}.`,
        '',
        contextLine(candidate),
        '',
        'Objectif de l’appel : confirmer disponibilité, intérêt, ville, mobilité, expérience pertinente et prochaine étape.',
        '',
        'Questions à poser :',
        '- Êtes-vous toujours disponible pour poursuivre le processus ?',
        '- Quelle est votre disponibilité exacte ?',
        '- Pouvez-vous confirmer votre ville et votre mobilité ?',
        '- Quelle expérience correspond le mieux au poste ?',
        '- Quelle est votre prétention salariale ?',
        '',
        'Clôture : Merci pour votre disponibilité. Nous allons mettre à jour votre dossier et revenir vers vous avec la prochaine étape.',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-CALL-02`,
      title: 'Motivation & adéquation',
      body: [
        `[${baseCode}-CALL-02] Script appel RH — Motivation & adéquation`,
        '',
        `Bonjour ${candidate.name}, je vous contacte de la part d’AngelCare pour le poste ${candidate.role}.`,
        '',
        contextLine(candidate),
        '',
        'Objectif : évaluer motivation, sérieux, compréhension du poste et compatibilité avec le besoin opérationnel.',
        '',
        'Questions :',
        `- Pourquoi le poste ${candidate.role} vous intéresse ?`,
        `- Que comprenez-vous du département ${candidate.department || 'concerné'} ?`,
        '- Quel type d’environnement de travail recherchez-vous ?',
        '- Quelles sont vos contraintes horaires ou de mobilité ?',
        '- Êtes-vous disponible pour une prochaine étape cette semaine ?',
        '',
        'Conclusion : Votre retour sera ajouté au dossier candidat pour revue RH.',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-CALL-03`,
      title: 'Dossier incomplet',
      body: [
        `[${baseCode}-CALL-03] Script appel RH — Dossier incomplet`,
        '',
        `Bonjour ${candidate.name}, je vous appelle concernant votre candidature AngelCare pour ${candidate.role}.`,
        '',
        contextLine(candidate),
        '',
        'Objectif : compléter le dossier avant entretien, décision ou mise en attente.',
        '',
        'Éléments à récupérer :',
        '- CV actualisé',
        '- Disponibilité exacte',
        '- Ville / mobilité',
        '- Références ou documents utiles',
        '- Prétention salariale',
        '- Confirmation d’intérêt pour le poste',
        '',
        'Clôture : Dès réception des éléments, nous pourrons accélérer la suite du processus.',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-CALL-04`,
      title: 'Relance décision',
      body: [
        `[${baseCode}-CALL-04] Script appel RH — Relance & décision`,
        '',
        `Bonjour ${candidate.name}, ici AngelCare RH. Je reviens vers vous concernant votre candidature pour ${candidate.role}.`,
        '',
        contextLine(candidate),
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
}

function buildEmail(candidate: CandidatePayload, baseCode: string, phaseLabel: string, intent: string) {
  return [
    {
      ref: `${baseCode}-EMAIL-01`,
      title: 'Qualification RH',
      subject: `AngelCare RH — ${phaseLabel} ${baseCode} — ${candidate.role}`,
      body: [
        `Bonjour ${candidate.name},`,
        '',
        `Nous vous contactons dans le cadre de votre candidature pour le poste ${candidate.role}.`,
        '',
        contextLine(candidate),
        '',
        `Objet RH : ${intent}.`,
        '',
        'Afin de poursuivre la qualification, merci de nous confirmer :',
        '- Votre disponibilité actuelle',
        '- Votre ville actuelle et mobilité',
        '- Votre expérience la plus pertinente',
        '- Votre prétention salariale',
        '- Vos créneaux possibles pour un entretien',
        '',
        `Référence communication : ${baseCode}-EMAIL-01`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-EMAIL-02`,
      title: 'Proposition entretien',
      subject: `AngelCare RH — Entretien ${baseCode} — ${candidate.role}`,
      body: [
        `Bonjour ${candidate.name},`,
        '',
        `Votre profil a retenu notre attention pour le poste ${candidate.role}.`,
        '',
        'Nous souhaitons organiser un entretien afin d’échanger sur votre parcours, votre motivation et votre disponibilité.',
        '',
        'Merci de nous proposer deux créneaux disponibles cette semaine.',
        '',
        contextLine(candidate),
        `Référence communication : ${baseCode}-EMAIL-02`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-EMAIL-03`,
      title: 'Documents candidature',
      subject: `AngelCare RH — Documents ${baseCode} — ${candidate.role}`,
      body: [
        `Bonjour ${candidate.name},`,
        '',
        `Pour compléter votre dossier de candidature au poste ${candidate.role}, merci de nous transmettre les éléments disponibles :`,
        '',
        '- CV actualisé',
        '- Certificats ou attestations',
        '- Références professionnelles',
        '- Disponibilité',
        '- Informations de contact à jour',
        '',
        contextLine(candidate),
        `Référence communication : ${baseCode}-EMAIL-03`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
    {
      ref: `${baseCode}-EMAIL-04`,
      title: 'Relance / décision',
      subject: `AngelCare RH — Suivi candidature ${baseCode} — ${candidate.role}`,
      body: [
        `Bonjour ${candidate.name},`,
        '',
        `Nous revenons vers vous concernant votre candidature pour le poste ${candidate.role}.`,
        '',
        'Votre dossier est actuellement en attente de confirmation ou de prochaine étape.',
        'Merci de nous confirmer si vous êtes toujours intéressé(e) et disponible pour poursuivre le processus.',
        '',
        contextLine(candidate),
        `Référence communication : ${baseCode}-EMAIL-04`,
        '',
        'Cordialement,',
        'Équipe RH AngelCare',
      ].join('\n'),
    },
  ]
}

function buildWhatsapp(candidate: CandidatePayload, baseCode: string, phaseLabel: string, intent: string) {
  return [
    {
      ref: `${baseCode}-WA-01`,
      title: 'Qualification courte',
      body: `[${baseCode}-WA-01] Bonjour ${candidate.name}, ici l’équipe RH AngelCare. Nous revenons vers vous concernant votre candidature pour le poste ${candidate.role}. Merci de confirmer votre disponibilité, votre ville actuelle et votre intérêt pour la suite du processus.`,
    },
    {
      ref: `${baseCode}-WA-02`,
      title: 'Entretien',
      body: `[${baseCode}-WA-02] Bonjour ${candidate.name}, votre profil est sélectionné pour une prochaine étape RH concernant le poste ${candidate.role}. Merci de nous proposer deux créneaux disponibles pour un entretien.`,
    },
    {
      ref: `${baseCode}-WA-03`,
      title: 'Documents',
      body: `[${baseCode}-WA-03] Bonjour ${candidate.name}, pour compléter votre dossier AngelCare, merci de nous envoyer votre CV actualisé et de confirmer votre disponibilité pour le poste ${candidate.role}.`,
    },
    {
      ref: `${baseCode}-WA-04`,
      title: 'Relance',
      body: `[${baseCode}-WA-04] Bonjour ${candidate.name}, nous vous relançons concernant votre candidature ${candidate.role}. Merci de confirmer si vous souhaitez toujours poursuivre le processus de recrutement.`,
    },
  ]
}

export default function CandidateFullCommunicationEngine({
  candidate,
  commentAction,
  sourceTable,
}: {
  candidate: CandidatePayload
  commentAction: (formData: FormData) => void | Promise<void>
  sourceTable: string
}) {
  const [phaseKey, setPhaseKey] = useState(PHASES[0].key)
  const [templateIndex, setTemplateIndex] = useState(0)
  const [channel, setChannel] = useState<'call' | 'email' | 'whatsapp'>('call')
  const [versionIndex, setVersionIndex] = useState(0)

  const phase = PHASES.find((item) => item.key === phaseKey) || PHASES[0]
  const baseCode = codeFor(phase.code, templateIndex)
  const intent = BASE_TEMPLATES[templateIndex]

  const versions = useMemo(() => {
    if (channel === 'call') return buildCall(candidate, baseCode, phase.label, intent)
    if (channel === 'email') return buildEmail(candidate, baseCode, phase.label, intent)
    return buildWhatsapp(candidate, baseCode, phase.label, intent)
  }, [candidate, baseCode, phase.label, intent, channel])

  const selected = versions[Math.min(versionIndex, versions.length - 1)] as {
    ref: string
    title: string
    body: string
    subject?: string
  }
  const selectedSubject = typeof selected.subject === "string" ? selected.subject : ""
  const selectedBody = String(selected.body || "")
  const phoneForWa = cleanPhone(candidate.phone)

  const actionHref =
    channel === 'call'
      ? candidate.phone
        ? `tel:${candidate.phone}`
        : ''
      : channel === 'email'
        ? candidate.email && 'subject' in selected
          ? `mailto:${encodeURIComponent(candidate.email)}?subject=${encodeURIComponent(selectedSubject)}&body=${encodeURIComponent(selectedBody)}`
          : ''
        : phoneForWa
          ? `https://wa.me/${phoneForWa}?text=${encodeURIComponent(selectedBody)}`
          : ''

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700">
          <Workflow className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
            Full communication engine
          </p>
          <h5 className="text-lg font-black text-slate-950">
            6 phases × 10 modèles × 12 versions, chargés à la demande
          </h5>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Phase</span>
          <select
            value={phaseKey}
            onChange={(event) => {
              setPhaseKey(event.target.value)
              setVersionIndex(0)
            }}
            className="mt-2 w-full bg-transparent text-sm font-black outline-none"
          >
            {PHASES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.code} · {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Modèle</span>
          <select
            value={templateIndex}
            onChange={(event) => {
              setTemplateIndex(Number(event.target.value))
              setVersionIndex(0)
            }}
            className="mt-2 w-full bg-transparent text-sm font-black outline-none"
          >
            {BASE_TEMPLATES.map((label, index) => (
              <option key={label} value={index}>
                {codeFor(phase.code, index)} · {label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Canal</span>
          <select
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as 'call' | 'email' | 'whatsapp')
              setVersionIndex(0)
            }}
            className="mt-2 w-full bg-transparent text-sm font-black outline-none"
          >
            <option value="call">CALL · 4 scripts</option>
            <option value="email">EMAIL · 4 emails</option>
            <option value="whatsapp">WA · 4 WhatsApp</option>
          </select>
        </label>

        <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Version</span>
          <select
            value={versionIndex}
            onChange={(event) => setVersionIndex(Number(event.target.value))}
            className="mt-2 w-full bg-transparent text-sm font-black outline-none"
          >
            {versions.map((item, index) => (
              <option key={item.ref} value={index}>
                {item.ref} · {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black text-white">
                {selected.ref}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                {selected.title}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-violet-700">
                {candidate.name} · {candidate.role}
              </span>
            </div>

            {'subject' in selected ? (
              <p className="mt-3 rounded-xl bg-white p-3 text-xs font-black text-slate-800">
                Objet : {selected.subject}
              </p>
            ) : null}

            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-4 text-xs font-bold leading-6 text-slate-700">
              {selectedBody}
            </pre>
          </div>

          {actionHref ? (
            <a
              href={actionHref}
              target={channel === 'whatsapp' ? '_blank' : undefined}
              rel={channel === 'whatsapp' ? 'noreferrer' : undefined}
              className="shrink-0 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white"
            >
              {channel === 'call' ? 'Lancer appel' : channel === 'email' ? 'Envoyer email' : 'Ouvrir WhatsApp'}
            </a>
          ) : (
            <span className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-400">
              Donnée canal manquante
            </span>
          )}
        </div>

        <form action={commentAction} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_170px_auto] md:items-end">
          <input type="hidden" name="source_table" value={sourceTable} />
          <input type="hidden" name="source_record_id" value={candidate.id} />
          <input type="hidden" name="communication_channel" value={channel} />
          <input type="hidden" name="communication_reference" value={selected.ref} />
          <input
            type="hidden"
            name="comment"
            value={`${channel.toUpperCase()} ${selected.ref} - ${candidate.name} - ${candidate.role}: ${'subject' in selected ? `Objet: ${selected.subject} - Message: ${selectedBody}` : selectedBody}`}
          />

          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Date action
            </span>
            <input type="datetime-local" name="communication_date" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold" />
          </label>

          <label>
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Statut
            </span>
            <select name="communication_status" defaultValue="completed" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="no_answer">No answer</option>
              <option value="follow_up">Follow-up required</option>
            </select>
          </label>

          <button className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-black text-white">
            <Save className="mr-2 inline h-4 w-4" />
            Log communication
          </button>
        </form>
      </div>
    </section>
  )
}
