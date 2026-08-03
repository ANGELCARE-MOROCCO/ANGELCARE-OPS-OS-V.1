import 'server-only'

import { safeArray, safeJson, safeText } from './server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function transformServiceDesign(input: { command: string; draft: Record<string, unknown>; allowedActivities: Array<Record<string, unknown>> }) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw Object.assign(new Error('OPENROUTER_API_KEY est absente. La transformation n’a pas été simulée.'), { status: 503 })
  const allowedIds = new Set(input.allowedActivities.map((activity) => String(activity.id || activity.activity_id || '')).filter(Boolean))
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://angelcarehub.com', 'X-Title': 'ANGELCARE Service Design OS' },
    body: JSON.stringify({ model: 'openrouter/free', temperature: .2, messages: [
      { role: 'system', content: 'You are the ANGELCARE Service Design transformation assistant. Return JSON only. Preserve dates, exact mission windows, deterministic price fields and every locked block. You may use only activity IDs provided in allowedActivities. Never invent an activity, price, medical claim, approval or CARELINK execution.' },
      { role: 'user', content: JSON.stringify({ command: safeText(input.command, 180), currentDraft: input.draft, allowedActivities: input.allowedActivities }) },
    ], response_format: { type: 'json_schema', json_schema: { name: 'service_design_transformation', strict: true, schema: { type: 'object', additionalProperties: false, required: ['summary','changes','days'], properties: { summary: { type: 'string' }, changes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['type','detail'], properties: { type: { type: 'string' }, detail: { type: 'string' } } } }, days: { type: 'array', items: { type: 'object', additionalProperties: true } } } } } } }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(String(body?.error?.message || 'OpenRouter Free indisponible.')), { status: 502 })
  const content = body?.choices?.[0]?.message?.content
  if (!content) throw Object.assign(new Error('OpenRouter n’a retourné aucun résultat exploitable.'), { status: 502 })
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(content) } catch { throw Object.assign(new Error('OpenRouter a retourné un JSON invalide.'), { status: 502 }) }
  const days = safeArray(parsed.days)
  for (const day of days) for (const rawBlock of safeArray(safeJson(day).blocks || safeJson(day).timeline)) {
    const block = safeJson(rawBlock); const activityId = String(block.sourceActivityId || block.source_activity_id || '')
    if (activityId && !allowedIds.has(activityId)) throw Object.assign(new Error(`Transformation rejetée: activité locale inconnue ${activityId}.`), { status: 422 })
  }
  return { result: parsed, actualModel: String(body?.model || body?.choices?.[0]?.model || 'openrouter/free'), usage: body?.usage || null }
}
