import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import { getCustomerAccountSummary, listAdminJourneys, listCustomerJourneys } from '../journey-control/repository'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'
import { PAYMENT_METHOD_COPY } from './content'
import { paymentAdapter, paymentProviderReadiness } from './payment-adapters'
import { capturePayPalOrder, showPayPalOrder, showPayPalRefund } from './paypal'
import { evaluateWalletComparison, walletPoliciesForAdmin } from './wallet-policy'
import type {
  CustomerContext, CustomerPortfolio, EnterpriseOrderRecord, EnterpriseOrderSummary, PaymentAttempt, PaymentIntent,
  PaymentMethodKind, PaymentMethodOption, WalletAccount, WalletAdminSummary, WalletBalanceBucket, WalletLedgerEntry,
  WalletMembership, WalletSummary, WalletTopUpQuote, WalletTopUpResult,
} from './types'

type Row = Record<string, unknown>
type DbError = { code?: string; message?: string } | null
const text=(v:unknown)=>typeof v==='string'?v:''
const nullable=(v:unknown)=>text(v)||null
const numberValue=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0
const objectValue=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.filter((x):x is Row=>Boolean(x)&&typeof x==='object'):[]
function fail(operation:string,error:DbError){return new MarketplaceError(error?.code==='42P01'?'CONFIGURATION_ERROR':'INTERNAL_ERROR',error?.code==='42P01'?'La migration Customer Identity, Payments & AC Wallet doit être appliquée.':`Impossible de ${operation}.`,{cause:error||undefined})}

function mapMembership(row:Row|null):WalletMembership|null{if(!row)return null;return{id:text(row.id),tier_key:text(row.tier_key),tier_name:text(row.tier_name)||text(row.tier_key),status:text(row.status),qualified_at:nullable(row.qualified_at),expires_at:nullable(row.expires_at),progress:numberValue(row.progress),next_tier_name:nullable(row.next_tier_name),next_tier_threshold:row.next_tier_threshold==null?null:numberValue(row.next_tier_threshold)}}
function mapBucket(row:Row):WalletBalanceBucket{return{bucket_kind:text(row.bucket_kind) as WalletBalanceBucket['bucket_kind'],available_amount:numberValue(row.available_amount),reserved_amount:numberValue(row.reserved_amount),expires_at:nullable(row.expires_at)}}
function mapWallet(row:Row):WalletAccount{const bucketRows=rows(row.buckets);const membershipRows=rows(row.membership);const purchased=bucketRows.filter((b)=>text(b.bucket_kind)==='purchased').reduce((s,b)=>s+numberValue(b.available_amount),0);const bonus=bucketRows.filter((b)=>['promotional','goodwill','refund','employer','gift'].includes(text(b.bucket_kind))).reduce((s,b)=>s+numberValue(b.available_amount),0);const reserved=bucketRows.reduce((s,b)=>s+numberValue(b.reserved_amount),0);const expiring=bucketRows.filter((b)=>b.expires_at).reduce((s,b)=>s+numberValue(b.available_amount),0);return{id:text(row.id),public_reference:text(row.public_reference),customer_account_id:text(row.customer_account_id),status:text(row.status) as WalletAccount['status'],currency_label:text(row.currency_label)||'Dh',available_balance:numberValue(row.available_balance)||purchased+bonus,purchased_balance:numberValue(row.purchased_balance)||purchased,bonus_balance:numberValue(row.bonus_balance)||bonus,reserved_balance:numberValue(row.reserved_balance)||reserved,expiring_balance:numberValue(row.expiring_balance)||expiring,lifetime_funded:numberValue(row.lifetime_funded),lifetime_spent:numberValue(row.lifetime_spent),lifetime_savings:numberValue(row.lifetime_savings),buckets:bucketRows.map(mapBucket),membership:mapMembership(membershipRows[0]||null),created_at:text(row.created_at),updated_at:text(row.updated_at)}}
function mapLedger(row:Row):WalletLedgerEntry{return{id:text(row.id),public_reference:text(row.public_reference),wallet_account_id:text(row.wallet_account_id),entry_type:text(row.entry_type) as WalletLedgerEntry['entry_type'],bucket_kind:text(row.bucket_kind) as WalletLedgerEntry['bucket_kind'],direction:text(row.direction) as WalletLedgerEntry['direction'],amount:numberValue(row.amount),balance_after:numberValue(row.balance_after),source_type:text(row.source_type),source_id:nullable(row.source_id),order_reference:nullable(row.order_reference),payment_reference:nullable(row.payment_reference),policy_id:nullable(row.policy_id),reason_code:text(row.reason_code),description:text(row.description),effective_at:text(row.effective_at),expires_at:nullable(row.expires_at),created_at:text(row.created_at)}}
function mapIntent(row:Row):PaymentIntent{return{id:text(row.id),public_reference:text(row.public_reference),customer_account_id:nullable(row.customer_account_id),conversion_session_id:nullable(row.conversion_session_id),canonical_object_type:nullable(row.canonical_object_type),canonical_object_id:nullable(row.canonical_object_id),status:text(row.status) as PaymentIntent['status'],currency_label:text(row.currency_label)||'Dh',expected_amount:numberValue(row.expected_amount),authorized_amount:numberValue(row.authorized_amount),captured_amount:numberValue(row.captured_amount),refunded_amount:numberValue(row.refunded_amount),due_now_amount:numberValue(row.due_now_amount),due_later_amount:numberValue(row.due_later_amount),wallet_contribution:numberValue(row.wallet_contribution),external_contribution:numberValue(row.external_contribution),metadata:objectValue(row.metadata),idempotency_key:text(row.idempotency_key),selected_method:nullable(row.selected_method) as PaymentIntent['selected_method'],provider_key:nullable(row.provider_key),provider_reference:nullable(row.provider_reference),wallet_reservation_id:nullable(row.wallet_reservation_id),expires_at:nullable(row.expires_at),created_at:text(row.created_at),updated_at:text(row.updated_at)}}
function mapAttempt(row:Row):PaymentAttempt{return{id:text(row.id),payment_intent_id:text(row.payment_intent_id),attempt_number:numberValue(row.attempt_number),method_kind:text(row.method_kind) as PaymentMethodKind,status:text(row.status),amount:numberValue(row.amount),provider_key:nullable(row.provider_key),provider_reference:nullable(row.provider_reference),failure_code:nullable(row.failure_code),customer_message:nullable(row.customer_message),created_at:text(row.created_at)}}


