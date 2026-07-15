export type InvestorCommunicationType =
  | 'investor_intro'
  | 'follow_up'
  | 'data_room_invite'
  | 'nda_request'
  | 'meeting_request'
  | 'soft_commit_request'
  | 'closing_followup'
  | 'reporting_update'

export type InvestorCommunicationPhase =
  | 'prospect'
  | 'contacted'
  | 'nda'
  | 'data_room'
  | 'negotiation'
  | 'soft_commit'
  | 'closed'

export type InvestorCommunicationChannel = 'email' | 'whatsapp' | 'call'

export type InvestorTemplateInput = {
  type: InvestorCommunicationType | string
  phase: InvestorCommunicationPhase | string
  channel: InvestorCommunicationChannel | string
  investorName?: string
  contactName?: string
  ticketRange?: string
  currency?: string
  relationshipOwner?: string
}

type TemplateOutput = {
  subject: string
  message: string
}

const TYPES: Record<InvestorCommunicationType, {
  label: string
  intention: string
  proofAngle: string
  nextStep: string
}> = {
  investor_intro: {
    label: 'Introduction investisseur',
    intention: 'ouvrir une relation qualifiée avec un investisseur potentiel',
    proofAngle: 'positionnement, modèle économique, besoin de financement, allocation des fonds et trajectoire d’exécution',
    nextStep: 'qualifier l’intérêt initial et identifier le bon interlocuteur décisionnaire',
  },
  follow_up: {
    label: 'Relance structurée',
    intention: 'relancer sans pression tout en renforçant la crédibilité du dossier',
    proofAngle: 'avancement du dossier, clarté des hypothèses, prochaines étapes et disponibilité des éléments complémentaires',
    nextStep: 'obtenir un retour clair ou une prochaine date d’échange',
  },
  data_room_invite: {
    label: 'Invitation data room',
    intention: 'ouvrir un accès contrôlé aux éléments d’analyse et de décision',
    proofAngle: 'documents financiers, opérationnels, commerciaux, juridiques et stratégiques organisés pour revue',
    nextStep: 'confirmer l’accès, le périmètre de lecture et les questions prioritaires',
  },
  nda_request: {
    label: 'Demande NDA',
    intention: 'sécuriser l’échange confidentiel avant transmission des informations sensibles',
    proofAngle: 'protection des données, transparence du processus et sérieux de la démarche d’investissement',
    nextStep: 'valider ou signer le NDA afin de poursuivre l’analyse',
  },
  meeting_request: {
    label: 'Demande de réunion',
    intention: 'obtenir un rendez-vous utile, court et orienté décision',
    proofAngle: 'synthèse du projet, enjeux de financement, critères investisseur et compatibilité stratégique',
    nextStep: 'planifier un échange avec agenda clair et livrables attendus',
  },
  soft_commit_request: {
    label: 'Demande de soft commitment',
    intention: 'transformer l’intérêt qualifié en intention d’investissement mesurable',
    proofAngle: 'ticket indicatif, conditions attendues, calendrier, réserves et niveau de conviction',
    nextStep: 'formaliser une intention non contraignante ou une fourchette d’engagement',
  },
  closing_followup: {
    label: 'Relance closing',
    intention: 'finaliser les éléments ouverts avant engagement ou closing',
    proofAngle: 'points restants, documentation, calendrier de signature, paiement et gouvernance post-investissement',
    nextStep: 'clôturer les validations et confirmer la date cible',
  },
  reporting_update: {
    label: 'Mise à jour reporting',
    intention: 'tenir l’investisseur informé avec précision, discipline et transparence',
    proofAngle: 'avancement, métriques clés, décisions, risques, besoins et prochaines échéances',
    nextStep: 'maintenir la confiance et préparer la prochaine action de suivi',
  },
}

const PHASES: Record<InvestorCommunicationPhase, {
  label: string
  context: string
  tone: string
  objective: string
}> = {
  prospect: {
    label: 'Prospect',
    context: 'premier niveau de qualification, sans présumer de l’intérêt ni du mandat exact',
    tone: 'professionnel, ouvert et crédible',
    objective: 'créer une première ouverture sérieuse',
  },
  contacted: {
    label: 'Contact initial',
    context: 'relation déjà ouverte avec un besoin de structurer le prochain échange',
    tone: 'direct, courtois et orienté suivi',
    objective: 'faire progresser la relation vers un échange qualifié',
  },
  nda: {
    label: 'NDA',
    context: 'phase de confidentialité où les éléments sensibles doivent être protégés',
    tone: 'rigoureux, rassurant et institutionnel',
    objective: 'sécuriser le cadre de partage d’information',
  },
  data_room: {
    label: 'Data room',
    context: 'phase d’analyse documentaire et de due diligence investisseur',
    tone: 'organisé, précis et analytique',
    objective: 'faciliter une revue efficace du dossier',
  },
  negotiation: {
    label: 'Négociation',
    context: 'discussion sur les termes, conditions, réserves et calendrier',
    tone: 'ferme, équilibré et constructif',
    objective: 'clarifier les points ouverts et avancer vers une intention solide',
  },
  soft_commit: {
    label: 'Soft commit',
    context: 'intérêt avancé nécessitant une formalisation de l’intention',
    tone: 'confiant, structuré et orienté décision',
    objective: 'obtenir une confirmation d’intention mesurable',
  },
  closed: {
    label: 'Clôturé',
    context: 'relation entrée en phase de closing, reporting ou suivi post-décision',
    tone: 'institutionnel, transparent et orienté exécution',
    objective: 'maintenir la confiance et sécuriser la continuité',
  },
}

