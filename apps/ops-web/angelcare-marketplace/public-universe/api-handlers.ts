import { apiFailure, apiSuccess, cleanOptionalText, cleanText, parseJsonObject, requestId, requireText } from '../server/request'
import { MarketplaceError } from '../server/errors'
import { createPublicInquiry, recordPublicEvent } from './repository'
import type { PublicInquiryInput } from './types'

const audiences = new Set<PublicInquiryInput['audience']>(['family','school','hotel','clinic','corporate','provider','supplier','academy','partner_os','other'])
const locales = new Set<PublicInquiryInput['locale']>(['fr','en','ar'])

export async function handlePublicInquiry(request: Request) {
  const id = requestId(request)
  try {
    const body = await parseJsonObject(request)
    const audience = cleanText(body.audience || 'other', 30) as PublicInquiryInput['audience']
    const locale = cleanText(body.locale || 'fr', 5) as PublicInquiryInput['locale']
    if (!audiences.has(audience) || !locales.has(locale)) throw new MarketplaceError('VALIDATION_ERROR', 'Audience ou langue invalide.')
    const result = await createPublicInquiry({ audience, sourceRoute: requireText(body.sourceRoute,'sourceRoute','Route source',300), fullName: requireText(body.fullName,'fullName','Nom complet',180), email: cleanOptionalText(body.email,250), phone: cleanOptionalText(body.phone,80), organization: cleanOptionalText(body.organization,240), city: cleanOptionalText(body.city,120), message: requireText(body.message,'message','Votre besoin',4000), consent: body.consent === true, locale, territoryCode: cleanOptionalText(body.territoryCode,50), honeypot: cleanOptionalText(body.website,300) }, request)
    return apiSuccess({ publicReference: result.public_reference, status: result.status }, { requestId: id, status: 201 })
  } catch (error) { return apiFailure(error,id) }
}

export async function handlePublicEvent(request: Request) {
  const id=requestId(request)
  try { const body=await parseJsonObject(request); await recordPublicEvent({eventName:requireText(body.eventName,'eventName','Événement',100),route:requireText(body.route,'route','Route',300),locale:cleanText(body.locale||'fr',5),territoryCode:cleanOptionalText(body.territoryCode,50),data:body.data&&typeof body.data==='object'&&!Array.isArray(body.data)?body.data as Record<string,unknown>:undefined}); return apiSuccess({accepted:true},{requestId:id,status:202}) } catch(error){return apiFailure(error,id)}
}
