import { governRoute } from '@/lib/runtime/governor/route'
import { NextRequest } from 'next/server'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { acContext, audit, canAccessConversationRow, fail, ok } from '@/lib/ac-whatsapp/server'

const ACTIONS = new Set([
  'reply','reply_matrix','summary','translate','next_action','unanswered_questions','commitments',
  'objections','tone_guard','chapters','executive_replay','sentiment_risk','quality_control',
  'relationship_score','document_summary','voice_summary',
])

const SYSTEM = `Tu es AC Conversation Intelligence, copilote exécutif d'ANGELCARE. Tu aides un opérateur humain à comprendre, répondre, décider et convertir. Tu ne fabriques jamais un prix, engagement, politique, identité ou fait. Tu distingues faits, inférences et informations manquantes. Tu cites les messages par date ou extrait court lorsque le format le permet. Tu ne déclenches aucune action et tu ne prétends jamais avoir envoyé un message. Réponds en français professionnel, humain, clair et immédiatement exploitable.`

function fallback(action: string, messages: any[], sourceText: string) {
  const inbound = [...messages].reverse().filter((row) => row.direction === 'inbound')
  const last = String(inbound[0]?.body || inbound[0]?.caption || sourceText || '')
  const lines = inbound.slice(0, 6).map((row, index) => `${index + 1}. ${String(row.body || row.caption || '').slice(0, 180)}`).filter((line) => !line.endsWith('. '))
  if (action === 'summary') return `BESOIN ACTUEL\n${last || 'Aucun besoin textuel récent.'}\n\nÀ CONFIRMER\nIdentité, objectif précis, décideur et prochaine action datée.`
  if (action === 'reply_matrix') return `OPTION 1 — CONCISE\nBonjour, merci pour votre message. Nous avons bien pris en compte votre demande. Pouvez-vous me confirmer le point prioritaire afin que je vous apporte une réponse précise ?\n\nOPTION 2 — RELATIONNELLE\nBonjour, merci pour votre retour et pour l’intérêt porté à AngelCare. Je souhaite bien comprendre votre besoin afin de vous orienter vers la solution la plus pertinente. Quel est le résultat principal que vous recherchez ?\n\nOPTION 3 — COMMERCIALE\nBonjour, merci pour votre message. Afin de vous proposer une suite réellement adaptée, je vous invite à confirmer votre besoin, votre calendrier et la personne impliquée dans la décision.`
  if (action === 'unanswered_questions') return `QUESTIONS DÉTECTÉES\n${lines.length ? lines.join('\n') : 'Aucune question textuelle identifiable.'}\n\nACTION\nVérifier manuellement lesquelles ont reçu une réponse complète.`
  if (action === 'commitments') return `ENGAGEMENTS À VÉRIFIER\nAucun engagement fiable ne peut être extrait sans validation humaine. Examiner les formulations contenant : confirmer, envoyer, rappeler, préparer, avant, demain, date ou heure.`
  if (action === 'objections') return `OBJECTION POSSIBLE\n${last || 'Non déterminée.'}\n\nDIAGNOSTIC À CONFIRMER\nPrix, confiance, timing, autorité, besoin, concurrence ou faisabilité.\n\nRÉPONSE RECOMMANDÉE\nClarifier l’objection réelle avant de proposer une remise ou une promesse.`
  if (action === 'tone_guard') return `CONTRÔLE TONALITÉ\nVérifier : nom correct, réponse à chaque question, promesse réaliste, prochaine étape claire, longueur proportionnée et ton cohérent avec la relation.`
  if (action === 'chapters') return `CHAPITRES PROPOSÉS\n1. Prise de contact\n2. Qualification du besoin\n3. Proposition ou information\n4. Questions / objections\n5. Prochaine action\n\nValidation humaine requise.`
  if (action === 'executive_replay') return `REPLAY EXÉCUTIF\nDernier signal entrant : ${last || 'aucun'}\nDécision ouverte : qualification et prochaine action.\nRisque principal : contexte incomplet.`
  if (action === 'sentiment_risk') return `TRAJECTOIRE\nSentiment non déterminé de façon fiable. Examiner les changements de ton, les répétitions, les délais et les questions non répondues.`
  if (action === 'quality_control') return `GATE QUALITÉ\n☐ Nom et organisation corrects\n☐ Toutes les questions traitées\n☐ Aucun engagement non autorisé\n☐ Prochaine action datée\n☐ Ton humain et professionnel\n☐ Message suffisamment concis`
  if (action === 'relationship_score') return `SCORECARD À CONFIRMER\nIdentité : à vérifier\nBesoin : partiellement qualifié\nDécideur : non confirmé\nEngagements : à recenser\nRisque : contexte incomplet\nProchaine action : confirmer le besoin et convenir d’une étape datée.`
  if (action === 'next_action') return `Confirmer le besoin prioritaire, identifier le décideur et convenir d’une prochaine action datée.`
  if (action === 'translate') return sourceText || last
  return `Bonjour, merci pour votre message. Nous avons bien pris en compte votre demande. Afin de vous répondre avec précision, pouvez-vous me confirmer votre besoin prioritaire et le délai souhaité ?`
}

async function POST__angelcareGovernedImpl(request: NextRequest) {
  const context = await acContext(request, 'ac-whatsapp.message.send')
  if ('error' in context) return context.error
  const body = await request.json().catch(() => ({}))
  const conversationId = String(body.conversationId || '')
  const action = String(body.action || 'reply')
  const sourceText = String(body.sourceText || '')
  if (!conversationId || !ACTIONS.has(action)) return fail('INVALID_AI_REQUEST', 422)

  const conversation = await context.supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*)').eq('id', conversationId).maybeSingle()
  if (conversation.error) return fail(conversation.error.message, 500)
  if (!conversation.data) return fail('CONVERSATION_NOT_FOUND', 404)
  if (!canAccessConversationRow(context, conversation.data)) return fail('CONVERSATION_ACCESS_DENIED', 403)

  const messages = await context.supabase.from('ac_whatsapp_messages').select('id,direction,message_type,body,caption,sender_display_name_snapshot,sender_role_snapshot,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(120)
  if (messages.error) return fail(messages.error.message, 500)
  const history = (messages.data || []).reverse()

  let text = ''
  let provider = 'deterministic'
  const key = process.env.GEMINI_API_KEY
  if (key) {
    try {
      const ai = new GoogleGenAI({ apiKey: key })
      const prompt = {
        action,
        sourceText,
        contact: { name: conversation.data.contact?.display_name, organization: conversation.data.contact?.organization_name, type: conversation.data.contact?.contact_type, language: conversation.data.contact?.preferred_language },
        conversation: { status: conversation.data.status, priority: conversation.data.priority, intent: conversation.data.intent, sentiment: conversation.data.sentiment, summary: conversation.data.summary },
        messages: history,
      }
      const response = await ai.models.generateContent({ model: process.env.AC_WHATSAPP_GEMINI_MODEL || 'gemini-2.5-flash', contents: JSON.stringify(prompt), config: { systemInstruction: SYSTEM, maxOutputTokens: 1400, thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } })
      text = String(response.text || '').trim()
      provider = 'gemini'
    } catch { text = '' }
  }
  if (!text) text = fallback(action, history, sourceText)
  await audit(context, { action: `ai.${action}`, entityType: 'conversation', entityId: conversationId, metadata: { provider, historyMessages: history.length } })
  return ok({ text, provider, action })
}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/ac-whatsapp/ai/assist',
  },
  POST__angelcareGovernedImpl,
)