function safeType(value: string): InvestorCommunicationType {
  return Object.keys(TYPES).includes(value) ? value as InvestorCommunicationType : 'investor_intro'
}

function safePhase(value: string): InvestorCommunicationPhase {
  return Object.keys(PHASES).includes(value) ? value as InvestorCommunicationPhase : 'prospect'
}

function safeChannel(value: string): InvestorCommunicationChannel {
  return value === 'whatsapp' || value === 'call' ? value : 'email'
}

function buildEmail(input: Required<InvestorTemplateInput>, type: InvestorCommunicationType, phase: InvestorCommunicationPhase): TemplateOutput {
  const t = TYPES[type]
  const p = PHASES[phase]

  return {
    subject: `${t.label} — AngelCare Capital | ${p.label}`,
    message: `Bonjour ${input.contactName},

Je me permets de vous contacter dans le cadre du dossier AngelCare Capital. L’objectif de cette communication est de ${t.intention}, avec une approche ${p.tone} adaptée à la phase actuelle: ${p.label}.

Contexte actuel:
- Investisseur ciblé: ${input.investorName}
- Phase du cycle: ${p.label}
- Situation: ${p.context}
- Objectif immédiat: ${p.objective}
- Ticket / indication financière: ${input.ticketRange || 'à confirmer selon votre stratégie d’investissement'}

Éléments que nous souhaitons mettre en avant:
- ${t.proofAngle}
- une lecture claire des besoins de financement et de l’usage des fonds
- une démarche structurée, traçable et compatible avec une analyse professionnelle
- une volonté de répondre rapidement aux questions financières, opérationnelles et stratégiques

Notre intention n’est pas de créer une pression commerciale, mais de vous transmettre un dossier crédible, exploitable et suffisamment structuré pour faciliter une décision rationnelle. Nous pouvons adapter le niveau de détail selon votre rôle, votre mandat, votre horizon d’investissement et vos critères internes.

Prochaine étape recommandée:
${t.nextStep}.

Je reste disponible pour organiser un échange court, partager les éléments nécessaires ou coordonner la suite avec le bon interlocuteur de votre côté.

Bien cordialement,
${input.relationshipOwner || 'AngelCare Capital Command Center'}`,
  }
}

function buildWhatsapp(input: Required<InvestorTemplateInput>, type: InvestorCommunicationType, phase: InvestorCommunicationPhase): TemplateOutput {
  const t = TYPES[type]
  const p = PHASES[phase]

  return {
    subject: `${t.label} — ${p.label}`,
    message: `Bonjour ${input.contactName}, je vous contacte au sujet du dossier AngelCare Capital. Nous sommes en phase ${p.label} et l’objectif est de ${t.intention}. Le dossier est structuré autour de ${t.proofAngle}. ${input.ticketRange ? `Indication: ${input.ticketRange}. ` : ''}Seriez-vous disponible pour confirmer le bon canal de suivi et la prochaine étape ?`,
  }
}

function buildCall(input: Required<InvestorTemplateInput>, type: InvestorCommunicationType, phase: InvestorCommunicationPhase): TemplateOutput {
  const t = TYPES[type]
  const p = PHASES[phase]

  return {
    subject: `Script appel — ${t.label} | ${p.label}`,
    message: `SCRIPT D’APPEL — ${t.label.toUpperCase()}

1. Ouverture
Bonjour ${input.contactName}, je vous appelle au sujet du dossier AngelCare Capital. Est-ce que je vous dérange quelques instants ?

2. Positionnement
Nous sommes actuellement dans une phase ${p.label}. Le contexte est le suivant: ${p.context}. L’objectif de cet appel est de ${t.intention}.

3. Crédibilité du dossier
Le dossier est structuré autour de plusieurs éléments: ${t.proofAngle}. L’approche est volontairement claire, documentée et compatible avec une revue professionnelle.

4. Qualification
Est-ce que ce type d’opportunité correspond actuellement à vos critères, à votre mandat ou à une personne spécifique au sein de votre organisation ?

5. Question d’avancement
La prochaine étape logique serait de ${t.nextStep}. Est-ce que vous préférez recevoir les éléments par email, WhatsApp, data room ou organiser un échange dédié ?

6. Clôture
Merci pour votre retour. Je vais formaliser la suite proprement afin que vous disposiez d’un suivi clair et exploitable.`,
  }
}

export function getInvestorCommunicationTemplate(input: InvestorTemplateInput): TemplateOutput {
  const normalized: Required<InvestorTemplateInput> = {
    type: input.type || 'investor_intro',
    phase: input.phase || 'prospect',
    channel: input.channel || 'email',
    investorName: input.investorName || 'votre organisation',
    contactName: input.contactName || 'Madame, Monsieur',
    ticketRange: input.ticketRange || '',
    currency: input.currency || 'Dhs',
    relationshipOwner: input.relationshipOwner || 'AngelCare Capital Command Center',
  }

  const type = safeType(String(normalized.type))
  const phase = safePhase(String(normalized.phase))
  const channel = safeChannel(String(normalized.channel))

  if (channel === 'whatsapp') return buildWhatsapp(normalized, type, phase)
  if (channel === 'call') return buildCall(normalized, type, phase)
  return buildEmail(normalized, type, phase)
}

export const INVESTOR_COMMUNICATION_TEMPLATE_COUNT = 8 * 7 * 3