function providerEvidence(row:Row):Record<string,unknown>{return objectValue(objectValue(row.metadata).provider_evidence)}
function paypalEvidence(row:Row):Record<string,unknown>{return objectValue(providerEvidence(row).paypal)}
function mergeProviderEvidence(row:Row,evidence:Record<string,unknown>):Record<string,unknown>{return{...objectValue(row.metadata),provider_evidence:{...providerEvidence(row),...evidence}}}
function amountEqual(left:number,right:number,tolerance=0.02){return Math.abs(left-right)<=tolerance}

async function releaseWalletReservation(row:Row,reason:string):Promise<void>{
 const reservation=nullable(row.wallet_reservation_id);if(!reservation)return
 const db=await createServiceClient();const{error}=await db.rpc('angelcare_marketplace_wallet_release',{p_reservation_id:reservation,p_reason:reason})
 if(error)throw fail('libérer la réservation Wallet',error)
}

async function commitWalletReservation(row:Row,paymentReference:string):Promise<void>{
 const reservation=nullable(row.wallet_reservation_id);if(!reservation)return
 const db=await createServiceClient();const{error}=await db.rpc('angelcare_marketplace_wallet_commit_reservation',{p_reservation_id:reservation,p_order_reference:text(row.public_reference),p_payment_reference:paymentReference})
 if(error)throw fail('capturer la réservation Wallet',error)
}

async function paymentResume(row:Row):Promise<{locale:string;sessionKey:string|null;basketId:string|null}>{
 const fallbackLocale='fr';const sessionId=nullable(row.conversion_session_id);if(!sessionId)return{locale:fallbackLocale,sessionKey:null,basketId:null}
 const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_conversion_sessions').select('session_key,quote_basket_id,locale').eq('id',sessionId).maybeSingle()
 if(error)throw fail('charger la reprise checkout',error)
 return{locale:text(data?.locale)||fallbackLocale,sessionKey:data?.session_key?String(data.session_key):null,basketId:data?.quote_basket_id?String(data.quote_basket_id):null}
}

function validatePayPalProviderAmount(row:Row,providerAmount:string|null,currency:string|null):void{
 const meta=paypalEvidence(row);const expectedAmount=text(meta.providerAmount);const expectedCurrency=text(meta.currency)
 if(!expectedAmount||!expectedCurrency)throw new MarketplaceError('CONFIGURATION_ERROR','La preuve de conversion PayPal verrouillée est absente de cette intention.')
 if(!providerAmount||!currency)throw new MarketplaceError('DEPENDENCY_BLOCKED','PayPal n’a pas retourné le montant et la devise de capture.')
 if(currency.toUpperCase()!==expectedCurrency.toUpperCase()||!amountEqual(Number(providerAmount),Number(expectedAmount),0.01))throw new MarketplaceError('CONFLICT','Le montant capturé par PayPal ne correspond pas à la preuve financière verrouillée.')
}

async function finalizePayPalCapture(row:Row,capture:{orderId:string;captureId:string|null;captureStatus:string;providerAmount:string|null;currency:string|null;raw:Record<string,unknown>},evidenceId:string):Promise<Row>{
 const db=await createServiceClient();const currentStatus=text(row.status)
 if(['captured','reconciled','partially_refunded','refunded'].includes(currentStatus))return row
 const captureStatus=String(capture.captureStatus||'').toUpperCase()
 if(captureStatus==='PENDING'){
  const metadata=mergeProviderEvidence(row,{paypal:{...paypalEvidence(row),captureId:capture.captureId,captureStatus,updatedAt:new Date().toISOString()}})
  const{data,error}=await db.from('angelcare_marketplace_payment_intents').update({status:'pending',metadata,updated_at:new Date().toISOString()}).eq('id',row.id).select('*').single();if(error||!data)throw fail('mettre le paiement PayPal en attente',error);return data as Row
 }
 if(captureStatus!=='COMPLETED')throw new MarketplaceError('DEPENDENCY_BLOCKED',`La capture PayPal est dans l’état ${captureStatus||'inconnu'}.`)
 validatePayPalProviderAmount(row,capture.providerAmount,capture.currency)
 if(!capture.captureId)throw new MarketplaceError('DEPENDENCY_BLOCKED','PayPal n’a pas retourné la référence de capture.')
 try{await commitWalletReservation(row,capture.captureId)}catch(error){await db.from('angelcare_marketplace_payment_intents').update({status:'reconciliation_pending',updated_at:new Date().toISOString()}).eq('id',row.id);throw error}
 const metadata=mergeProviderEvidence(row,{paypal:{...paypalEvidence(row),orderId:capture.orderId,captureId:capture.captureId,captureStatus,providerAmount:capture.providerAmount,currency:capture.currency,capturedAt:new Date().toISOString(),captureEvidenceId:evidenceId}})
 const{data,error}=await db.from('angelcare_marketplace_payment_intents').update({status:'captured',authorized_amount:numberValue(row.expected_amount),captured_amount:numberValue(row.expected_amount),provider_key:'paypal',provider_reference:capture.orderId,metadata,updated_at:new Date().toISOString()}).eq('id',row.id).select('*').single();if(error||!data)throw fail('finaliser la capture PayPal',error)
 await db.from('angelcare_marketplace_payment_attempts').update({status:'captured',provider_reference:capture.orderId,provider_evidence:metadata.provider_evidence,updated_at:new Date().toISOString()}).eq('payment_intent_id',row.id).eq('provider_key','paypal')
 if(text(row.canonical_object_type)==='wallet_topup')await captureWalletTopUp({paymentIntentId:String(row.id),providerEventId:evidenceId})
 return data as Row
}

async function markPayPalFailure(row:Row,status:'failed'|'cancelled'|'reversed'|'reconciliation_pending',reason:string):Promise<Row>{
 const db=await createServiceClient();if(!['captured','partially_refunded','refunded','reversed','reconciliation_pending'].includes(text(row.status)))await releaseWalletReservation(row,reason)
 const{data,error}=await db.from('angelcare_marketplace_payment_intents').update({status,updated_at:new Date().toISOString()}).eq('id',row.id).select('*').single();if(error||!data)throw fail('mettre à jour l’échec PayPal',error)
 await db.from('angelcare_marketplace_payment_attempts').update({status,customer_message:reason,updated_at:new Date().toISOString()}).eq('payment_intent_id',row.id).eq('provider_key','paypal')
 return data as Row
}

