'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  Copy,
  FileText,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'

type EmployeeRecord = Record<string, any>

type CategoryMeta = {
  key: string
  label: string
  hint: string
  icon: any
  titles: string[]
}

const CATEGORY_META: CategoryMeta[] = [
  {
    key: 'onboarding',
    label: 'Intégration & onboarding',
    hint: 'Accueil, cadrage, parcours d’intégration',
    icon: UserPlus,
    titles: [
      'Bienvenue et rappel du parcours d’intégration',
      'Checklist de démarrage et documents à finaliser',
      'Point de cadrage des responsabilités',
      'Présentation du manager et du mode de collaboration',
      'Plan des 30 premiers jours',
      'Convocation à la réunion d’intégration',
      'Validation du dossier administratif',
      'Rappel des outils et accès obligatoires',
      'Message de bienvenue de l’équipe RH',
      'Suivi de fin de première semaine',
    ],
  },
  {
    key: 'attendance',
    label: 'Présence & pointage',
    hint: 'Pointage, retard, assiduité, planning',
    icon: CalendarClock,
    titles: [
      'Rappel de pointage quotidien',
      'Alerte retard constaté',
      'Confirmation d’assiduité conforme',
      'Demande de régularisation d’une anomalie de pointage',
      'Mise à jour de planning hebdomadaire',
      'Notification de présence exceptionnelle',
      'Suivi d’absence non justifiée',
      'Point de contrôle sur la discipline horaire',
      'Confirmation de validation du pointage',
      'Rappel des règles de présence AngelCare',
    ],
  },
  {
    key: 'leave',
    label: 'Congés & absences',
    hint: 'Congés, indisponibilités, justificatifs',
    icon: CalendarDays,
    titles: [
      'Accusé de réception de demande de congé',
      'Validation de demande de congé',
      'Refus motivé de demande de congé',
      'Demande de justificatif d’absence',
      'Rappel de solde de congés',
      'Suivi d’absence prolongée',
      'Validation d’absence exceptionnelle',
      'Point RH sur la planification des congés',
      'Mise à jour du calendrier des absences',
      'Relance dossier congé incomplet',
    ],
  },
  {
    key: 'performance',
    label: 'Performance & objectifs',
    hint: 'Suivi individuel, feedback, objectifs',
    icon: Target,
    titles: [
      'Point d’avancement sur objectifs',
      'Feedback de performance trimestriel',
      'Plan d’amélioration ciblé',
      'Félicitations pour performance remarquable',
      'Convocation à un point de performance',
      'Synthèse de revue de performance',
      'Suivi des KPI individuels',
      'Rappel des priorités opérationnelles',
      'Préparation d’entretien d’évaluation',
      'Validation du plan d’action de performance',
    ],
  },
  {
    key: 'compliance',
    label: 'Discipline & conformité',
    hint: 'Règles, conformité, escalade, recadrage',
    icon: ShieldCheck,
    titles: [
      'Rappel des règles internes AngelCare',
      'Demande de mise en conformité',
      'Notification de non-conformité constatée',
      'Convocation à un entretien de recadrage',
      'Confirmation de conformité rétablie',
      'Rappel confidentialité et protection des données',
      'Rappel des standards de comportement professionnel',
      'Suivi d’un incident disciplinaire',
      'Clôture d’un point de conformité',
      'Message préventif de sensibilisation RH',
    ],
  },
  {
    key: 'training',
    label: 'Formation & développement',
    hint: 'Montée en compétence, coaching, learning',
    icon: GraduationCap,
    titles: [
      'Invitation à une session de formation',
      'Rappel de participation à une formation',
      'Validation de complétion de formation',
      'Plan de développement individuel',
      'Suivi des besoins de formation',
      'Proposition de parcours de montée en compétence',
      'Synthèse post-formation',
      'Relance formation non complétée',
      'Inscription à un module prioritaire',
      'Coaching ciblé recommandé',
    ],
  },
  {
    key: 'payroll',
    label: 'Paie & documents RH',
    hint: 'Paie, contrats, pièces, justificatifs',
    icon: WalletCards,
    titles: [
      'Demande de document RH manquant',
      'Confirmation de réception d’un document',
      'Point sur la préparation de la paie',
      'Relance dossier contractuel incomplet',
      'Notification de mise à jour administrative',
      'Demande de confirmation des informations bancaires',
      'Rappel de signature d’un document',
      'Transmission de document RH validé',
      'Alerte incohérence administrative',
      'Clôture d’un dossier documentaire',
    ],
  },
  {
    key: 'engagement',
    label: 'Engagement & bien-être',
    hint: 'Climat, motivation, écoute active, support',
    icon: HeartHandshake,
    titles: [
      'Prise de nouvelles et écoute RH',
      'Check-in de bien-être au travail',
      'Message de reconnaissance professionnelle',
      'Invitation à un échange de soutien RH',
      'Suivi moral et engagement collaborateur',
      'Sondage rapide de satisfaction interne',
      'Rappel des canaux de support RH',
      'Message de remerciement pour implication',
      'Relance après signal faible RH',
      'Préparation d’un entretien d’écoute',
    ],
  },
]

