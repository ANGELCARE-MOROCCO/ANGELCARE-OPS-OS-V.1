/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { getMasterDemoConfig } from '@/lib/sanila-demo/authority'
import type { Angelcare360AccessContext } from './context'
import { isTrustedSanilaMasterDemoContext } from './command-center-experience'
import type { SanilaExperienceModuleId } from '@/lib/angelcare360/experience/contract'

export type SanilaDemoExperienceState = {
  visitedModules: SanilaExperienceModuleId[]
  visitedRoutes: string[]
  favorites: SanilaExperienceModuleId[]
  priorities: string[]
  questions: Array<{ id: string; text: string; createdAt: string }>
  currentJourneyId: string | null
  conversionIntent: string | null
  lastRoute: string | null
  lastActivityAt: string | null
  startedAt: string | null
  eventCount: number
}

const EMPTY: SanilaDemoExperienceState = {
  visitedModules: [],
  visitedRoutes: [],
  favorites: [],
  priorities: [],
  questions: [],
  currentJourneyId: null,
  conversionIntent: null,
  lastRoute: null,
  lastActivityAt: null,
  startedAt: null,
  eventCount: 0,
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown) {
  return value === true || value === 'true'
}

export async function getSanilaDemoExperienceState(context: Angelcare360AccessContext): Promise<SanilaDemoExperienceState> {
  if (!isTrustedSanilaMasterDemoContext(context) || !context.demoAccess?.grantId) return EMPTY
  const config = await getMasterDemoConfig().catch(() => null)
  if (!config?.id) return EMPTY
  const db = await createClient()
  const { data, error } = await db
    .from('sanila_demo_access_events')
    .select('id,event_type,metadata,created_at')
    .eq('config_id', config.id)
    .eq('grant_id', context.demoAccess.grantId)
    .in('event_type', [
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
    .order('created_at', { ascending: true })
    .limit(2000)
  if (error || !data) return EMPTY

  const visitedModules = new Set<SanilaExperienceModuleId>()
  const visitedRoutes = new Set<string>()
  const favorites = new Set<SanilaExperienceModuleId>()
  const priorities = new Set<string>()
  const questions: SanilaDemoExperienceState['questions'] = []
  let currentJourneyId: string | null = null
  let conversionIntent: string | null = null
  let lastRoute: string | null = null
  let startedAt: string | null = null
  let lastActivityAt: string | null = null

  for (const row of data as any[]) {
    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {}
    const eventType = text(row.event_type)
    const createdAt = text(row.created_at)
    lastActivityAt = createdAt || lastActivityAt
    if (eventType === 'experience_visit_reset') {
      visitedModules.clear(); visitedRoutes.clear(); favorites.clear(); priorities.clear(); questions.splice(0); currentJourneyId = null; conversionIntent = null; lastRoute = null; startedAt = createdAt || null
      continue
    }
    if (eventType === 'experience_visit_started' && !startedAt) startedAt = createdAt || null
    if (eventType === 'experience_route_visited') {
      const path = text(metadata.path)
      if (path) { visitedRoutes.add(path); lastRoute = path }
    }
    if (eventType === 'experience_module_visited') {
      const moduleId = text(metadata.module_id) as SanilaExperienceModuleId
      if (moduleId) visitedModules.add(moduleId)
      const path = text(metadata.path)
      if (path) { visitedRoutes.add(path); lastRoute = path }
    }
    if (eventType === 'experience_favorite_set') {
      const moduleId = text(metadata.module_id) as SanilaExperienceModuleId
      if (!moduleId) continue
      if (bool(metadata.enabled)) favorites.add(moduleId); else favorites.delete(moduleId)
    }
    if (eventType === 'experience_priority_set') {
      const priority = text(metadata.priority)
      if (!priority) continue
      if (bool(metadata.enabled)) priorities.add(priority); else priorities.delete(priority)
    }
    if (eventType === 'experience_question_added') {
      const question = text(metadata.question)
      if (question) questions.push({ id: text(row.id) || `${createdAt}-${questions.length}`, text: question, createdAt })
    }
    if (eventType === 'experience_journey_selected') currentJourneyId = text(metadata.journey_id) || null
    if (eventType === 'experience_conversion_intent') conversionIntent = text(metadata.intent) || null
  }

  return {
    visitedModules: [...visitedModules],
    visitedRoutes: [...visitedRoutes],
    favorites: [...favorites],
    priorities: [...priorities],
    questions: questions.slice(-40),
    currentJourneyId,
    conversionIntent,
    lastRoute,
    lastActivityAt,
    startedAt,
    eventCount: data.length,
  }
}
