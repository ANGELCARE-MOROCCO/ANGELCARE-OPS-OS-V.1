import { NextResponse } from 'next/server'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { isTrustedSanilaMasterDemoContext } from '@/lib/angelcare360/server/command-center-experience'
import { getMasterDemoConfig, recordDemoEvent } from '@/lib/sanila-demo/authority'
import { SANILA_EXPERIENCE_MODULES, SANILA_GUIDED_JOURNEYS, SANILA_PRIORITY_OPTIONS } from '@/lib/angelcare360/experience/contract'

export const dynamic = 'force-dynamic'

const allowedEvents = new Set([
  'experience_visit_started',
  'experience_route_visited',
  'experience_module_visited',
  'experience_favorite_set',
  'experience_priority_set',
  'experience_question_added',
  'experience_journey_selected',
  'experience_conversion_intent',
  'experience_visit_reset',
])
const moduleIds = new Set<string>(SANILA_EXPERIENCE_MODULES.map((module) => module.id))
const journeyIds = new Set<string>(SANILA_GUIDED_JOURNEYS.map((journey) => journey.id))
const priorities = new Set<string>(SANILA_PRIORITY_OPTIONS)

function cleanText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function isCommandCenterPath(path: string) {
  return path === '/angelcare-360-command-center' || path.startsWith('/angelcare-360-command-center/')
}

export async function POST(request: Request) {
  const context = await getAngelcare360AccessContext().catch(() => null)
  if (!context || !isTrustedSanilaMasterDemoContext(context) || !context.demoAccess?.grantId) {
    return NextResponse.json({ ok: false, error: 'Master Demo authority required.' }, { status: 403 })
  }
  const config = await getMasterDemoConfig().catch(() => null)
  if (!config?.id || config.school_id !== context.school?.id) {
    return NextResponse.json({ ok: false, error: 'Master Demo configuration mismatch.' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const eventType = cleanText(body.eventType, 80)
  if (!allowedEvents.has(eventType)) return NextResponse.json({ ok: false, error: 'Unsupported event.' }, { status: 400 })

  const metadata: Record<string, unknown> = {}
  if (eventType === 'experience_route_visited' || eventType === 'experience_module_visited') {
    const path = cleanText(body.path, 500)
    if (!isCommandCenterPath(path)) return NextResponse.json({ ok: false, error: 'Invalid route.' }, { status: 400 })
    metadata.path = path
  }
  if (eventType === 'experience_module_visited' || eventType === 'experience_favorite_set') {
    const moduleId = cleanText(body.moduleId, 80)
    if (!moduleIds.has(moduleId)) return NextResponse.json({ ok: false, error: 'Invalid module.' }, { status: 400 })
    metadata.module_id = moduleId
  }
  if (eventType === 'experience_favorite_set' || eventType === 'experience_priority_set') metadata.enabled = body.enabled === true
  if (eventType === 'experience_priority_set') {
    const priority = cleanText(body.priority, 160)
    if (!priorities.has(priority)) return NextResponse.json({ ok: false, error: 'Invalid priority.' }, { status: 400 })
    metadata.priority = priority
  }
  if (eventType === 'experience_question_added') {
    const question = cleanText(body.question, 600)
    if (question.length < 3) return NextResponse.json({ ok: false, error: 'Question too short.' }, { status: 400 })
    metadata.question = question
  }
  if (eventType === 'experience_journey_selected') {
    const journeyId = cleanText(body.journeyId, 80)
    if (!journeyIds.has(journeyId)) return NextResponse.json({ ok: false, error: 'Invalid journey.' }, { status: 400 })
    metadata.journey_id = journeyId
  }
  if (eventType === 'experience_conversion_intent') {
    const intent = cleanText(body.intent, 120)
    if (!['guided_demo', 'proposal', 'contact', 'summary'].includes(intent)) return NextResponse.json({ ok: false, error: 'Invalid intent.' }, { status: 400 })
    metadata.intent = intent
  }
  metadata.source = 'sanila_experience_center'

  await recordDemoEvent({
    configId: config.id,
    grantId: context.demoAccess.grantId,
    inquiryId: context.demoAccess.inquiryId,
    actorUserId: context.user.id,
    eventType,
    severity: eventType === 'experience_conversion_intent' ? 'notice' : 'info',
    metadata,
  })

  return NextResponse.json({ ok: true })
}