async function walletRow(customerAccountId:string):Promise<Row|null>{const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_accounts').select('*,buckets:angelcare_marketplace_wallet_balance_buckets(*),membership:angelcare_marketplace_wallet_memberships(*,tier:angelcare_marketplace_wallet_tiers(*))').eq('customer_account_id',customerAccountId).maybeSingle();if(error)throw fail('charger AC Wallet',error);if(!data)return null;const row=data as Row;const m=rows(row.membership)[0];if(m){const tier=objectValue(m.tier);m.tier_name=text(tier.name_fr)||text(tier.tier_key);m.next_tier_name=null}return row}
export async function getOrCreateWallet(context:CustomerContext):Promise<WalletAccount>{let row=await walletRow(context.account.id);if(!row){const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_accounts').insert({customer_account_id:context.account.id,status:'active',currency_label:'Dh'}).select('*').single();if(error||!data)throw fail('activer AC Wallet',error);await db.from('angelcare_marketplace_wallet_balance_buckets').insert({wallet_account_id:data.id,bucket_kind:'purchased',available_amount:0,reserved_amount:0});row=await walletRow(context.account.id)}if(!row)throw new MarketplaceError('INTERNAL_ERROR','AC Wallet n’a pas pu être initialisé.');return mapWallet(row)}
export async function getWalletSummary(context:CustomerContext):Promise<WalletSummary>{const wallet=await getOrCreateWallet(context);const db=await createServiceClient();const[{data:entries,error},{data:expiring}]=await Promise.all([db.from('angelcare_marketplace_wallet_ledger_entries').select('*').eq('wallet_account_id',wallet.id).order('effective_at',{ascending:false}).limit(30),db.from('angelcare_marketplace_wallet_balance_buckets').select('bucket_kind,available_amount,expires_at').eq('wallet_account_id',wallet.id).gt('available_amount',0).not('expires_at','is',null).order('expires_at')]);if(error)throw fail('charger le relevé Wallet',error);const policies=await walletPoliciesForAdmin();return{account:wallet,recentEntries:(entries||[]).map((r)=>mapLedger(r as Row)),activePolicies:policies.filter((p)=>p.status==='active').slice(0,12),expiring:(expiring||[]).map((r)=>({amount:numberValue(r.available_amount),expiresAt:text(r.expires_at),bucketKind:text(r.bucket_kind) as WalletBalanceBucket['bucket_kind']})),recommendations:[{title:'Comparez avant de payer',message:'Les économies Wallet sont calculées en direct selon votre panier et vos politiques actives.',href:`/angelcare-marketplace/${context.locale}/marketplace`},{title:'Protégez votre compte',message:'Vérifiez vos sessions et vos moyens de paiement.',href:`/angelcare-marketplace/${context.locale}/account/wallet/security`} ]}}
export async function walletEntries(context:CustomerContext,limit=200):Promise<WalletLedgerEntry[]>{const wallet=await getOrCreateWallet(context);const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_ledger_entries').select('*').eq('wallet_account_id',wallet.id).order('effective_at',{ascending:false}).limit(Math.min(500,limit));if(error)throw fail('charger les transactions',error);return(data||[]).map((r)=>mapLedger(r as Row))}

export async function eligiblePaymentMethods(input:{context:CustomerContext|null;amount:number;offerType?:string|null;territoryId?:string|null;quoteOnly?:boolean;allowCash?:boolean;allowInvoice?:boolean}):Promise<PaymentMethodOption[]>{const locale=input.context?.locale||'fr';const wallet=input.context?await getOrCreateWallet(input.context):null;const readiness=paymentProviderReadiness();const activeCardProvider=readiness.find((x)=>x.methods.includes('card'));const configuredCard=activeCardProvider?.configured===true;const methods:PaymentMethodKind[]=['ac_wallet','card','bank_transfer','cash_on_delivery','pay_at_location','invoice','deposit','installment','corporate_allowance','voucher'];return methods.map((kind)=>{let eligible=true;let reason:string|null=null;let external=true;if(kind==='ac_wallet'){external=false;eligible=Boolean(wallet&&wallet.status==='active'&&wallet.available_balance>0);if(!input.context)reason='Activez votre compte et AC Wallet.';else if(!wallet?.available_balance)reason='Solde Wallet insuffisant.'}if(['card','deposit','installment'].includes(kind)&&!configuredCard){eligible=false;reason='Prestataire de paiement externe non activé.'}if(kind==='cash_on_delivery'&&!input.allowCash){eligible=false;reason='Non autorisé pour cette offre.'}if(kind==='invoice'&&!input.allowInvoice){eligible=false;reason='Réservé aux comptes contractuels éligibles.'}if(input.quoteOnly&&['card','cash_on_delivery','pay_at_location'].includes(kind)){eligible=false;reason='Une proposition doit être établie avant paiement.'}const baseCopy=PAYMENT_METHOD_COPY[kind][locale];const copy=kind==='card'&&activeCardProvider?.key==='paypal'?{label:locale==='fr'?'PayPal / carte':locale==='en'?'PayPal / card':'PayPal / بطاقة',description:locale==='fr'?'Paiement sécurisé via PayPal.':locale==='en'?'Secure payment through PayPal.':'دفع آمن عبر PayPal.'}:baseCopy;return{kind,label:copy.label,description:copy.description,eligible,reason,requiresExternalProvider:external,supportsSplit:['ac_wallet','card','bank_transfer','corporate_allowance','voucher'].includes(kind),supportsRefund:!['cash_on_delivery'].includes(kind),dueNow:input.amount,currencyLabel:'Dh',metadata:{configured:kind==='card'?configuredCard:true,offerType:input.offerType}}})}

export async function walletComparisonForCustomer(input:{context:CustomerContext|null;normalPrice:number;itemId?:string|null;categoryKey?:string|null;schemaKey?:string|null;territoryId?:string|null} ){const wallet=input.context?await getOrCreateWallet(input.context):null;return evaluateWalletComparison({...input,wallet,customer:input.context?.account||null,walletPaymentRequested:true})}

export async function quoteWalletTopUp(input:{context:CustomerContext;amount:number}):Promise<WalletTopUpQuote>{const wallet=await getOrCreateWallet(input.context);const comparison=await evaluateWalletComparison({normalPrice:input.amount,wallet,customer:input.context.account,walletPaymentRequested:false,schemaKey:'wallet-topup'});const bonus=comparison.policies.filter((p)=>p.accepted).reduce((sum,p)=>sum+numberValue(p.evidence.bonusCredits),0);const methods=await eligiblePaymentMethods({context:input.context,amount:input.amount});return{requestedAmount:input.amount,purchasedCredits:input.amount,bonusCredits:bonus,totalCredits:input.amount+bonus,availableMethods:methods.filter((m)=>m.kind!=='ac_wallet'),policyEvaluations:comparison.policies,currencyLabel:'Dh'}}

export async function createPaymentIntent(input:{context:CustomerContext|null;amount:number;method:PaymentMethodKind;idempotencyKey:string;conversionSessionId?:string|null;canonicalObjectType?:string|null;canonicalObjectId?:string|null;walletContribution?:number;returnUrl:string;cancelUrl:string;metadata?:Record<string,unknown>}):Promise<{intent:PaymentIntent;attempt:PaymentAttempt|null;customerActionUrl:string|null;message:string}>{
 const db=await createServiceClient();const customerId=input.context?.account.id||null
 const existing=await db.from('angelcare_marketplace_payment_intents').select('*').eq('idempotency_key',input.idempotencyKey).maybeSingle();if(existing.error)throw fail('rechercher le paiement',existing.error)
 let intentRow=existing.data as Row|null
 if(!intentRow){
  const walletContribution=Math.min(input.amount,Math.max(0,input.walletContribution||0));const externalContribution=Math.max(0,input.amount-walletContribution)
  const{data,error}=await db.from('angelcare_marketplace_payment_intents').insert({customer_account_id:customerId,conversion_session_id:input.conversionSessionId||null,canonical_object_type:input.canonicalObjectType||null,canonical_object_id:input.canonicalObjectId||null,status:'requires_method',currency_label:'Dh',expected_amount:input.amount,due_now_amount:input.amount,due_later_amount:0,wallet_contribution:walletContribution,external_contribution:externalContribution,idempotency_key:input.idempotencyKey,selected_method:input.method,metadata:input.metadata||{},expires_at:new Date(Date.now()+30*60*1000).toISOString()}).select('*').single();if(error||!data)throw fail('créer l’intention de paiement',error);intentRow=data as Row
  if(walletContribution>0&&input.context){const wallet=await getOrCreateWallet(input.context);const{data:reservation,error:reservationError}=await db.rpc('angelcare_marketplace_wallet_reserve',{p_wallet_account_id:wallet.id,p_amount:walletContribution,p_source_type:'payment_intent',p_source_id:data.id,p_idempotency_key:`reserve:${input.idempotencyKey}`});if(reservationError)throw fail('réserver les crédits Wallet',reservationError);const{data:updated,error:updateError}=await db.from('angelcare_marketplace_payment_intents').update({wallet_reservation_id:typeof reservation==='string'?reservation:null}).eq('id',data.id).select('*').single();if(updateError||!updated)throw fail('lier la réservation Wallet au paiement',updateError);intentRow=updated as Row}
 }
 const intent=mapIntent(intentRow)
 if(input.method==='ac_wallet'){
  if(!input.context)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Connexion requise pour AC Wallet.')
  const wallet=await getOrCreateWallet(input.context);if(wallet.available_balance+intent.wallet_contribution<input.amount)throw new MarketplaceError('DEPENDENCY_BLOCKED','Solde AC Wallet insuffisant.')
  let reservation=intent.wallet_reservation_id
  if(!reservation){const reserved=await db.rpc('angelcare_marketplace_wallet_reserve',{p_wallet_account_id:wallet.id,p_amount:input.amount,p_source_type:'payment_intent',p_source_id:intent.id,p_idempotency_key:`reserve:${input.idempotencyKey}`});if(reserved.error)throw fail('réserver le Wallet',reserved.error);reservation=typeof reserved.data==='string'?reserved.data:null}
  const{data:updated,error}=await db.from('angelcare_marketplace_payment_intents').update({status:'authorized',authorized_amount:input.amount,wallet_contribution:input.amount,external_contribution:0,wallet_reservation_id:reservation,provider_key:'ac_wallet',provider_reference:wallet.public_reference,updated_at:new Date().toISOString()}).eq('id',intent.id).select('*').single();if(error||!updated)throw fail('autoriser le Wallet',error)
  return{intent:mapIntent(updated as Row),attempt:null,customerActionUrl:null,message:'Crédits AC Wallet réservés. La capture intervient avec la confirmation canonique.'}
 }
 if(intent.external_contribution<=0)throw new MarketplaceError('VALIDATION_ERROR','Aucune contribution externe n’est due. Utilisez AC Wallet pour finaliser ce paiement.')
 const adapter=paymentAdapter(input.method);const attemptNumber=numberValue((await db.from('angelcare_marketplace_payment_attempts').select('id',{count:'exact',head:true}).eq('payment_intent_id',intent.id)).count)+1
 const{data:attemptRow,error:attemptError}=await db.from('angelcare_marketplace_payment_attempts').insert({payment_intent_id:intent.id,attempt_number:attemptNumber,method_kind:input.method,status:'created',amount:intent.external_contribution,idempotency_key:`${input.idempotencyKey}:${attemptNumber}`}).select('*').single();if(attemptError||!attemptRow)throw fail('créer la tentative de paiement',attemptError)
 try{
  const result=await adapter.create({intent,method:input.method,returnUrl:input.returnUrl,cancelUrl:input.cancelUrl,customer:input.context?.account||null,metadata:input.metadata||{}})
  const metadata=mergeProviderEvidence(intentRow,result.evidence)
  await db.from('angelcare_marketplace_payment_attempts').update({status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,customer_message:result.customerMessage,provider_evidence:result.evidence,updated_at:new Date().toISOString()}).eq('id',attemptRow.id)
  const{data:updated,error:updateError}=await db.from('angelcare_marketplace_payment_intents').update({status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,selected_method:input.method,metadata,updated_at:new Date().toISOString()}).eq('id',intent.id).select('*').single();if(updateError||!updated)throw fail('lier le prestataire de paiement',updateError)
  return{intent:mapIntent(updated as Row),attempt:mapAttempt({...attemptRow,status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,customer_message:result.customerMessage}),customerActionUrl:result.customerActionUrl,message:result.customerMessage}
 }catch(error){
  await db.from('angelcare_marketplace_payment_attempts').update({status:'failed',failure_code:error instanceof MarketplaceError?error.code:'provider_error',customer_message:error instanceof Error?error.message:'Paiement impossible.',updated_at:new Date().toISOString()}).eq('id',attemptRow.id)
  if(intent.wallet_reservation_id)await releaseWalletReservation(intentRow,'provider_create_failed').catch(()=>undefined)
  await db.from('angelcare_marketplace_payment_intents').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',intent.id)
  throw error
 }
}

export async function createWalletTopUp(input:{context:CustomerContext;amount:number;method:PaymentMethodKind;idempotencyKey:string;returnUrl:string;cancelUrl:string}):Promise<WalletTopUpResult>{if(input.method==='ac_wallet')throw new MarketplaceError('VALIDATION_ERROR','AC Wallet ne peut pas se recharger lui-même.');const wallet=await getOrCreateWallet(input.context);const quote=await quoteWalletTopUp({context:input.context,amount:input.amount});const payment=await createPaymentIntent({context:input.context,amount:input.amount,method:input.method,idempotencyKey:`topup:${input.idempotencyKey}`,canonicalObjectType:'wallet_topup',canonicalObjectId:wallet.id,returnUrl:input.returnUrl,cancelUrl:input.cancelUrl,metadata:{walletAccountId:wallet.id,purchasedCredits:quote.purchasedCredits,bonusCredits:quote.bonusCredits}});const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_topups').insert({wallet_account_id:wallet.id,customer_account_id:input.context.account.id,payment_intent_id:payment.intent.id,status:payment.intent.status==='captured'?'completed':'payment_pending',requested_amount:input.amount,purchased_credits:quote.purchasedCredits,bonus_credits:quote.bonusCredits,total_credits:quote.totalCredits,currency_label:'Dh',idempotency_key:input.idempotencyKey}).select('*').single();if(error||!data)throw fail('créer la recharge Wallet',error);return{topupId:String(data.id),publicReference:String(data.public_reference),paymentIntent:payment.intent,walletAccount:wallet,status:String(data.status)}}

export async function captureWalletTopUp(input:{paymentIntentId:string;providerEventId:string}):Promise<void>{const db=await createServiceClient();const{data:topup,error}=await db.from('angelcare_marketplace_wallet_topups').select('*').eq('payment_intent_id',input.paymentIntentId).maybeSingle();if(error||!topup)throw fail('charger la recharge',error);if(topup.status==='completed')return;const{error:entryError}=await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:topup.wallet_account_id,p_entry_type:'top_up',p_bucket_kind:'purchased',p_direction:'credit',p_amount:topup.purchased_credits,p_source_type:'wallet_topup',p_source_id:topup.id,p_reason_code:'verified_topup',p_description:'Recharge AC Wallet vérifiée',p_idempotency_key:`topup-credit:${input.providerEventId}`,p_expires_at:null});if(entryError)throw fail('créditer la recharge',entryError);if(numberValue(topup.bonus_credits)>0){const{error:bonusError}=await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:topup.wallet_account_id,p_entry_type:'top_up_bonus',p_bucket_kind:'promotional',p_direction:'credit',p_amount:topup.bonus_credits,p_source_type:'wallet_topup',p_source_id:topup.id,p_reason_code:'topup_bonus',p_description:'Bonus de recharge AC Wallet',p_idempotency_key:`topup-bonus:${input.providerEventId}`,p_expires_at:topup.bonus_expires_at||null});if(bonusError)throw fail('créditer le bonus',bonusError)}await db.from('angelcare_marketplace_wallet_topups').update({status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',topup.id);await db.from('angelcare_marketplace_payment_intents').update({status:'captured',captured_amount:topup.requested_amount,updated_at:new Date().toISOString()}).eq('id',input.paymentIntentId)}

export async function getCustomerPortfolio(context:CustomerContext,filter:CustomerPortfolio['filter'],locale:CatalogLocale):Promise<CustomerPortfolio>{const journeys=await listCustomerJourneys(context.marketplace);const mapping:Record<string,string[]>= {product_order:['product_order','kit_order'],family_booking:['family_booking','recurring_service'],academy_enrollment:['academy_enrollment'],b2b_quotation:['b2b_quotation','hospitality_programme','corporate_benefit'],partner_activation:['partner_activation'],quality_assessment:['quality_assessment']};const filtered=filter==='all'?journeys:journeys.filter((j)=>mapping[filter]?.includes(j.journey_type));const wallet=await getOrCreateWallet(context).catch(()=>null);const db=await createServiceClient();const{data:payments}=await db.from('angelcare_marketplace_payment_intents').select('*').eq('customer_account_id',context.account.id).in('status',['requires_method','requires_customer_action','pending','failed','reconciliation_pending']).order('updated_at',{ascending:false});const counts=journeys.reduce<Record<string,number>>((result,j)=>({...result,[j.journey_type]:(result[j.journey_type]||0)+1}),{});return{locale,account:context.account,wallet,journeys,filteredJourneys:filtered,filter,counts,pendingPayments:(payments||[]).map((r)=>mapIntent(r as Row))}}

export async function walletAdminSummary(context:MarketplaceRequestContext):Promise<WalletAdminSummary>{const db=await createServiceClient();let query=db.from('angelcare_marketplace_wallet_accounts').select('*,buckets:angelcare_marketplace_wallet_balance_buckets(*),membership:angelcare_marketplace_wallet_memberships(*)').order('updated_at',{ascending:false}).limit(200);const{data,error}=await query;if(error)throw fail('charger Wallet Command',error);const wallets=(data||[]).map((r)=>mapWallet(r as Row));const{count:exceptions}=await db.from('angelcare_marketplace_wallet_reconciliation_items').select('id',{count:'exact',head:true}).not('status','eq','reconciled');return{walletCount:wallets.length,activeWallets:wallets.filter((w)=>w.status==='active').length,frozenWallets:wallets.filter((w)=>w.status==='frozen').length,availableLiability:wallets.reduce((s,w)=>s+w.available_balance,0),purchasedLiability:wallets.reduce((s,w)=>s+w.purchased_balance,0),promotionalExposure:wallets.reduce((s,w)=>s+w.bonus_balance,0),reservedCredits:wallets.reduce((s,w)=>s+w.reserved_balance,0),expiringCredits:wallets.reduce((s,w)=>s+w.expiring_balance,0),fundedVolume:wallets.reduce((s,w)=>s+w.lifetime_funded,0),spentVolume:wallets.reduce((s,w)=>s+w.lifetime_spent,0),issuedSavings:wallets.reduce((s,w)=>s+w.lifetime_savings,0),reconciliationExceptions:exceptions||0,recentAccounts:wallets.slice(0,20)}}

export async function enterpriseOrderSummary(context:MarketplaceRequestContext):Promise<EnterpriseOrderSummary>{const journeys=await listAdminJourneys(context);const db=await createServiceClient();const ids=journeys.map((j)=>j.id);const{data:payments}=ids.length?await db.from('angelcare_marketplace_payment_intents').select('*').in('canonical_object_id',ids):{data:[]};const paymentRows=(payments||[]) as Row[];const records:EnterpriseOrderRecord[]=journeys.map((j)=>{const payment=paymentRows.find((p)=>text(p.canonical_object_id)===j.id);const finance=j.financial_status||{};const fulfill=j.fulfillment_status||{};return{id:j.id,publicReference:j.public_reference,journeyType:j.journey_type,status:j.status,title:j.title,customerName:text(j.customer_context.customer_name)||text(j.customer_context.fullName)||'Client ANGELCARE',customerReference:nullable(j.customer_context.customer_reference),paymentStatus:payment?text(payment.status):text(finance.status)||'not_required',paymentAmount:payment?numberValue(payment.expected_amount):numberValue(finance.amount),walletContribution:payment?numberValue(payment.wallet_contribution):numberValue(finance.wallet_contribution),externalContribution:payment?Math.max(0,numberValue(payment.expected_amount)-numberValue(payment.wallet_contribution)):numberValue(finance.external_contribution),fulfillmentStatus:text(fulfill.status)||j.current_authority,riskLevel:j.risk_level,nextAction:j.next_action_label,updatedAt:j.updated_at,creationSource:text(j.creation_source)||text(j.metadata.source)||'customer_checkout',customerAccountId:nullable(j.customer_account_id),journey:j}});return{total:records.length,requiringAction:records.filter((r)=>r.nextAction).length,paymentExceptions:records.filter((r)=>['failed','disputed','chargeback','reconciliation_pending'].includes(r.paymentStatus)).length,fulfillmentExceptions:records.filter((r)=>['blocked','recovery'].includes(r.status)).length,walletExceptions:records.filter((r)=>r.walletContribution>0&&['failed','reconciliation_pending'].includes(r.paymentStatus)).length,refundsPending:records.filter((r)=>['partially_refunded','refunded'].includes(r.paymentStatus)).length,records}}

export async function capturePayPalBrowserReturn(input:{orderId:string;paymentIntentId?:string|null}):Promise<{intent:PaymentIntent;locale:string;sessionKey:string|null;basketId:string|null}>{
 const db=await createServiceClient();let query=db.from('angelcare_marketplace_payment_intents').select('*').eq('provider_key','paypal').eq('provider_reference',input.orderId);if(input.paymentIntentId)query=query.eq('id',input.paymentIntentId)
 const{data,error}=await query.maybeSingle();if(error)throw fail('charger le paiement PayPal',error);if(!data)throw new MarketplaceError('NOT_FOUND','Intention PayPal introuvable.')
 const row=data as Row;const order=await showPayPalOrder(input.orderId);const unit=Array.isArray(order.purchase_units)?order.purchase_units[0]:undefined;if(unit?.custom_id&&String(unit.custom_id)!==String(row.id))throw new MarketplaceError('CONFLICT','La commande PayPal ne correspond pas à l’intention ANGELCARE.')
 const capture=await capturePayPalOrder(input.orderId,`return-${row.id}`);if(capture.paymentIntentIdHint&&capture.paymentIntentIdHint!==String(row.id))throw new MarketplaceError('CONFLICT','La capture PayPal ne correspond pas à l’intention ANGELCARE.')
 const finalized=await finalizePayPalCapture(row,capture,`return:${input.orderId}`);const resume=await paymentResume(finalized)
 return{intent:mapIntent(finalized),...resume}
}

export async function cancelPayPalBrowserReturn(input:{orderId?:string|null;paymentIntentId?:string|null}):Promise<{intent:PaymentIntent;locale:string;sessionKey:string|null;basketId:string|null}>{
 if(!input.orderId&&!input.paymentIntentId)throw new MarketplaceError('VALIDATION_ERROR','Référence PayPal absente.')
 const db=await createServiceClient();let query=db.from('angelcare_marketplace_payment_intents').select('*').eq('provider_key','paypal');query=input.paymentIntentId?query.eq('id',input.paymentIntentId):query.eq('provider_reference',String(input.orderId))
 const{data,error}=await query.maybeSingle();if(error)throw fail('charger l’annulation PayPal',error);if(!data)throw new MarketplaceError('NOT_FOUND','Intention PayPal introuvable.')
 const row=await markPayPalFailure(data as Row,'cancelled','paypal_customer_cancelled');const resume=await paymentResume(row);return{intent:mapIntent(row),...resume}
}

export async function processPaymentProviderWebhook(input:{providerKey:string;request:Request}):Promise<{accepted:boolean;eventId:string;intentId:string|null;status:string}>{
 const adapter=paymentAdapter('card');if(adapter.key!==input.providerKey)throw new MarketplaceError('CONFIGURATION_ERROR',`Le webhook ${input.providerKey} ne correspond pas au prestataire actif ${adapter.key}.`);if(!adapter.verifyWebhook)throw new MarketplaceError('CONFIGURATION_ERROR',`Le prestataire ${input.providerKey} ne fournit pas encore de vérificateur webhook.`)
 const verified=await adapter.verifyWebhook(input.request);const db=await createServiceClient();const replayKey=`${input.providerKey}:${verified.eventId}`
 const existing=await db.from('angelcare_marketplace_payment_provider_events').select('id,status,payment_intent_id').eq('replay_key',replayKey).maybeSingle();if(existing.error)throw fail('vérifier le rejeu webhook',existing.error);if(existing.data)return{accepted:true,eventId:String(existing.data.id),intentId:nullable(existing.data.payment_intent_id),status:String(existing.data.status)}
 let intent:Row|null=null
 if(verified.paymentIntentIdHint){const found=await db.from('angelcare_marketplace_payment_intents').select('*').eq('id',verified.paymentIntentIdHint).maybeSingle();if(found.error)throw fail('résoudre le paiement webhook',found.error);intent=found.data as Row|null}
 if(!intent&&verified.providerReference){const found=await db.from('angelcare_marketplace_payment_intents').select('*').eq('provider_key',input.providerKey).eq('provider_reference',verified.providerReference).maybeSingle();if(found.error)throw fail('résoudre le paiement webhook',found.error);intent=found.data as Row|null}
 const{data:event,error}=await db.from('angelcare_marketplace_payment_provider_events').insert({provider_key:input.providerKey,provider_event_id:verified.eventId,event_type:verified.eventType,signature_valid:true,replay_key:replayKey,status:'processing',payment_intent_id:intent?.id||null,payload:verified.payload}).select('*').single();if(error||!event)throw fail('enregistrer le webhook',error)
 let status='processed'
 try{
  if(intent&&input.providerKey==='paypal'){
   const eventType=verified.eventType.toUpperCase()
   if(eventType==='CHECKOUT.ORDER.APPROVED'){
    const orderId=verified.providerReference||text(intent.provider_reference);if(!orderId)throw new MarketplaceError('DEPENDENCY_BLOCKED','Webhook PayPal approuvé sans référence de commande.')
    const capture=await capturePayPalOrder(orderId,`webhook-${verified.eventId}`);intent=await finalizePayPalCapture(intent,capture,verified.eventId)
   }else if(eventType==='PAYMENT.CAPTURE.COMPLETED'){
    const orderId=verified.providerReference||text(intent.provider_reference);const capture={orderId,captureId:verified.captureReference||null,captureStatus:'COMPLETED',providerAmount:verified.providerAmount||null,currency:verified.currency||null,raw:verified.payload};intent=await finalizePayPalCapture(intent,capture,verified.eventId)
   }else if(eventType==='PAYMENT.CAPTURE.PENDING'){
    const metadata=mergeProviderEvidence(intent,{paypal:{...paypalEvidence(intent),captureId:verified.captureReference||null,captureStatus:'PENDING',updatedAt:new Date().toISOString()}});const updated=await db.from('angelcare_marketplace_payment_intents').update({status:'pending',metadata,updated_at:new Date().toISOString()}).eq('id',intent.id).select('*').single();if(updated.error||!updated.data)throw fail('mettre le paiement PayPal en attente',updated.error);intent=updated.data as Row
   }else if(['PAYMENT.CAPTURE.DECLINED','PAYMENT.CAPTURE.DENIED','CHECKOUT.PAYMENT-APPROVAL.REVERSED'].includes(eventType)){
    intent=await markPayPalFailure(intent,'failed',eventType.toLowerCase())
   }else if(eventType==='PAYMENT.CAPTURE.REVERSED'){
    intent=await markPayPalFailure(intent,'reconciliation_pending','paypal_capture_reversed');await db.from('angelcare_marketplace_payment_reconciliation_items').insert({payment_intent_id:intent.id,provider_key:'paypal',provider_reference:verified.captureReference||text(intent.provider_reference),expected_amount:numberValue(intent.expected_amount),provider_amount:0,status:'open',evidence:{eventId:verified.eventId,eventType,payload:verified.payload}})
   }else if(eventType==='PAYMENT.CAPTURE.REFUNDED'){
    const pendingRefunds=await db.from('angelcare_marketplace_payment_refunds').select('*').eq('payment_intent_id',intent.id).in('status',['pending','processing']).not('provider_reference','is',null);if(pendingRefunds.error)throw fail('charger les remboursements PayPal en attente',pendingRefunds.error)
    for(const refundRow of pendingRefunds.data||[]){
     const refundId=text(refundRow.provider_reference);if(!refundId)continue
     const providerRefund=await showPayPalRefund(refundId)
     if(providerRefund.status.toUpperCase()==='COMPLETED'){const completed=await db.from('angelcare_marketplace_payment_refunds').update({status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString(),policy_evidence:{...objectValue(refundRow.policy_evidence),paypal_status:providerRefund.status,paypal_amount:providerRefund.providerAmount,paypal_currency:providerRefund.currency}}).eq('id',refundRow.id);if(completed.error)throw fail('confirmer le remboursement PayPal',completed.error)}
    }
    const completedRefunds=await db.from('angelcare_marketplace_payment_refunds').select('requested_amount').eq('payment_intent_id',intent.id).eq('status','completed');if(completedRefunds.error)throw fail('recalculer les remboursements PayPal',completedRefunds.error)
    const refunded=(completedRefunds.data||[]).reduce((sum,refundRow)=>sum+numberValue(refundRow.requested_amount),0);const updateIntent=await db.from('angelcare_marketplace_payment_intents').update({status:refunded+0.01>=numberValue(intent.expected_amount)?'refunded':'partially_refunded',refunded_amount:Math.min(numberValue(intent.expected_amount),refunded),updated_at:new Date().toISOString()}).eq('id',intent.id);if(updateIntent.error)throw fail('mettre à jour le total remboursé',updateIntent.error)
   }
  }
  if(verified.refundReference){
   const refund=await db.from('angelcare_marketplace_payment_refunds').select('*').eq('provider_reference',verified.refundReference).maybeSingle();if(refund.error)throw fail('résoudre le remboursement webhook',refund.error)
   if(refund.data){const eventType=verified.eventType.toUpperCase();if(eventType==='PAYMENT.REFUND.PENDING')await db.from('angelcare_marketplace_payment_refunds').update({status:'processing',updated_at:new Date().toISOString()}).eq('id',refund.data.id);if(eventType==='PAYMENT.REFUND.FAILED'){await db.from('angelcare_marketplace_payment_refunds').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',refund.data.id);await db.from('angelcare_marketplace_payment_intents').update({status:'reconciliation_pending',updated_at:new Date().toISOString()}).eq('id',refund.data.payment_intent_id)}}
  }
  await db.from('angelcare_marketplace_payment_provider_events').update({status:'processed',payment_intent_id:intent?.id||null,processed_at:new Date().toISOString()}).eq('id',event.id)
 }catch(reason){status='failed';await db.from('angelcare_marketplace_payment_provider_events').update({status:'failed',error_message:reason instanceof Error?reason.message:'processing failure'}).eq('id',event.id);throw reason}
 return{accepted:true,eventId:String(event.id),intentId:intent?String(intent.id):null,status}
}

export async function createPaymentRefund(input:{context:MarketplaceRequestContext;paymentIntentId:string;amount:number;reason:string;idempotencyKey:string}):Promise<Record<string,unknown>>{
 const db=await createServiceClient()
 const{data:intent,error}=await db.from('angelcare_marketplace_payment_intents').select('*').eq('id',input.paymentIntentId).single()
 if(error||!intent)throw fail('charger le paiement à rembourser',error)
 if(!['captured','partially_refunded','reconciled'].includes(text(intent.status)))throw new MarketplaceError('CONFLICT','Seul un paiement capturé peut être remboursé.')
 const refundable=Math.max(0,numberValue(intent.captured_amount)-numberValue(intent.refunded_amount))
 if(input.amount>refundable+0.001)throw new MarketplaceError('VALIDATION_ERROR',`Le montant remboursable maximum est ${refundable} Dh.`)

 const existing=await db.from('angelcare_marketplace_payment_refunds').select('*').eq('idempotency_key',input.idempotencyKey).maybeSingle()
 if(existing.error)throw fail('rechercher le remboursement',existing.error)
 if(existing.data&&text(existing.data.status)==='completed')return existing.data as Record<string,unknown>

 const walletCaptured=Math.max(0,numberValue(intent.wallet_contribution))
 const alreadyRefunded=Math.max(0,numberValue(intent.refunded_amount))
 const walletRemaining=Math.max(0,walletCaptured-Math.min(walletCaptured,alreadyRefunded))
 const proposedWalletShare=Math.min(input.amount,walletRemaining)
 const proposedExternalShare=Math.max(0,input.amount-proposedWalletShare)
 let refund=existing.data as Row|null
 if(!refund){
  const created=await db.from('angelcare_marketplace_payment_refunds').insert({payment_intent_id:intent.id,customer_account_id:intent.customer_account_id,status:'pending',requested_amount:input.amount,wallet_restore_amount:proposedWalletShare,external_refund_amount:proposedExternalShare,reason_code:'admin_refund',reason:input.reason,idempotency_key:input.idempotencyKey,created_by:input.context.actor.id}).select('*').single()
  if(created.error||!created.data)throw fail('créer le remboursement',created.error)
  refund=created.data as Row
 }
 const walletShare=numberValue(refund.wallet_restore_amount)
 const externalShare=numberValue(refund.external_refund_amount)
 let providerReference=nullable(refund.provider_reference)
 let externalAccepted=externalShare<=0
 let externalCompleted=externalShare<=0
 let providerEvidence=objectValue(refund.policy_evidence)

 if(externalShare>0){
  if(!intent.selected_method)throw new MarketplaceError('DEPENDENCY_BLOCKED','Le remboursement externe exige un moyen de paiement vérifié.')
  const adapter=paymentAdapter(intent.selected_method as PaymentMethodKind)
  if(!adapter.refund)throw new MarketplaceError('CONFIGURATION_ERROR','Le prestataire actif ne fournit pas encore de fonction de remboursement.')
  let refundProviderAmount:string|null=null
  let refundCurrency:string|null=null
  let captureReference=nullable(intent.provider_reference)
  if(text(intent.provider_key)==='paypal'){
   const meta=paypalEvidence(intent as Row)
   captureReference=text(meta.captureId)||null
   refundCurrency=text(meta.currency)||null
   const rate=numberValue(meta.dhPerUnit)
   if(!captureReference||!refundCurrency||rate<=0)throw new MarketplaceError('DEPENDENCY_BLOCKED','La preuve de capture PayPal est incomplète; remboursement automatique bloqué.')
   refundProviderAmount=(Math.round((externalShare/rate)*100)/100).toFixed(2)
  }
  if(!captureReference)throw new MarketplaceError('DEPENDENCY_BLOCKED','Le remboursement externe exige une référence prestataire vérifiée.')

  try{
   if(providerReference&&text(intent.provider_key)==='paypal'){
    const current=await showPayPalRefund(providerReference)
    externalAccepted=true
    externalCompleted=current.status.toUpperCase()==='COMPLETED'
    providerEvidence={...providerEvidence,paypal:{refundId:current.refundId,refundStatus:current.status,providerAmount:current.providerAmount,currency:current.currency,checkedAt:new Date().toISOString()}}
   }else if(!providerReference){
    const result=await adapter.refund({providerReference:captureReference,amount:externalShare,idempotencyKey:input.idempotencyKey,providerAmount:refundProviderAmount,currency:refundCurrency,note:input.reason})
    providerReference=result.providerReference
    externalAccepted=true
    externalCompleted=result.status==='refunded'
    providerEvidence={provider:result.providerKey,evidence:result.evidence}
   }else{
    externalAccepted=true
    externalCompleted=text(refund.status)==='completed'
   }
  }catch(reason){
   await db.from('angelcare_marketplace_payment_refunds').update({status:'reconciliation_pending',policy_evidence:{...providerEvidence,last_error:reason instanceof Error?reason.message:'provider_refund_error',last_error_at:new Date().toISOString()},updated_at:new Date().toISOString()}).eq('id',refund.id)
   throw reason
  }

  const providerUpdate=await db.from('angelcare_marketplace_payment_refunds').update({provider_reference:providerReference,status:externalCompleted?'completed':'processing',policy_evidence:providerEvidence,updated_at:new Date().toISOString(),completed_at:externalCompleted?new Date().toISOString():null}).eq('id',refund.id)
  if(providerUpdate.error)throw fail('enregistrer le remboursement prestataire',providerUpdate.error)
 }

 let walletCompleted=walletShare<=0
 if(walletShare>0&&externalAccepted&&intent.customer_account_id){
  const wallet=await walletRow(String(intent.customer_account_id))
  if(!wallet)throw new MarketplaceError('DEPENDENCY_BLOCKED','AC Wallet du client introuvable pour le remboursement.')
  const walletResult=await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:wallet.id,p_entry_type:input.amount<Number(intent.captured_amount)?'partial_refund':'refund',p_bucket_kind:'refund',p_direction:'credit',p_amount:walletShare,p_source_type:'payment_refund',p_source_id:refund.id,p_reason_code:'payment_refund',p_description:input.reason,p_idempotency_key:`wallet-refund:${input.idempotencyKey}`,p_expires_at:null})
  if(walletResult.error){
   await db.from('angelcare_marketplace_payment_refunds').update({status:'reconciliation_pending',updated_at:new Date().toISOString()}).eq('id',refund.id)
   throw fail('restaurer les crédits AC Wallet',walletResult.error)
  }
  walletCompleted=true
 }

 const completedAmount=(walletCompleted?walletShare:0)+(externalCompleted?externalShare:0)
 const newRefunded=Math.min(numberValue(intent.expected_amount),numberValue(intent.refunded_amount)+completedAmount)
 const fullyCompleted=walletCompleted&&externalCompleted
 const refundStatus=fullyCompleted?'completed':externalAccepted?'processing':'reconciliation_pending'
 const refundUpdate=await db.from('angelcare_marketplace_payment_refunds').update({status:refundStatus,provider_reference:providerReference,policy_evidence:providerEvidence,completed_at:fullyCompleted?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',refund.id).select('*').single()
 if(refundUpdate.error||!refundUpdate.data)throw fail('finaliser le remboursement',refundUpdate.error)
 const nextIntentStatus=fullyCompleted?(newRefunded+0.01>=numberValue(intent.expected_amount)?'refunded':'partially_refunded'):'reconciliation_pending'
 const intentUpdate=await db.from('angelcare_marketplace_payment_intents').update({status:nextIntentStatus,refunded_amount:newRefunded,updated_at:new Date().toISOString()}).eq('id',intent.id)
 if(intentUpdate.error)throw fail('mettre à jour le paiement remboursé',intentUpdate.error)
 return refundUpdate.data as Record<string,unknown>



}