function pick(row: EmployeeRecord | null | undefined, fields: string[], fallback = ''): string {
  if (!row) return fallback
  for (const field of fields) {
    const value = row?.[field]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim()
    }
  }
  return fallback
}

function niceStatus(value: string) {
  const raw = String(value || '').toLowerCase()
  if (raw === 'active') return 'Actif'
  if (raw === 'pending') return 'En attente'
  if (raw === 'archiv' || raw === 'archived') return 'Archivé'
  return value || 'Non renseigné'
}

function cleanPhone(value: string) {
  return String(value || '')
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '')
}

function makeSubject(categoryLabel: string, templateTitle: string, employeeName: string) {
  return `AngelCare RH | ${categoryLabel} | ${templateTitle} | ${employeeName}`
}

function makeBody(category: CategoryMeta, templateTitle: string, employee: EmployeeRecord | null, templateIndex: number) {
  const employeeName = pick(employee, ['full_name', 'name'], 'Collaborateur')
  const firstName = employeeName.split(' ')[0] || employeeName
  const department = pick(employee, ['department'], 'Département non renseigné')
  const role = pick(employee, ['position', 'job_title', 'role'], 'Fonction non renseignée')
  const city = pick(employee, ['city', 'location'], 'Site non renseigné')
  const email = pick(employee, ['email'], 'Non renseigné')
  const phone = pick(employee, ['phone', 'mobile', 'whatsapp_phone'], 'Non renseigné')

  const actionLineByCategory: Record<string, string> = {
    onboarding: `Merci de confirmer votre bonne compréhension des prochaines étapes d’intégration et de signaler tout besoin de support complémentaire.`,
    attendance: `Merci de vérifier votre situation et de nous confirmer toute action corrective ou précision utile avant la prochaine clôture de contrôle.`,
    leave: `Merci de nous transmettre votre retour ou les justificatifs nécessaires afin de finaliser le traitement RH dans les meilleurs délais.`,
    performance: `Merci de préparer vos éléments de retour, vos points d’avancement et, le cas échéant, vos propositions d’amélioration ou d’appui.`,
    compliance: `Merci de prendre connaissance de ce point avec la plus grande attention et de nous confirmer les actions correctives ou préventives engagées.`,
    training: `Merci de confirmer votre disponibilité, vos besoins de montée en compétence ou votre progression sur le parcours concerné.`,
    payroll: `Merci de nous transmettre les éléments attendus ou de confirmer la validité des informations administratives associées à votre dossier.`,
    engagement: `Merci de nous faire part de votre retour, de vos besoins ou de toute difficulté afin que l’équipe RH puisse vous accompagner au mieux.`,
  }

  const urgencyByIndex =
    templateIndex < 3
      ? 'Priorité : standard.'
      : templateIndex < 7
        ? 'Priorité : suivi renforcé.'
        : 'Priorité : action rapide recommandée.'

  return `Bonjour ${firstName},

Dans le cadre du pilotage RH AngelCare, nous vous contactons au sujet de : ${templateTitle.toLowerCase()}.

Contexte
• Collaborateur : ${employeeName}
• Département : ${department}
• Fonction : ${role}
• Ville / site : ${city}
• Référence dossier : ${email} / ${phone}

Message RH
Nous souhaitons formaliser ce point dans une logique claire, professionnelle et orientée exécution. L’objectif est d’assurer un suivi fiable, une bonne coordination opérationnelle et un traitement homogène des situations collaborateurs.

Axes de communication
• Situation concernée : ${category.label}
• Objet précis : ${templateTitle}
• Niveau de suivi : ${urgencyByIndex}
• Standard de communication : formel, constructif et orienté solution.

Action attendue
${actionLineByCategory[category.key]}

Prochaine étape
Merci de revenir vers l’équipe RH AngelCare par le canal approprié afin que nous puissions enregistrer la suite donnée, valider le statut et clôturer ou poursuivre le traitement.

Cordialement,
Équipe RH AngelCare
Communication collaborateurs · HR Command OS`
}

