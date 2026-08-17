import { NextResponse } from 'next/server'
import {
  createSanilaCommunicationCampaign,
  dispatchSanilaInternalCampaign,
  enqueueSanilaCampaignFromSegment,
  enqueueSanilaCampaignRecipients,
  openSanilaCommunicationThread,
  postSanilaCommunicationThreadMessage,
  renderSanilaCommunicationTemplate,
  resolveSanilaCommunicationAlert,
  updateSanilaCampaign,
  updateSanilaCommunicationThread,
  updateSanilaNotificationPreference,
  updateSanilaPreferenceGovernance,
  upsertSanilaAudienceMember,
  upsertSanilaAudienceSegment,
  upsertSanilaCommunicationTemplate,
} from '@/lib/angelcare360/server/communication-command'

export const dynamic = 'force-dynamic'

function json(payload: unknown, status = 200) {
  const response = NextResponse.json(payload, { status })
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const action = String(body.action || '')
  const payload = (body.payload && typeof body.payload === 'object' ? body.payload : body) as Record<string, unknown>
  try {
    let result: any
    if (action === 'thread.open') result = await openSanilaCommunicationThread(payload)
    else if (action === 'thread.reply') result = await postSanilaCommunicationThreadMessage(payload)
    else if (action === 'thread.update') result = await updateSanilaCommunicationThread(payload)
    else if (action === 'audience.upsert') result = await upsertSanilaAudienceSegment(payload)
    else if (action === 'audience.member.upsert') result = await upsertSanilaAudienceMember(payload)
    else if (action === 'template.upsert') result = await upsertSanilaCommunicationTemplate(payload)
    else if (action === 'template.render') result = await renderSanilaCommunicationTemplate(payload)
    else if (action === 'campaign.create') result = await createSanilaCommunicationCampaign(payload)
    else if (action === 'campaign.update') result = await updateSanilaCampaign(payload)
    else if (action === 'campaign.enqueue') result = await enqueueSanilaCampaignRecipients(payload)
    else if (action === 'campaign.enqueueSegment') result = await enqueueSanilaCampaignFromSegment(payload)
    else if (action === 'campaign.dispatchInternal') result = await dispatchSanilaInternalCampaign(payload)
    else if (action === 'preference.update') result = await updateSanilaNotificationPreference(payload)
    else if (action === 'preference.governance') result = await updateSanilaPreferenceGovernance(payload)
    else if (action === 'alert.resolve') result = await resolveSanilaCommunicationAlert(payload)
    else return json({ ok: false, error: 'Action Communication Command inconnue.' }, 400)
    return json(result, result?.ok ? 200 : (result?.status || 400))
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Action Communication Command impossible.' }, 500)
  }
}
