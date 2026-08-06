import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '../server/errors'
import type { CustomerAccount, WalletAccount, WalletComparison, WalletPolicy, WalletPolicyEvaluationLine } from './types'

const text = (value: unknown): string => typeof value === 'string' ? value : ''
const objectValue = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
const numberValue = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0
const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : []

type Row = Record<string, unknown>

function mapPolicy(row: Row): WalletPolicy {
  return {
    id: text(row.id), policy_key: text(row.policy_key), name_fr: text(row.name_fr), name_en: text(row.name_en), name_ar: text(row.name_ar),
    description_fr: text(row.description_fr) || null, status: text(row.status) as WalletPolicy['status'], priority: numberValue(row.priority),
    stack_mode: text(row.stack_mode) as WalletPolicy['stack_mode'], customer_scope: text(row.customer_scope),
    conditions: objectValue(row.conditions), benefits: objectValue(row.benefits), customer_message: objectValue(row.customer_message) as Record<string,string>,
    starts_at: text(row.starts_at) || null, ends_at: text(row.ends_at) || null,
    usage_limit_per_customer: row.usage_limit_per_customer === null || row.usage_limit_per_customer === undefined ? null : numberValue(row.usage_limit_per_customer),
    campaign_budget: row.campaign_budget === null || row.campaign_budget === undefined ? null : numberValue(row.campaign_budget),
    consumed_budget: numberValue(row.consumed_budget), maximum_discount: row.maximum_discount === null || row.maximum_discount === undefined ? null : numberValue(row.maximum_discount),
    margin_floor_rate: row.margin_floor_rate === null || row.margin_floor_rate === undefined ? null : numberValue(row.margin_floor_rate),
    version: numberValue(row.version) || 1, created_at: text(row.created_at), updated_at: text(row.updated_at),
  }
}

export async function activeWalletPolicies(input: { customer?: CustomerAccount | null; itemId?: string | null; categoryKey?: string | null; schemaKey?: string | null; territoryId?: string | null; at?: Date }): Promise<WalletPolicy[]> {
  const db = await createServiceClient()
  const at = (input.at || new Date()).toISOString()
  const { data, error } = await db.from('angelcare_marketplace_wallet_policies').select('*')
    .eq('status','active').or(`starts_at.is.null,starts_at.lte.${at}`).or(`ends_at.is.null,ends_at.gte.${at}`).order('priority',{ascending:false})
  if (error) throw new MarketplaceError(error.code === '42P01' ? 'CONFIGURATION_ERROR' : 'INTERNAL_ERROR', 'Impossible de charger les politiques AC Wallet.', { cause: error })
  const policies = (data || []).map((row) => mapPolicy(row as Row))
  const customer = input.customer
  if (!customer) return policies.filter((policy) => ['public','all','wallet_member'].includes(policy.customer_scope))
  const { data: assignments } = await db.from('angelcare_marketplace_wallet_policy_assignments').select('policy_id,customer_account_id,group_id,status,starts_at,ends_at').eq('status','active')
    .or(`customer_account_id.eq.${customer.id},customer_account_id.is.null`)
  const assigned = new Set((assignments || []).map((row) => String(row.policy_id)))
  return policies.filter((policy) => ['public','all','wallet_member',customer.account_kind].includes(policy.customer_scope) || assigned.has(policy.id))
}

interface EvaluationInput {
  normalPrice: number
  wallet: WalletAccount | null
  customer?: CustomerAccount | null
  itemId?: string | null
  categoryKey?: string | null
  schemaKey?: string | null
  territoryId?: string | null
  basketQuantity?: number
  walletPaymentRequested?: boolean
  marginRate?: number | null
  at?: Date
}