type Props = {
  employees: EmployeeRecord[]
  selectedEmployee: EmployeeRecord | null
  onSelectEmployee: (employee: EmployeeRecord | null) => void
}

export default function HREmployeeCommunicationHub({
  employees,
  selectedEmployee,
  onSelectEmployee,
}: Props) {
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [activeCategoryKey, setActiveCategoryKey] = useState(CATEGORY_META[0].key)
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const employeeOptions = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((employee) =>
      [
        pick(employee, ['full_name', 'name']),
        pick(employee, ['email']),
        pick(employee, ['department']),
        pick(employee, ['position', 'job_title', 'role']),
        pick(employee, ['city', 'location']),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [employees, employeeQuery])

  useEffect(() => {
    if (!selectedEmployee && employees.length) {
      onSelectEmployee(employees[0])
    }
  }, [selectedEmployee, employees, onSelectEmployee])

  const activeEmployee = useMemo(() => {
    if (selectedEmployee) return selectedEmployee
    return employees[0] || null
  }, [selectedEmployee, employees])

  const activeCategory = useMemo(() => {
    return CATEGORY_META.find((item) => item.key === activeCategoryKey) || CATEGORY_META[0]
  }, [activeCategoryKey])

  const templates = useMemo(() => {
    const employeeName = pick(activeEmployee, ['full_name', 'name'], 'Collaborateur')
    return activeCategory.titles.map((title, index) => ({
      id: `${activeCategory.key}-${index}`,
      title,
      subject: makeSubject(activeCategory.label, title, employeeName),
      body: makeBody(activeCategory, title, activeEmployee, index),
    }))
  }, [activeCategory, activeEmployee])

  useEffect(() => {
    const current = templates[activeTemplateIndex] || templates[0]
    setSubject(current?.subject || '')
    setBody(current?.body || '')
  }, [templates, activeTemplateIndex])

  useEffect(() => {
    setActiveTemplateIndex(0)
  }, [activeCategoryKey])

  const employeeId = pick(activeEmployee, ['id', 'employee_id', 'email'], '')
  const employeeName = pick(activeEmployee, ['full_name', 'name'], 'Collaborateur')
  const employeeRole = pick(activeEmployee, ['position', 'job_title', 'role'], 'Fonction non renseignée')
  const employeeDept = pick(activeEmployee, ['department'], 'Département non renseigné')
  const employeeCity = pick(activeEmployee, ['city', 'location'], 'Ville non renseignée')
  const employeeEmail = pick(activeEmployee, ['email'], '')
  const employeePhoneRaw = pick(activeEmployee, ['phone', 'mobile', 'whatsapp_phone'], '')
  const employeePhone = cleanPhone(employeePhoneRaw)
  const employeeStatus = niceStatus(pick(activeEmployee, ['employment_status', 'status'], 'active'))
  const ready = Number(activeEmployee?.__sync?.readiness || 0)
  const risk = Number(activeEmployee?.__sync?.risk || 0)

  const whatsappHref = employeePhone
    ? `https://wa.me/${employeePhone.replace(/^\+/, '')}?text=${encodeURIComponent(body)}`
    : ''
  const emailHref = employeeEmail
    ? `mailto:${employeeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : ''
  const phoneHref = employeePhone ? `tel:${employeePhone}` : ''
  const profileHref = employeeId ? `/hr/employees/${employeeId}` : '/hr/employees'

  const currentTemplate = templates[activeTemplateIndex] || templates[0]

  const totalTemplates = CATEGORY_META.reduce((sum, category) => sum + category.titles.length, 0)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`)
    } catch {
      // silent fallback
    }
  }

  return (
    <section className="mt-6 rounded-[34px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-slate-200/70">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
            HR communication command
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
            Centre intelligent de communication collaborateurs
          </h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Hub RH premium pour piloter les échanges AngelCare avec les collaborateurs :
            messages préchargés, contextes métier, personnalisation live, actions WhatsApp,
            email et appel, le tout connecté aux données employé en temps réel.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[420px]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Collaborateur ciblé</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{employeeName}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{employeeDept} · {employeeCity}</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">Canaux actifs</p>
            <p className="mt-2 text-2xl font-black text-emerald-950">3</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">WhatsApp · email · appel</p>
          </div>
          <div className="rounded-[24px] border border-violet-100 bg-violet-50 px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">Contextes RH</p>
            <p className="mt-2 text-2xl font-black text-violet-950">{CATEGORY_META.length}</p>
            <p className="mt-1 text-sm font-bold text-violet-700">Communication pro préintégrée</p>
          </div>
          <div className="rounded-[24px] border border-cyan-100 bg-cyan-50 px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">Modèles chargés</p>
            <p className="mt-2 text-2xl font-black text-cyan-950">{totalTemplates}</p>
            <p className="mt-1 text-sm font-bold text-cyan-700">Templates RH style corporate</p>
          </div>
        </div>
      </div>

      {!employees.length ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-xl font-black text-slate-900">Aucun employé disponible</p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Cette zone devient active dès que des profils collaborateurs sont disponibles dans la base RH.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <div>
                <p className="text-sm font-black text-slate-950">Contextes de communication</p>
                <p className="text-xs font-bold text-slate-500">8 parcours RH opérationnels</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {CATEGORY_META.map((category) => {
                const Icon = category.icon
                const active = category.key === activeCategoryKey
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategoryKey(category.key)}
                    className={
                      active
                        ? 'w-full rounded-[22px] border border-violet-200 bg-violet-50 p-4 text-left shadow-sm'
                        : 'w-full rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/60'
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className={active ? 'rounded-2xl bg-violet-600 p-2 text-white' : 'rounded-2xl bg-slate-100 p-2 text-slate-600'}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={active ? 'text-sm font-black text-violet-950' : 'text-sm font-black text-slate-900'}>
                            {category.label}
                          </p>
                          <p className={active ? 'mt-1 text-xs font-bold text-violet-700' : 'mt-1 text-xs font-bold text-slate-500'}>
                            {category.hint}
                          </p>
                        </div>
                      </div>
                      <span className={active ? 'rounded-full bg-white px-2 py-1 text-[11px] font-black text-violet-700' : 'rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500'}>
                        {category.titles.length}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Bibliothèque de modèles</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">{activeCategory.label}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{activeCategory.hint}</p>
              </div>
              <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                10 modèles professionnels prêts à adapter
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {templates.map((template, index) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setActiveTemplateIndex(index)}
                  className={
                    index === activeTemplateIndex
                      ? 'rounded-[20px] border border-violet-200 bg-violet-50 p-4 text-left'
                      : 'rounded-[20px] border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50/60'
                  }
                >
                  <p className={index === activeTemplateIndex ? 'text-sm font-black text-violet-950' : 'text-sm font-black text-slate-900'}>
                    {template.title}
                  </p>
                  <p className={index === activeTemplateIndex ? 'mt-1 text-xs font-bold text-violet-700' : 'mt-1 text-xs font-bold text-slate-500'}>
                    Modèle {index + 1} · style RH corporate
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Prévisualisation éditable</p>
                  <h4 className="mt-1 text-xl font-black text-slate-950">{currentTemplate?.title || 'Modèle RH'}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                  >
                    <Copy className="mr-2 inline h-4 w-4" />
                    Copier
                  </button>

                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <MessageSquare className="mr-2 inline h-4 w-4" />
                      WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2 text-sm font-black text-slate-400"
                    >
                      <MessageSquare className="mr-2 inline h-4 w-4" />
                      WhatsApp
                    </button>
                  )}

                  {emailHref ? (
                    <a
                      href={emailHref}
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Mail className="mr-2 inline h-4 w-4" />
                      Email
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2 text-sm font-black text-slate-400"
                    >
                      <Mail className="mr-2 inline h-4 w-4" />
                      Email
                    </button>
                  )}

                  {phoneHref ? (
                    <a
                      href={phoneHref}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                    >
                      <Phone className="mr-2 inline h-4 w-4" />
                      Appeler
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2 text-sm font-black text-slate-400"
                    >
                      <Phone className="mr-2 inline h-4 w-4" />
                      Appeler
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Objet</span>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none ring-violet-200 focus:ring-4"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">Message</span>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={16}
                    className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-slate-700 outline-none ring-violet-200 focus:ring-4"
                  />
                </label>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />
              <div>
                <p className="text-sm font-black text-slate-950">Panneau collaborateur live</p>
                <p className="text-xs font-bold text-slate-500">Coordonnées, statut et accès directs</p>
              </div>
            </div>

            <label className="relative mt-4 block">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-violet-500" />
              <input
                value={employeeQuery}
                onChange={(event) => setEmployeeQuery(event.target.value)}
                placeholder="Rechercher un collaborateur..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold text-slate-700 outline-none ring-violet-200 focus:ring-4"
              />
            </label>

            <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
              {employeeOptions.map((employee, index) => {
                const rowId = pick(employee, ['id', 'employee_id', 'email'], `emp-${index}`)
                const rowName = pick(employee, ['full_name', 'name'], 'Collaborateur')
                const isActive = rowId === employeeId
                return (
                  <button
                    key={rowId}
                    type="button"
                    onClick={() => onSelectEmployee(employee)}
                    className={
                      isActive
                        ? 'w-full rounded-[20px] border border-violet-200 bg-violet-50 p-3 text-left'
                        : 'w-full rounded-[20px] border border-slate-200 bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/60'
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={isActive ? 'text-sm font-black text-violet-950' : 'text-sm font-black text-slate-900'}>
                          {rowName}
                        </p>
                        <p className={isActive ? 'mt-1 text-xs font-bold text-violet-700' : 'mt-1 text-xs font-bold text-slate-500'}>
                          {pick(employee, ['position', 'job_title', 'role'], 'Fonction')} · {pick(employee, ['city', 'location'], 'Ville')}
                        </p>
                      </div>
                      <span className={isActive ? 'rounded-full bg-white px-2 py-1 text-[11px] font-black text-violet-700' : 'rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500'}>
                        {niceStatus(pick(employee, ['employment_status', 'status'], 'active'))}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-slate-950">{employeeName}</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">{employeeRole}</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {employeeStatus}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Email</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{employeeEmail || 'Non renseigné'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Téléphone</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{employeePhoneRaw || 'Non renseigné'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Département</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{employeeDept}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Ville</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{employeeCity}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-700">Readiness</p>
                    <p className="mt-1 text-lg font-black text-violet-950">{ready}%</p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-700">Risque</p>
                    <p className="mt-1 text-lg font-black text-rose-950">{risk}%</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                    <AtSign className="mr-1 inline h-3.5 w-3.5" />
                    contact direct
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                    profil synchronisé
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={profileHref}
                    className="rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Ouvrir fiche 360
                  </Link>

                  {emailHref ? (
                    <a
                      href={emailHref}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                    >
                      Envoyer email
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2.5 text-center text-sm font-black text-slate-400"
                    >
                      Envoyer email
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2.5 text-center text-sm font-black text-slate-400"
                    >
                      WhatsApp
                    </button>
                  )}

                  {phoneHref ? (
                    <a
                      href={phoneHref}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-black text-slate-700 transition hover:border-violet-200 hover:bg-violet-50"
                    >
                      Appeler
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-2xl bg-slate-200 px-4 py-2.5 text-center text-sm font-black text-slate-400"
                    >
                      Appeler
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[20px] border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Synthèse live</p>
                <div className="mt-3 space-y-2 text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-violet-600" />{employeeRole}</div>
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-cyan-600" />{employeeDept}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" />{employeeCity}</div>
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-amber-600" />Contexte : {activeCategory.label}</div>
                  <div className="flex items-center gap-2"><Send className="h-4 w-4 text-rose-600" />Modèle : {currentTemplate?.title || 'N/A'}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}
