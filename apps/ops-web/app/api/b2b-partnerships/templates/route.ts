import { NextRequest, NextResponse } from 'next/server'
import { getCurrentB2BAppUser, getServerB2BDatabaseClient } from '@/lib/b2b-partnerships/runtime'
import { requireB2BPermission } from '@/lib/b2b-partnerships/permissions'

async function guard(action: 'read' | 'create' | 'update' = 'read') {
  const db = await getServerB2BDatabaseClient()
  const actor = await getCurrentB2BAppUser()

  if (!actor?.id) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 }) }
  }

  const permission = requireB2BPermission(action, {
    actorId: actor.id,
    actorRole: actor.role || actor.role_key,
    permissions: actor.permissions,
  })

  if (!permission.ok) {
    return { ok: false as const, db, actor, response: NextResponse.json({ ok: false, error: permission.error }, { status: permission.status }) }
  }

  return { ok: true as const, db, actor }
}

const fallbackTemplates = [
  {
    id: 'hotel-email-first-contact',
    name: 'Email premium — premier contact hôtel',
    category: 'Premier contact',
    channel: 'Email',
    prospect_segment: 'Hotel',
    objective: 'Créer de la curiosité autour d’une expérience famille différenciante.',
    subject: 'Créer une expérience famille différenciante pour {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nJe me permets de vous contacter car ANGELCARE développe des partenariats avec les hôtels et resorts qui souhaitent renforcer leur expérience famille : garde encadrée, animation enfants, kids club support et accompagnement premium des parents.\n\nPour un établissement comme {{prospect_name}}, cela peut devenir un vrai avantage de différenciation, notamment pour les familles, les séjours longs, les week-ends et les événements.\n\nSeriez-vous disponible pour un court échange de 15 minutes cette semaine afin de voir si un pilote simple pourrait avoir du sens ?',
    short_body: 'Bonjour {{decision_maker_name}}, ANGELCARE aide les hôtels à renforcer l’expérience famille avec des solutions enfants premium. Puis-je vous envoyer une courte présentation ?',
    cta: 'Proposer un échange de 15 minutes',
    recommended_next_step: 'Planifier appel découverte',
    tags: ['hotel', 'hospitality', 'famille'],
    variables: ['prospect_name', 'decision_maker_name', 'assigned_owner'],
    usage_notes: 'À utiliser pour hôtels, resorts et lieux hospitality premium.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'hotel-whatsapp-first-contact',
    name: 'WhatsApp — approche hôtel courte',
    category: 'Premier contact',
    channel: 'WhatsApp',
    prospect_segment: 'Hotel',
    objective: 'Obtenir une permission d’envoyer une présentation courte.',
    subject: '',
    body: 'Bonjour {{decision_maker_name}}, je vous contacte de la part d’ANGELCARE. Nous aidons les hôtels à améliorer l’expérience des familles grâce à des solutions enfants premium : garde, animation, kids club support et accompagnement parents. Puis-je vous envoyer une courte présentation adaptée à {{prospect_name}} ?',
    short_body: 'Bonjour {{decision_maker_name}}, puis-je vous envoyer une courte présentation ANGELCARE pour renforcer l’expérience famille de {{prospect_name}} ?',
    cta: 'Demander permission d’envoyer la présentation',
    recommended_next_step: 'Envoyer plaquette puis relancer sous 48h',
    tags: ['whatsapp', 'hotel'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'Message court pour décideur hôtel.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'clinic-email-first-contact',
    name: 'Email premium — clinique pédiatrique',
    category: 'Premier contact',
    channel: 'Email',
    prospect_segment: 'Pediatric clinic',
    objective: 'Positionner ANGELCARE comme partenaire famille/enfant complémentaire.',
    subject: 'Un partenariat famille/enfant complémentaire pour {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nANGELCARE développe des partenariats avec des cliniques pédiatriques, pédiatres et centres spécialisés afin d’apporter aux familles un accompagnement complémentaire autour de l’enfant : orientation parentale, activités éducatives, soutien post-consultation et solutions de garde ou d’accompagnement adaptées.\n\nL’objectif n’est pas de remplacer l’expertise médicale, mais d’enrichir l’expérience famille et de proposer un relais professionnel structuré lorsque les parents ont besoin d’un support concret.\n\nSeriez-vous ouvert(e) à un échange court afin d’évaluer une collaboration possible avec {{prospect_name}} ?',
    short_body: 'Bonjour {{decision_maker_name}}, ANGELCARE développe des partenariats avec les cliniques pédiatriques pour renforcer l’accompagnement des familles. Puis-je vous envoyer une courte présentation ?',
    cta: 'Obtenir un rendez-vous découverte',
    recommended_next_step: 'Planifier réunion clinique',
    tags: ['clinique', 'pédiatrie', 'famille'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'À utiliser pour cliniques, pédiatres et centres de développement enfant.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'clinic-whatsapp-first-contact',
    name: 'WhatsApp — clinique pédiatrique',
    category: 'Premier contact',
    channel: 'WhatsApp',
    prospect_segment: 'Pediatric clinic',
    objective: 'Créer une ouverture douce et professionnelle.',
    subject: '',
    body: 'Bonjour {{decision_maker_name}}, je vous contacte de la part d’ANGELCARE. Nous développons des partenariats avec les cliniques pédiatriques pour renforcer l’accompagnement des familles autour de l’enfant. Puis-je vous envoyer une courte présentation ?',
    short_body: 'Bonjour {{decision_maker_name}}, puis-je vous envoyer une courte présentation ANGELCARE pour un partenariat famille/enfant avec {{prospect_name}} ?',
    cta: 'Demander permission',
    recommended_next_step: 'Envoyer présentation',
    tags: ['whatsapp', 'clinique'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'Message court après identification décideur.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'follow-up-no-response',
    name: 'Relance — absence de réponse',
    category: 'Relance',
    channel: 'Email',
    prospect_segment: 'General',
    objective: 'Relancer sans pression en rappelant l’opportunité.',
    subject: 'Suite à mon message concernant {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nJe me permets de revenir vers vous concernant mon précédent message. Je pense sincèrement qu’un échange rapide pourrait permettre d’identifier une opportunité simple et utile pour {{prospect_name}}, sans engagement initial.\n\nL’idée serait simplement de voir si les solutions ANGELCARE peuvent créer de la valeur pour vos familles, vos clients ou vos patients selon votre activité.\n\nAuriez-vous 15 minutes cette semaine ou la semaine prochaine ?',
    short_body: 'Bonjour {{decision_maker_name}}, je me permets de revenir vers vous. Un échange de 15 minutes pourrait permettre d’évaluer une opportunité simple pour {{prospect_name}}.',
    cta: 'Demander disponibilité',
    recommended_next_step: 'Planifier relance téléphonique',
    tags: ['follow-up', 'relance'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'À utiliser après 48-72h sans réponse.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'meeting-confirmation',
    name: 'Confirmation rendez-vous',
    category: 'Meeting',
    channel: 'Email',
    prospect_segment: 'General',
    objective: 'Confirmer le rendez-vous et cadrer l’agenda.',
    subject: 'Confirmation de notre échange — ANGELCARE x {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nJe vous confirme notre échange prévu concernant les opportunités de partenariat entre ANGELCARE et {{prospect_name}}.\n\nObjectif de l’échange : comprendre vos priorités, présenter brièvement notre approche et identifier si un pilote simple peut être pertinent.\n\nAu plaisir d’échanger avec vous.',
    short_body: 'Bonjour {{decision_maker_name}}, je vous confirme notre échange concernant ANGELCARE x {{prospect_name}}. Au plaisir d’échanger avec vous.',
    cta: 'Confirmer présence',
    recommended_next_step: 'Préparer agenda réunion',
    tags: ['meeting', 'confirmation'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'À envoyer après réservation d’un rendez-vous.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'proposal-follow-up',
    name: 'Relance proposition commerciale',
    category: 'Proposition',
    channel: 'Email',
    prospect_segment: 'General',
    objective: 'Transformer une proposition envoyée en discussion de décision.',
    subject: 'Suite à la proposition ANGELCARE pour {{prospect_name}}',
    body: 'Bonjour {{decision_maker_name}},\n\nJe me permets de revenir vers vous concernant la proposition ANGELCARE transmise pour {{prospect_name}}.\n\nL’objectif est de garder une approche simple : valider ensemble le périmètre, ajuster si nécessaire, puis décider si un pilote opérationnel peut être lancé dans de bonnes conditions.\n\nSouhaitez-vous que nous planifiions un court échange pour parcourir la proposition ensemble ?',
    short_body: 'Bonjour {{decision_maker_name}}, souhaitez-vous que nous planifiions un court échange pour parcourir la proposition ANGELCARE ensemble ?',
    cta: 'Planifier revue proposition',
    recommended_next_step: 'Meeting de négociation',
    tags: ['proposal', 'deal'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'À utiliser après envoi proposition.',
    is_active: true,
    is_default: true,
  },
  {
    id: 'reactivation-dormant',
    name: 'Réactivation prospect silencieux',
    category: 'Réactivation',
    channel: 'WhatsApp',
    prospect_segment: 'General',
    objective: 'Réactiver un prospect sans créer de pression.',
    subject: '',
    body: 'Bonjour {{decision_maker_name}}, je me permets de revenir vers vous concernant ANGELCARE. Nous avons avancé sur nos offres partenariats et je pense qu’il peut y avoir une opportunité simple à réévaluer pour {{prospect_name}}. Souhaitez-vous que je vous renvoie un résumé très court ?',
    short_body: 'Bonjour {{decision_maker_name}}, souhaitez-vous que je vous renvoie un résumé court des opportunités ANGELCARE pour {{prospect_name}} ?',
    cta: 'Demander autorisation résumé',
    recommended_next_step: 'Envoyer résumé court',
    tags: ['reactivation', 'whatsapp'],
    variables: ['prospect_name', 'decision_maker_name'],
    usage_notes: 'À utiliser après longue période sans réponse.',
    is_active: true,
    is_default: true,
  },
]

function normalizeTemplate(row: any) {
  return {
    ...row,
    prospect_segment: row.prospect_segment || row.segment || row.sector || 'General',
    body: row.body || row.message_body || '',
    short_body: row.short_body || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    variables: Array.isArray(row.variables) ? row.variables : ['prospect_name', 'decision_maker_name'],
    is_active: row.is_active ?? true,
  }
}

export async function GET() {
  try {
    const g = await guard('read')
    if (!g.ok) return g.response

    const { data, error } = await g.db.from('b2b_templates').select('*').eq('is_active', true).order('created_at', { ascending: false })

    if (error) {
      console.error('[B2B_TEMPLATES_GET_FAILED]', error)
      return NextResponse.json({ ok: true, data: fallbackTemplates })
    }

    return NextResponse.json({ ok: true, data: data?.length ? data.map(normalizeTemplate) : fallbackTemplates })
  } catch (error) {
    console.error('[B2B_TEMPLATES_GET_CRASHED]', error)
    return NextResponse.json({ ok: true, data: fallbackTemplates })
  }
}

export async function POST(req: NextRequest) {
  try {
    const g = await guard('create')
    if (!g.ok) return g.response

    const body = await req.json()
    const payload = {
      name: body.name || 'Template B2B',
      category: body.category || 'Premier contact',
      channel: body.channel || 'Email',
      prospect_segment: body.prospect_segment || body.segment || 'General',
      objective: body.objective || null,
      subject: body.subject || null,
      body: body.body || body.message_body || '',
      short_body: body.short_body || null,
      cta: body.cta || null,
      recommended_next_step: body.recommended_next_step || null,
      usage_notes: body.usage_notes || null,
      tags: Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map((x) => x.trim()).filter(Boolean),
      variables: Array.isArray(body.variables) ? body.variables : String(body.variables || 'prospect_name,decision_maker_name').split(',').map((x) => x.trim()).filter(Boolean),
      is_active: body.is_active ?? true,
      is_default: body.is_default ?? false,
      created_by: g.actor.id,
    }

    const { data, error } = await g.db.from('b2b_templates').insert(payload).select('*').single()

    if (error) {
      console.error('[B2B_TEMPLATES_POST_FAILED]', error)
      return NextResponse.json({ ok: false, error: 'Unable to create template.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: normalizeTemplate(data) }, { status: 201 })
  } catch (error) {
    console.error('[B2B_TEMPLATES_POST_CRASHED]', error)
    return NextResponse.json({ ok: false, error: 'Unable to create template.' }, { status: 500 })
  }
}
