import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import { getCustomerAccountSummary, listAdminJourneys, listCustomerJourneys } from '../journey-control/repository'
import type { CatalogLocale } from '../catalog-discovery/types'
import type { MarketplaceRequestContext } from '../domain/types'
import { PAYMENT_METHOD_COPY } from './content'
import { paymentAdapter, paymentProviderReadiness } from './payment-adapters'
import { capturePayPalOrder, getPayPalConfig, payPalAmountToDh } from './paypal'
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

async function walletRow(customerAccountId:string):Promise<Row|null>{const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_accounts').select('*,buckets:angelcare_marketplace_wallet_balance_buckets(*),membership:angelcare_marketplace_wallet_memberships(*,tier:angelcare_marketplace_wallet_tiers(*))').eq('customer_account_id',customerAccountId).maybeSingle();if(error)throw fail('charger AC Wallet',error);if(!data)return null;const row=data as Row;const m=rows(row.membership)[0];if(m){const tier=objectValue(m.tier);m.tier_name=text(tier.name_fr)||text(tier.tier_key);m.next_tier_name=null}return row}
export async function getOrCreateWallet(context:CustomerContext):Promise<WalletAccount>{let row=await walletRow(context.account.id);if(!row){const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_accounts').insert({customer_account_id:context.account.id,status:'active',currency_label:'Dh'}).select('*').single();if(error||!data)throw fail('activer AC Wallet',error);await db.from('angelcare_marketplace_wallet_balance_buckets').insert({wallet_account_id:data.id,bucket_kind:'purchased',available_amount:0,reserved_amount:0});row=await walletRow(context.account.id)}if(!row)throw new MarketplaceError('INTERNAL_ERROR','AC Wallet n’a pas pu être initialisé.');return mapWallet(row)}
export async function getWalletSummary(context:CustomerContext):Promise<WalletSummary>{const wallet=await getOrCreateWallet(context);const db=await createServiceClient();const[{data:entries,error},{data:expiring}]=await Promise.all([db.from('angelcare_marketplace_wallet_ledger_entries').select('*').eq('wallet_account_id',wallet.id).order('effective_at',{ascending:false}).limit(30),db.from('angelcare_marketplace_wallet_balance_buckets').select('bucket_kind,available_amount,expires_at').eq('wallet_account_id',wallet.id).gt('available_amount',0).not('expires_at','is',null).order('expires_at')]);if(error)throw fail('charger le relevé Wallet',error);const policies=await walletPoliciesForAdmin();return{account:wallet,recentEntries:(entries||[]).map((r)=>mapLedger(r as Row)),activePolicies:policies.filter((p)=>p.status==='active').slice(0,12),expiring:(expiring||[]).map((r)=>({amount:numberValue(r.available_amount),expiresAt:text(r.expires_at),bucketKind:text(r.bucket_kind) as WalletBalanceBucket['bucket_kind']})),recommendations:[{title:'Comparez avant de payer',message:'Les économies Wallet sont calculées en direct selon votre panier et vos politiques actives.',href:`/angelcare-marketplace/${context.locale}/marketplace`},{title:'Protégez votre compte',message:'Vérifiez vos sessions et vos moyens de paiement.',href:`/angelcare-marketplace/${context.locale}/account/wallet/security`} ]}}
export async function walletEntries(context:CustomerContext,limit=200):Promise<WalletLedgerEntry[]>{const wallet=await getOrCreateWallet(context);const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_ledger_entries').select('*').eq('wallet_account_id',wallet.id).order('effective_at',{ascending:false}).limit(Math.min(500,limit));if(error)throw fail('charger les transactions',error);return(data||[]).map((r)=>mapLedger(r as Row))}

export async function eligiblePaymentMethods(input:{context:CustomerContext|null;amount:number;offerType?:string|null;territoryId?:string|null;quoteOnly?:boolean;allowCash?:boolean;allowInvoice?:boolean}):Promise<PaymentMethodOption[]>{const locale=input.context?.locale||'fr';const wallet=input.context?await getOrCreateWallet(input.context):null;const readiness=paymentProviderReadiness();const configuredCard=readiness.find((x)=>x.methods.includes('card'))?.configured===true;const methods:PaymentMethodKind[]=['ac_wallet','card','bank_transfer','cash_on_delivery','pay_at_location','invoice','deposit','installment','corporate_allowance','voucher'];return methods.map((kind)=>{let eligible=true;let reason:string|null=null;let external=true;if(kind==='ac_wallet'){external=false;eligible=Boolean(wallet&&wallet.status==='active'&&wallet.available_balance>0);if(!input.context)reason='Activez votre compte et AC Wallet.';else if(!wallet?.available_balance)reason='Solde Wallet insuffisant.'}if(kind==='card'&&!configuredCard){eligible=false;reason='Prestataire carte non activé.'}if(kind==='cash_on_delivery'&&!input.allowCash){eligible=false;reason='Non autorisé pour cette offre.'}if(kind==='invoice'&&!input.allowInvoice){eligible=false;reason='Réservé aux comptes contractuels éligibles.'}if(input.quoteOnly&&['card','cash_on_delivery','pay_at_location'].includes(kind)){eligible=false;reason='Une proposition doit être établie avant paiement.'}const copy=PAYMENT_METHOD_COPY[kind][locale];return{kind,label:copy.label,description:copy.description,eligible,reason,requiresExternalProvider:external,supportsSplit:['ac_wallet','card','bank_transfer','corporate_allowance','voucher'].includes(kind),supportsRefund:!['cash_on_delivery'].includes(kind),dueNow:input.amount,currencyLabel:'Dh',metadata:{configured:kind==='card'?configuredCard:true,offerType:input.offerType}}})}

export async function walletComparisonForCustomer(input:{context:CustomerContext|null;normalPrice:number;itemId?:string|null;categoryKey?:string|null;schemaKey?:string|null;territoryId?:string|null} ){const wallet=input.context?await getOrCreateWallet(input.context):null;return evaluateWalletComparison({...input,wallet,customer:input.context?.account||null,walletPaymentRequested:true})}

export async function quoteWalletTopUp(input:{context:CustomerContext;amount:number}):Promise<WalletTopUpQuote>{const wallet=await getOrCreateWallet(input.context);const comparison=await evaluateWalletComparison({normalPrice:input.amount,wallet,customer:input.context.account,walletPaymentRequested:false,schemaKey:'wallet-topup'});const bonus=comparison.policies.filter((p)=>p.accepted).reduce((sum,p)=>sum+numberValue(p.evidence.bonusCredits),0);const methods=await eligiblePaymentMethods({context:input.context,amount:input.amount});return{requestedAmount:input.amount,purchasedCredits:input.amount,bonusCredits:bonus,totalCredits:input.amount+bonus,availableMethods:methods.filter((m)=>m.kind!=='ac_wallet'),policyEvaluations:comparison.policies,currencyLabel:'Dh'}}

export async function createPaymentIntent(input:{context:CustomerContext|null;amount:number;method:PaymentMethodKind;idempotencyKey:string;conversionSessionId?:string|null;canonicalObjectType?:string|null;canonicalObjectId?:string|null;walletContribution?:number;returnUrl:string;cancelUrl:string;metadata?:Record<string,unknown>}):Promise<{intent:PaymentIntent;attempt:PaymentAttempt|null;customerActionUrl:string|null;message:string}>{const db=await createServiceClient();const customerId=input.context?.account.id||null;const existing=await db.from('angelcare_marketplace_payment_intents').select('*').eq('idempotency_key',input.idempotencyKey).maybeSingle();if(existing.error)throw fail('rechercher le paiement',existing.error);let intentRow=existing.data as Row|null;if(!intentRow){const walletContribution=Math.min(input.amount,Math.max(0,input.walletContribution||0));const{data,error}=await db.from('angelcare_marketplace_payment_intents').insert({customer_account_id:customerId,conversion_session_id:input.conversionSessionId||null,canonical_object_type:input.canonicalObjectType||null,canonical_object_id:input.canonicalObjectId||null,status:'requires_method',currency_label:'Dh',expected_amount:input.amount,due_now_amount:input.amount,due_later_amount:0,wallet_contribution:walletContribution,external_contribution:Math.max(0,input.amount-walletContribution),idempotency_key:input.idempotencyKey,selected_method:input.method,metadata:input.metadata||{},expires_at:new Date(Date.now()+30*60*1000).toISOString()}).select('*').single();if(error||!data)throw fail('créer l’intention de paiement',error);intentRow=data as Row;if(walletContribution>0&&input.context){const wallet=await getOrCreateWallet(input.context);const{data:reservation,error:reservationError}=await db.rpc('angelcare_marketplace_wallet_reserve',{p_wallet_account_id:wallet.id,p_amount:walletContribution,p_source_type:'payment_intent',p_source_id:data.id,p_idempotency_key:`reserve:${input.idempotencyKey}`});if(reservationError)throw fail('réserver les crédits Wallet',reservationError);await db.from('angelcare_marketplace_payment_intents').update({wallet_reservation_id:typeof reservation==='string'?reservation:null}).eq('id',data.id);intentRow={...intentRow,wallet_reservation_id:reservation}}}
const intent=mapIntent(intentRow);if(input.method==='ac_wallet'){if(!input.context)throw new MarketplaceError('AUTHENTICATION_REQUIRED','Connexion requise pour AC Wallet.');const wallet=await getOrCreateWallet(input.context);if(wallet.available_balance<input.amount)throw new MarketplaceError('DEPENDENCY_BLOCKED','Solde AC Wallet insuffisant.');const{data:reservation,error}=await db.rpc('angelcare_marketplace_wallet_reserve',{p_wallet_account_id:wallet.id,p_amount:input.amount,p_source_type:'payment_intent',p_source_id:intent.id,p_idempotency_key:`reserve:${input.idempotencyKey}`});if(error)throw fail('réserver le Wallet',error);await db.from('angelcare_marketplace_payment_intents').update({status:'authorized',authorized_amount:input.amount,wallet_reservation_id:reservation,provider_key:'ac_wallet',provider_reference:wallet.public_reference,updated_at:new Date().toISOString()}).eq('id',intent.id);const updated=await db.from('angelcare_marketplace_payment_intents').select('*').eq('id',intent.id).single();return{intent:mapIntent(updated.data as Row),attempt:null,customerActionUrl:null,message:'Crédits AC Wallet réservés. La capture intervient avec la confirmation canonique.'}}
const adapter=paymentAdapter(input.method);const attemptNumber=numberValue((await db.from('angelcare_marketplace_payment_attempts').select('id',{count:'exact',head:true}).eq('payment_intent_id',intent.id)).count)+1;const{data:attemptRow,error:attemptError}=await db.from('angelcare_marketplace_payment_attempts').insert({payment_intent_id:intent.id,attempt_number:attemptNumber,method_kind:input.method,status:'created',amount:intent.due_now_amount,idempotency_key:`${input.idempotencyKey}:${attemptNumber}`}).select('*').single();if(attemptError||!attemptRow)throw fail('créer la tentative de paiement',attemptError);try{const result=await adapter.create({intent,method:input.method,returnUrl:input.returnUrl,cancelUrl:input.cancelUrl,customer:input.context?.account||null,metadata:input.metadata||{}});await db.from('angelcare_marketplace_payment_attempts').update({status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,customer_message:result.customerMessage,provider_evidence:result.evidence,updated_at:new Date().toISOString()}).eq('id',attemptRow.id);await db.from('angelcare_marketplace_payment_intents').update({status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,selected_method:input.method,updated_at:new Date().toISOString()}).eq('id',intent.id);return{intent:{...intent,status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,selected_method:input.method},attempt:mapAttempt({...attemptRow,status:result.status,provider_key:result.providerKey,provider_reference:result.providerReference,customer_message:result.customerMessage}),customerActionUrl:result.customerActionUrl,message:result.customerMessage}}catch(error){await db.from('angelcare_marketplace_payment_attempts').update({status:'failed',failure_code:error instanceof MarketplaceError?error.code:'provider_error',customer_message:error instanceof Error?error.message:'Paiement impossible.',updated_at:new Date().toISOString()}).eq('id',attemptRow.id);await db.from('angelcare_marketplace_payment_intents').update({status:'failed',updated_at:new Date().toISOString()}).eq('id',intent.id);throw error}}

export async function createWalletTopUp(input:{context:CustomerContext;amount:number;method:PaymentMethodKind;idempotencyKey:string;returnUrl:string;cancelUrl:string}):Promise<WalletTopUpResult>{if(input.method==='ac_wallet')throw new MarketplaceError('VALIDATION_ERROR','AC Wallet ne peut pas se recharger lui-même.');const wallet=await getOrCreateWallet(input.context);const quote=await quoteWalletTopUp({context:input.context,amount:input.amount});const payment=await createPaymentIntent({context:input.context,amount:input.amount,method:input.method,idempotencyKey:`topup:${input.idempotencyKey}`,canonicalObjectType:'wallet_topup',canonicalObjectId:wallet.id,returnUrl:input.returnUrl,cancelUrl:input.cancelUrl,metadata:{walletAccountId:wallet.id,purchasedCredits:quote.purchasedCredits,bonusCredits:quote.bonusCredits}});const db=await createServiceClient();const{data,error}=await db.from('angelcare_marketplace_wallet_topups').insert({wallet_account_id:wallet.id,customer_account_id:input.context.account.id,payment_intent_id:payment.intent.id,status:payment.intent.status==='captured'?'completed':'payment_pending',requested_amount:input.amount,purchased_credits:quote.purchasedCredits,bonus_credits:quote.bonusCredits,total_credits:quote.totalCredits,currency_label:'Dh',idempotency_key:input.idempotencyKey}).select('*').single();if(error||!data)throw fail('créer la recharge Wallet',error);return{topupId:String(data.id),publicReference:String(data.public_reference),paymentIntent:payment.intent,walletAccount:wallet,status:String(data.status)}}

export async function captureWalletTopUp(input:{paymentIntentId:string;providerEventId:string}):Promise<void>{const db=await createServiceClient();const{data:topup,error}=await db.from('angelcare_marketplace_wallet_topups').select('*').eq('payment_intent_id',input.paymentIntentId).maybeSingle();if(error||!topup)throw fail('charger la recharge',error);if(topup.status==='completed')return;const{error:entryError}=await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:topup.wallet_account_id,p_entry_type:'top_up',p_bucket_kind:'purchased',p_direction:'credit',p_amount:topup.purchased_credits,p_source_type:'wallet_topup',p_source_id:topup.id,p_reason_code:'verified_topup',p_description:'Recharge AC Wallet vérifiée',p_idempotency_key:`topup-credit:${input.providerEventId}`,p_expires_at:null});if(entryError)throw fail('créditer la recharge',entryError);if(numberValue(topup.bonus_credits)>0){const{error:bonusError}=await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:topup.wallet_account_id,p_entry_type:'top_up_bonus',p_bucket_kind:'promotional',p_direction:'credit',p_amount:topup.bonus_credits,p_source_type:'wallet_topup',p_source_id:topup.id,p_reason_code:'topup_bonus',p_description:'Bonus de recharge AC Wallet',p_idempotency_key:`topup-bonus:${input.providerEventId}`,p_expires_at:topup.bonus_expires_at||null});if(bonusError)throw fail('créditer le bonus',bonusError)}await db.from('angelcare_marketplace_wallet_topups').update({status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',topup.id);await db.from('angelcare_marketplace_payment_intents').update({status:'captured',captured_amount:topup.requested_amount,updated_at:new Date().toISOString()}).eq('id',input.paymentIntentId)}

export async function getCustomerPortfolio(context:CustomerContext,filter:CustomerPortfolio['filter'],locale:CatalogLocale):Promise<CustomerPortfolio>{const journeys=await listCustomerJourneys(context.marketplace);const mapping:Record<string,string[]>= {product_order:['product_order','kit_order'],family_booking:['family_booking','recurring_service'],academy_enrollment:['academy_enrollment'],b2b_quotation:['b2b_quotation','hospitality_programme','corporate_benefit'],partner_activation:['partner_activation'],quality_assessment:['quality_assessment']};const filtered=filter==='all'?journeys:journeys.filter((j)=>mapping[filter]?.includes(j.journey_type));const wallet=await getOrCreateWallet(context).catch(()=>null);const db=await createServiceClient();const{data:payments}=await db.from('angelcare_marketplace_payment_intents').select('*').eq('customer_account_id',context.account.id).in('status',['requires_method','requires_customer_action','pending','failed','reconciliation_pending']).order('updated_at',{ascending:false});const counts=journeys.reduce<Record<string,number>>((result,j)=>({...result,[j.journey_type]:(result[j.journey_type]||0)+1}),{});return{locale,account:context.account,wallet,journeys,filteredJourneys:filtered,filter,counts,pendingPayments:(payments||[]).map((r)=>mapIntent(r as Row))}}

export async function walletAdminSummary(context:MarketplaceRequestContext):Promise<WalletAdminSummary>{const db=await createServiceClient();let query=db.from('angelcare_marketplace_wallet_accounts').select('*,buckets:angelcare_marketplace_wallet_balance_buckets(*),membership:angelcare_marketplace_wallet_memberships(*)').order('updated_at',{ascending:false}).limit(200);const{data,error}=await query;if(error)throw fail('charger Wallet Command',error);const wallets=(data||[]).map((r)=>mapWallet(r as Row));const{count:exceptions}=await db.from('angelcare_marketplace_wallet_reconciliation_items').select('id',{count:'exact',head:true}).not('status','eq','reconciled');return{walletCount:wallets.length,activeWallets:wallets.filter((w)=>w.status==='active').length,frozenWallets:wallets.filter((w)=>w.status==='frozen').length,availableLiability:wallets.reduce((s,w)=>s+w.available_balance,0),purchasedLiability:wallets.reduce((s,w)=>s+w.purchased_balance,0),promotionalExposure:wallets.reduce((s,w)=>s+w.bonus_balance,0),reservedCredits:wallets.reduce((s,w)=>s+w.reserved_balance,0),expiringCredits:wallets.reduce((s,w)=>s+w.expiring_balance,0),fundedVolume:wallets.reduce((s,w)=>s+w.lifetime_funded,0),spentVolume:wallets.reduce((s,w)=>s+w.lifetime_spent,0),issuedSavings:wallets.reduce((s,w)=>s+w.lifetime_savings,0),reconciliationExceptions:exceptions||0,recentAccounts:wallets.slice(0,20)}}

export async function enterpriseOrderSummary(context: MarketplaceRequestContext): Promise<EnterpriseOrderSummary> {
  const db = await createServiceClient()
  let query = db
    .from('angelcare_marketplace_journeys')
    .select('id,public_reference,journey_type,status,title,customer_account_id,financial_status,fulfillment_status,customer_context,current_authority,risk_level,next_action_label,creation_source,updated_at,tenant_id,territory_id')
    .order('updated_at', { ascending: false })
    .limit(250)

  if (context.tenantId) query = query.eq('tenant_id', context.tenantId)
  if (context.territoryId) query = query.eq('territory_id', context.territoryId)

  const { data: journeyRows, error: journeyError } = await query
  if (journeyError) throw fail('charger Enterprise Orders', journeyError)

  const journeys = (journeyRows || []) as Row[]
  const ids = journeys.map((row) => text(row.id)).filter(Boolean)
  let paymentRows: Row[] = []

  if (ids.length) {
    const { data: payments, error: paymentError } = await db
      .from('angelcare_marketplace_payment_intents')
      .select('*')
      .in('canonical_object_id', ids)
    if (paymentError && paymentError.code !== '42P01') throw fail('charger les paiements des commandes', paymentError)
    paymentRows = (payments || []) as Row[]
  }

  const paymentByJourney = new Map<string, Row>()
  for (const payment of paymentRows) {
    const journeyId = text(payment.canonical_object_id)
    if (journeyId && !paymentByJourney.has(journeyId)) paymentByJourney.set(journeyId, payment)
  }

  const records: EnterpriseOrderRecord[] = journeys.map((journey) => {
    const payment = paymentByJourney.get(text(journey.id))
    const finance = objectValue(journey.financial_status)
    const fulfillment = objectValue(journey.fulfillment_status)
    const customerContext = objectValue(journey.customer_context)
    const expected = payment ? numberValue(payment.expected_amount) : numberValue(finance.amount)
    const walletContribution = payment ? numberValue(payment.wallet_contribution) : numberValue(finance.wallet_contribution)
    return {
      id: text(journey.id),
      publicReference: text(journey.public_reference),
      journeyType: text(journey.journey_type) as EnterpriseOrderRecord['journeyType'],
      status: text(journey.status),
      title: text(journey.title),
      customerName: text(customerContext.customer_name) || text(customerContext.fullName) || 'Client ANGELCARE',
      customerReference: nullable(customerContext.customer_reference),
      paymentStatus: payment ? text(payment.status) : text(finance.status) || 'not_required',
      paymentAmount: expected,
      walletContribution,
      externalContribution: payment
        ? Math.max(0, expected - walletContribution)
        : numberValue(finance.external_contribution),
      fulfillmentStatus: text(fulfillment.status) || text(journey.current_authority),
      riskLevel: text(journey.risk_level),
      nextAction: nullable(journey.next_action_label),
      updatedAt: text(journey.updated_at),
      creationSource: text(journey.creation_source) || 'customer_checkout',
      customerAccountId: nullable(journey.customer_account_id),
      journey: null,
    }
  })

  return {
    total: records.length,
    requiringAction: records.filter((record) => record.nextAction).length,
    paymentExceptions: records.filter((record) => ['failed', 'disputed', 'chargeback', 'reconciliation_pending'].includes(record.paymentStatus)).length,
    fulfillmentExceptions: records.filter((record) => ['blocked', 'recovery'].includes(record.status)).length,
    walletExceptions: records.filter((record) => record.walletContribution > 0 && ['failed', 'reconciliation_pending'].includes(record.paymentStatus)).length,
    refundsPending: records.filter((record) => ['partially_refunded', 'refunded'].includes(record.paymentStatus)).length,
    records,
  }
}


type PayPalBrowserReturnResult = {
  intent: PaymentIntent
  locale: CatalogLocale | null
  sessionKey: string | null
  basketId: string | null
}

async function paypalReturnContext(intent: PaymentIntent): Promise<Pick<PayPalBrowserReturnResult, 'locale' | 'sessionKey' | 'basketId'>> {
  if (!intent.conversion_session_id) return { locale: null, sessionKey: null, basketId: null }
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_conversion_sessions').select('session_key,quote_basket_id,locale').eq('id', intent.conversion_session_id).maybeSingle()
  if (error) throw fail('charger le contexte de retour paiement', error)
  return {
    locale: data?.locale ? String(data.locale) as CatalogLocale : null,
    sessionKey: data?.session_key ? String(data.session_key) : null,
    basketId: data?.quote_basket_id ? String(data.quote_basket_id) : null,
  }
}

async function paypalReturnIntent(input: { orderId: string | null; paymentIntentId?: string | null }): Promise<PaymentIntent> {
  const db = await createServiceClient()
  let query = db.from('angelcare_marketplace_payment_intents').select('*')
  if (input.paymentIntentId) query = query.eq('id', input.paymentIntentId)
  else if (input.orderId) query = query.eq('provider_reference', input.orderId)
  else throw new MarketplaceError('VALIDATION_ERROR', 'Référence de paiement PayPal absente.')
  const { data, error } = await query.maybeSingle()
  if (error) throw fail('charger le paiement PayPal', error)
  if (!data) throw new MarketplaceError('NOT_FOUND', 'Paiement PayPal introuvable.')
  const intent = mapIntent(data as Row)
  if (intent.provider_key && intent.provider_key !== 'paypal') throw new MarketplaceError('CONFLICT', 'Ce paiement n’appartient pas au prestataire PayPal.')
  return intent
}

export async function capturePayPalBrowserReturn(input: { orderId: string; paymentIntentId?: string | null }): Promise<PayPalBrowserReturnResult> {
  const db = await createServiceClient()
  let intent = await paypalReturnIntent(input)
  if (!['captured', 'partially_refunded', 'refunded', 'reconciled'].includes(intent.status)) {
    if (intent.provider_reference && intent.provider_reference !== input.orderId) throw new MarketplaceError('CONFLICT', 'La référence PayPal ne correspond pas à cette intention de paiement.')
    const capture = await capturePayPalOrder(input.orderId, `browser-return:${intent.id}`)
    if (capture.paymentIntentIdHint && capture.paymentIntentIdHint !== intent.id) throw new MarketplaceError('DATA_INTEGRITY', 'PayPal a retourné une intention de paiement différente.')
    if (String(capture.captureStatus || capture.orderStatus).toUpperCase() !== 'COMPLETED') throw new MarketplaceError('DEPENDENCY_BLOCKED', 'La capture PayPal n’est pas confirmée.')

    const config = getPayPalConfig()
    const expectedExternal = intent.external_contribution > 0 ? intent.external_contribution : Math.max(0, intent.expected_amount - intent.wallet_contribution)
    if (capture.providerAmount && expectedExternal > 0) {
      const capturedDh = payPalAmountToDh(capture.providerAmount, config.dhPerUnit)
      if (Math.abs(capturedDh - expectedExternal) > 0.5) throw new MarketplaceError('DATA_INTEGRITY', 'Le montant capturé par PayPal ne correspond pas au montant externe attendu.')
    }

    const metadata = {
      ...intent.metadata,
      paypal: {
        ...objectValue(intent.metadata.paypal),
        orderId: capture.orderId,
        captureId: capture.captureId,
        captureStatus: capture.captureStatus,
        providerAmount: capture.providerAmount,
        currency: capture.currency,
        capturedAt: new Date().toISOString(),
      },
    }

    const { data: updated, error } = await db.from('angelcare_marketplace_payment_intents').update({
      status: 'captured',
      authorized_amount: intent.expected_amount,
      captured_amount: intent.expected_amount,
      provider_key: 'paypal',
      provider_reference: capture.captureId || capture.orderId,
      metadata,
      updated_at: new Date().toISOString(),
    }).eq('id', intent.id).select('*').single()
    if (error || !updated) throw fail('finaliser le paiement PayPal', error)

    await db.from('angelcare_marketplace_payment_attempts').update({
      status: 'captured',
      provider_key: 'paypal',
      provider_reference: capture.captureId || capture.orderId,
      provider_evidence: { paypal: metadata.paypal },
      updated_at: new Date().toISOString(),
    }).eq('payment_intent_id', intent.id).eq('provider_key', 'paypal').in('status', ['created', 'requires_customer_action', 'pending', 'authorized'])

    intent = mapIntent(updated as Row)
    if (intent.canonical_object_type === 'wallet_topup') {
      await captureWalletTopUp({ paymentIntentId: intent.id, providerEventId: `paypal-browser:${capture.captureId || capture.orderId}` })
      const refreshed = await db.from('angelcare_marketplace_payment_intents').select('*').eq('id', intent.id).single()
      if (refreshed.data) intent = mapIntent(refreshed.data as Row)
    }
  }
  return { intent, ...(await paypalReturnContext(intent)) }
}

export async function cancelPayPalBrowserReturn(input: { orderId: string | null; paymentIntentId?: string | null }): Promise<PayPalBrowserReturnResult> {
  const db = await createServiceClient()
  let intent = await paypalReturnIntent(input)
  if (!['captured', 'partially_refunded', 'refunded', 'reconciled', 'cancelled'].includes(intent.status)) {
    if (intent.wallet_reservation_id) {
      const released = await db.rpc('angelcare_marketplace_wallet_release', { p_reservation_id: intent.wallet_reservation_id, p_reason: 'paypal_browser_cancelled' })
      if (released.error) throw fail('libérer la réservation Wallet', released.error)
    }
    const { data: updated, error } = await db.from('angelcare_marketplace_payment_intents').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', intent.id).select('*').single()
    if (error || !updated) throw fail('annuler le paiement PayPal', error)
    await db.from('angelcare_marketplace_payment_attempts').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('payment_intent_id', intent.id).in('status', ['created', 'requires_customer_action', 'pending', 'authorized'])
    if (intent.canonical_object_type === 'wallet_topup') await db.from('angelcare_marketplace_wallet_topups').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('payment_intent_id', intent.id).neq('status', 'completed')
    intent = mapIntent(updated as Row)
  }
  return { intent, ...(await paypalReturnContext(intent)) }
}

export async function processPaymentProviderWebhook(input:{providerKey:string;request:Request}):Promise<{accepted:boolean;eventId:string;intentId:string|null;status:string}>{
 const adapter=paymentAdapter('card');if(!adapter.verifyWebhook)throw new MarketplaceError('CONFIGURATION_ERROR',`Le prestataire ${input.providerKey} ne fournit pas encore de vérificateur webhook.`)
 const verified=await adapter.verifyWebhook(input.request);const db=await createServiceClient();const replayKey=`${input.providerKey}:${verified.eventId}`
 const existing=await db.from('angelcare_marketplace_payment_provider_events').select('id,status,payment_intent_id').eq('replay_key',replayKey).maybeSingle();if(existing.data)return{accepted:true,eventId:String(existing.data.id),intentId:nullable(existing.data.payment_intent_id),status:String(existing.data.status)}
 const intentResult=verified.paymentIntentIdHint
  ? await db.from('angelcare_marketplace_payment_intents').select('*').eq('id',verified.paymentIntentIdHint).maybeSingle()
  : verified.providerReference
    ? await db.from('angelcare_marketplace_payment_intents').select('*').eq('provider_reference',verified.providerReference).maybeSingle()
    : {data:null,error:null}
 const intent=intentResult.data as Row|null
 const{data:event,error}=await db.from('angelcare_marketplace_payment_provider_events').insert({provider_key:input.providerKey,provider_event_id:verified.eventId,event_type:verified.eventType,signature_valid:true,replay_key:replayKey,status:'processing',payment_intent_id:intent?.id||null,payload:verified.payload}).select('*').single();if(error||!event)throw fail('enregistrer le webhook',error)
 let status='processed';try{if(intent){const next=verified.eventType.includes('captur')||verified.eventType.includes('success')?'captured':verified.eventType.includes('fail')?'failed':verified.eventType.includes('refund')?'refunded':'pending';await db.from('angelcare_marketplace_payment_intents').update({status:next,captured_amount:next==='captured'?intent.expected_amount:intent.captured_amount,refunded_amount:next==='refunded'?intent.expected_amount:intent.refunded_amount,updated_at:new Date().toISOString()}).eq('id',intent.id);if(next==='captured'&&intent.canonical_object_type==='wallet_topup')await captureWalletTopUp({paymentIntentId:String(intent.id),providerEventId:verified.eventId})}await db.from('angelcare_marketplace_payment_provider_events').update({status:'processed',processed_at:new Date().toISOString()}).eq('id',event.id)}catch(reason){status='failed';await db.from('angelcare_marketplace_payment_provider_events').update({status:'failed',error_message:reason instanceof Error?reason.message:'processing failure'}).eq('id',event.id);throw reason}return{accepted:true,eventId:String(event.id),intentId:intent?String(intent.id):null,status}
}
export async function createPaymentRefund(input:{context:MarketplaceRequestContext;paymentIntentId:string;amount:number;reason:string;idempotencyKey:string}):Promise<Record<string,unknown>>{
 const db=await createServiceClient();const{data:intent,error}=await db.from('angelcare_marketplace_payment_intents').select('*').eq('id',input.paymentIntentId).single();if(error||!intent)throw fail('charger le paiement à rembourser',error)
 const refundable=Math.max(0,numberValue(intent.captured_amount)-numberValue(intent.refunded_amount));if(input.amount>refundable)throw new MarketplaceError('VALIDATION_ERROR',`Le montant remboursable maximum est ${refundable} Dh.`)
 const walletShare=Math.min(input.amount,numberValue(intent.wallet_contribution));const externalShare=Math.max(0,input.amount-walletShare)
 const{data:refund,error:refundError}=await db.from('angelcare_marketplace_payment_refunds').insert({payment_intent_id:intent.id,customer_account_id:intent.customer_account_id,status:'pending',requested_amount:input.amount,wallet_restore_amount:walletShare,external_refund_amount:externalShare,reason_code:'admin_refund',reason:input.reason,idempotency_key:input.idempotencyKey,created_by:input.context.actor.id}).select('*').single();if(refundError||!refund)throw fail('créer le remboursement',refundError)
 if(walletShare>0&&intent.customer_account_id){const row=await walletRow(String(intent.customer_account_id));if(row)await db.rpc('angelcare_marketplace_wallet_post_entry',{p_wallet_account_id:row.id,p_entry_type:input.amount<Number(intent.captured_amount)?'partial_refund':'refund',p_bucket_kind:'refund',p_direction:'credit',p_amount:walletShare,p_source_type:'payment_refund',p_source_id:refund.id,p_reason_code:'payment_refund',p_description:input.reason,p_idempotency_key:`wallet-refund:${input.idempotencyKey}`,p_expires_at:null})}
 if(externalShare>0){if(!intent.provider_reference||!intent.selected_method)throw new MarketplaceError('DEPENDENCY_BLOCKED','Le remboursement externe exige une référence prestataire vérifiée.');const adapter=paymentAdapter(intent.selected_method as PaymentMethodKind);if(!adapter.refund)throw new MarketplaceError('CONFIGURATION_ERROR','Le prestataire actif ne fournit pas encore de fonction de remboursement.');const result=await adapter.refund({providerReference:String(intent.provider_reference),amount:externalShare,idempotencyKey:input.idempotencyKey});await db.from('angelcare_marketplace_payment_refunds').update({provider_reference:result.providerReference,status:result.status==='refunded'?'completed':'processing',updated_at:new Date().toISOString(),completed_at:result.status==='refunded'?new Date().toISOString():null}).eq('id',refund.id)}else await db.from('angelcare_marketplace_payment_refunds').update({status:'completed',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',refund.id)
 await db.from('angelcare_marketplace_payment_intents').update({status:input.amount===refundable?'refunded':'partially_refunded',refunded_amount:numberValue(intent.refunded_amount)+input.amount,updated_at:new Date().toISOString()}).eq('id',intent.id)
 return{...refund,wallet_restore_amount:walletShare,external_refund_amount:externalShare}
}
