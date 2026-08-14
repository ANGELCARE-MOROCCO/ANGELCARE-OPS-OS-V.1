import { requireMarketplaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import {
  addEnterpriseOrderLine,
  createBooking,
  createInvoice,
  enterpriseControlSnapshot,
  getEnterpriseOrder,
  issueReceipt,
  listBookings,
  listCustomerSubscriptions,
  listFamilyGuardians,
  listInvoices,
  listPromotions,
  listReceipts,
  saveCustomerSubscription,
  saveFamilyGuardian,
  savePromotion,
  updateBooking,
  updateEnterpriseOrderLine,
  updateInvoice,
} from './repository'

export async function handleEnterpriseControlSnapshot(request:Request){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await enterpriseControlSnapshot(),{requestId:rid})}catch(error){return apiFailure(error,rid)}}

export async function handleEnterpriseOrder(request:Request,orderId:string){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.operations.view');if(request.method!=='GET')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');const order=await getEnterpriseOrder(orderId);if(!order)throw new MarketplaceError('NOT_FOUND','Commande introuvable.');return apiSuccess(order,{requestId:rid})}catch(error){return apiFailure(error,rid)}}
export async function handleEnterpriseOrderLines(request:Request,orderId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operations.missions.manage');if(request.method!=='POST')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await addEnterpriseOrderLine({orderId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201})}catch(error){return apiFailure(error,rid)}}
export async function handleEnterpriseOrderLine(request:Request,orderId:string,lineId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operations.missions.manage');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await updateEnterpriseOrderLine({orderId,lineId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}

export async function handleInvoices(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.finance.view');if(request.method==='GET')return apiSuccess({invoices:await listInvoices()},{requestId:rid});if(request.method==='POST')return apiSuccess(await createInvoice({body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}
export async function handleInvoice(request:Request,invoiceId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.finance.view');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await updateInvoice({invoiceId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
export async function handleReceipts(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.finance.view');if(request.method==='GET')return apiSuccess({receipts:await listReceipts()},{requestId:rid});if(request.method==='POST')return apiSuccess(await issueReceipt({body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}

export async function handlePromotions(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.merchandising.view');if(request.method==='GET')return apiSuccess({promotions:await listPromotions()},{requestId:rid});if(request.method==='POST')return apiSuccess(await savePromotion({body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}
export async function handlePromotion(request:Request,promotionId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.merchandising.view');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await savePromotion({promotionId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}

export async function handleSubscriptions(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.admin.access');if(request.method==='GET')return apiSuccess({subscriptions:await listCustomerSubscriptions()},{requestId:rid});if(request.method==='POST')return apiSuccess(await saveCustomerSubscription({body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}
export async function handleSubscription(request:Request,subscriptionId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.admin.access');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await saveCustomerSubscription({subscriptionId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}

export async function handleBookings(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operations.view');if(request.method==='GET')return apiSuccess({bookings:await listBookings()},{requestId:rid});if(request.method==='POST')return apiSuccess(await createBooking({body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}
export async function handleBooking(request:Request,bookingId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operations.missions.manage');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await updateBooking({bookingId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}

export async function handleFamilyGuardians(request:Request,familyId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.family.admin.manage');if(request.method==='GET')return apiSuccess({guardians:await listFamilyGuardians(familyId)},{requestId:rid});if(request.method==='POST')return apiSuccess(await saveFamilyGuardian({familyId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid,status:201});throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.')}catch(error){return apiFailure(error,rid)}}
export async function handleFamilyGuardian(request:Request,familyId:string,guardianId:string){const rid=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.family.admin.manage');if(request.method!=='PATCH')throw new MarketplaceError('METHOD_NOT_ALLOWED','Méthode non prise en charge.');return apiSuccess(await saveFamilyGuardian({familyId,guardianId,body:await parseJsonObject(request),context,requestId:rid,request}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