function conditionResult(policy: WalletPolicy, input: EvaluationInput): { accepted: boolean; reason: string | null } {
  const c = policy.conditions
  const now = input.at || new Date()
  const minBasket = numberValue(c.minimum_basket_value)
  if (minBasket && input.normalPrice < minBasket) return { accepted:false, reason:`Minimum ${minBasket} Dh` }
  const maxBasket = numberValue(c.maximum_basket_value)
  if (maxBasket && input.normalPrice > maxBasket) return { accepted:false, reason:`Maximum ${maxBasket} Dh` }
  const itemIds = stringArray(c.item_ids)
  if (itemIds.length && (!input.itemId || !itemIds.includes(input.itemId))) return { accepted:false, reason:'Offre non ciblée' }
  const categories = stringArray(c.category_keys)
  if (categories.length && (!input.categoryKey || !categories.includes(input.categoryKey))) return { accepted:false, reason:'Catégorie non ciblée' }
  const schemas = stringArray(c.schema_keys)
  if (schemas.length && (!input.schemaKey || !schemas.includes(input.schemaKey))) return { accepted:false, reason:'Archetype non ciblé' }
  const territories = stringArray(c.territory_ids)
  if (territories.length && (!input.territoryId || !territories.includes(input.territoryId))) return { accepted:false, reason:'Territoire non ciblé' }
  if (c.wallet_payment_required === true && input.walletPaymentRequested === false) return { accepted:false, reason:'Paiement Wallet requis' }
  if (c.full_wallet_payment_required === true && (input.wallet?.available_balance || 0) < input.normalPrice) return { accepted:false, reason:'Paiement intégral Wallet requis' }
  const minimumBalance = numberValue(c.minimum_wallet_balance)
  if (minimumBalance && (input.wallet?.available_balance || 0) < minimumBalance) return { accepted:false, reason:'Solde minimum non atteint' }
  const tiers = stringArray(c.wallet_tiers)
  if (tiers.length && (!input.wallet?.membership || !tiers.includes(input.wallet.membership.tier_key))) return { accepted:false, reason:'Niveau Wallet non éligible' }
  const days = stringArray(c.days_of_week).map(Number)
  if (days.length && !days.includes(now.getDay())) return { accepted:false, reason:'Jour non éligible' }
  const hourStart = numberValue(c.hour_start)
  const hourEnd = numberValue(c.hour_end)
  if (hourStart || hourEnd) {
    const hour = now.getHours()
    if (hourStart && hour < hourStart) return { accepted:false, reason:'Fenêtre horaire non ouverte' }
    if (hourEnd && hour >= hourEnd) return { accepted:false, reason:'Fenêtre horaire terminée' }
  }
  if (policy.campaign_budget !== null && policy.consumed_budget >= policy.campaign_budget) return { accepted:false, reason:'Budget de campagne consommé' }
  if (policy.margin_floor_rate !== null && input.marginRate !== null && input.marginRate !== undefined && input.marginRate < policy.margin_floor_rate) return { accepted:false, reason:'Plancher de marge protégé' }
  return { accepted:true, reason:null }
}

function benefit(policy: WalletPolicy, price: number): { kind: WalletPolicyEvaluationLine['benefitKind']; amount: number; priorityLabel: string | null; bonus: number } {
  const b = policy.benefits
  let amount = 0
  let kind: WalletPolicyEvaluationLine['benefitKind'] = null
  let bonus = 0
  if (numberValue(b.wallet_fixed_price) > 0) { kind='wallet_fixed_price'; amount=Math.max(0,price-numberValue(b.wallet_fixed_price)) }
  else if (numberValue(b.discount_percent) > 0) { kind='percentage_discount'; amount=price*numberValue(b.discount_percent)/100 }
  else if (numberValue(b.fixed_discount) > 0) { kind='fixed_discount'; amount=numberValue(b.fixed_discount) }
  if (numberValue(b.bonus_credits) > 0) bonus = numberValue(b.bonus_credits)
  amount = Math.min(amount, policy.maximum_discount ?? amount)
  amount = Math.min(price, Math.round(amount*100)/100)
  const priorityLabel = b.priority_booking === true ? 'Priorité de réservation' : b.priority_waitlist === true ? 'Priorité liste d’attente' : b.free_delivery === true ? 'Livraison offerte' : b.fee_waiver === true ? 'Frais offerts' : null
  return { kind, amount, priorityLabel, bonus }
}

export async function evaluateWalletComparison(input: EvaluationInput): Promise<WalletComparison> {
  const policies = await activeWalletPolicies(input)
  const lines: WalletPolicyEvaluationLine[] = policies.map((policy) => {
    const check = conditionResult(policy,input)
    const result = check.accepted ? benefit(policy,input.normalPrice) : {kind:null,amount:0,priorityLabel:null,bonus:0}
    return { policyId:policy.id,policyKey:policy.policy_key,policyName:policy.name_fr,accepted:check.accepted,rejectionReason:check.reason,
      benefitKind:result.kind,benefitAmount:result.amount,priority:policy.priority,customerMessage:policy.customer_message.fr || null,
      evidence:{stackMode:policy.stack_mode,priorityLabel:result.priorityLabel,bonusCredits:result.bonus,version:policy.version} }
  })
  const accepted = lines.filter((line) => line.accepted).sort((a,b) => b.priority-a.priority)
  const exclusive = accepted.find((line) => policies.find((p)=>p.id===line.policyId)?.stack_mode === 'exclusive')
  const best = accepted.filter((line) => policies.find((p)=>p.id===line.policyId)?.stack_mode === 'best_benefit').sort((a,b)=>b.benefitAmount-a.benefitAmount)[0]
  const stackable = accepted.filter((line) => policies.find((p)=>p.id===line.policyId)?.stack_mode === 'stackable')
  const selected = exclusive ? [exclusive] : [...stackable, ...(best ? [best] : [])]
  const saving = Math.min(input.normalPrice, selected.reduce((sum,line)=>sum+line.benefitAmount,0))
  const walletPrice = Math.max(0,Math.round((input.normalPrice-saving)*100)/100)
  const balance = input.wallet?.available_balance || 0
  const contribution = Math.min(balance,walletPrice)
  const external = Math.max(0,walletPrice-contribution)
  const topUp = external
  const priorityLabel = selected.map((line)=>String(line.evidence.priorityLabel||'')).find(Boolean) || null
  let evaluationId: string | null = null
  try {
    const db = await createServiceClient()
    const { data } = await db.from('angelcare_marketplace_wallet_policy_evaluations').insert({
      customer_account_id: input.customer?.id || null, wallet_account_id: input.wallet?.id || null, catalog_item_id: input.itemId || null,
      normal_price: input.normalPrice, wallet_price: walletPrice, saving_amount: saving, currency_label:'Dh',
      accepted_policy_ids:selected.map((line)=>line.policyId), rejected_policy_ids:lines.filter((line)=>!line.accepted).map((line)=>line.policyId),
      evaluation_input:{categoryKey:input.categoryKey,schemaKey:input.schemaKey,territoryId:input.territoryId,quantity:input.basketQuantity},
      evaluation_output:{walletContribution:contribution,externalContribution:external,priorityLabel}, status:'evaluated',
    }).select('id').single()
    evaluationId = data?.id ? String(data.id) : null
  } catch { evaluationId = null }
  return { normalPrice:input.normalPrice,walletPrice,immediateSaving:saving,savingPercent:input.normalPrice?Math.round(saving/input.normalPrice*10000)/100:0,
    walletBalance:balance,walletContribution:contribution,externalContribution:external,remainingBalance:Math.max(0,balance-contribution),requiredTopUp:topUp,
    suggestedTopUp:Math.ceil(topUp/50)*50,topUpBonus:0,priorityLabel,eligible:selected.length>0,reason:selected.length?null:'Aucune politique Wallet active ne s’applique.',
    policies:lines,evaluationId,currencyLabel:'Dh' }
}

export async function walletPoliciesForAdmin(): Promise<WalletPolicy[]> {
  const db = await createServiceClient()
  const { data, error } = await db.from('angelcare_marketplace_wallet_policies').select('*').order('priority',{ascending:false}).order('updated_at',{ascending:false})
  if (error) throw new MarketplaceError('INTERNAL_ERROR','Impossible de charger le Policy Studio.',{cause:error})
  return (data || []).map((row)=>mapPolicy(row as Row))
}
