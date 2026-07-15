'use server'

import { revalidatePath } from 'next/cache'
import { upsertServiceOSRecord, deleteServiceOSRecord } from './repository'
import type { ServiceOSBlueprint, ServiceOSRule } from './types'

function text(formData: FormData, key: string, fallback = '') { return String(formData.get(key) ?? fallback).trim() }
function list(formData: FormData, key: string) { return text(formData, key).split(',').map(x => x.trim()).filter(Boolean) }
function num(formData: FormData, key: string, fallback = 0) { const n = Number(formData.get(key)); return Number.isFinite(n) ? n : fallback }

export async function saveServiceOSBlueprint(formData: FormData) {
  const id = text(formData, 'id') || `bp_${Date.now()}`
  const record: ServiceOSBlueprint = {
    id,
    code: text(formData, 'code', id).toUpperCase(),
    title: text(formData, 'title', 'Untitled service blueprint'),
    family: text(formData, 'family', 'home_care') as ServiceOSBlueprint['family'],
    status: text(formData, 'status', 'draft') as ServiceOSBlueprint['status'],
    commercialTitle: text(formData, 'commercialTitle'),
    description: text(formData, 'description'),
    targetClients: list(formData, 'targetClients'),
    modules: list(formData, 'modules'),
    rules: list(formData, 'rules'),
    cities: list(formData, 'cities'),
    basePriceMad: num(formData, 'basePriceMad', 0),
    marginTargetPct: num(formData, 'marginTargetPct', 35),
    staffRoles: list(formData, 'staffRoles'),
    requiredDocuments: list(formData, 'requiredDocuments'),
    workflowTemplate: text(formData, 'workflowTemplate', 'standard'),
    defaultSlaMinutes: num(formData, 'defaultSlaMinutes', 120),
    subscriptionEligible: formData.get('subscriptionEligible') === 'on',
    institutionalEligible: formData.get('institutionalEligible') === 'on',
    aiTags: list(formData, 'aiTags'),
    createdForHorizon: text(formData, 'createdForHorizon', 'now') as ServiceOSBlueprint['createdForHorizon'],
  }
  await upsertServiceOSRecord('serviceos_blueprints', record)
  revalidatePath('/services')
  revalidatePath('/services/blueprints')
}

export async function saveServiceOSRule(formData: FormData) {
  const id = text(formData, 'id') || `rule_${Date.now()}`
  const record: ServiceOSRule = {
    id,
    code: text(formData, 'code', id).toUpperCase(),
    label: text(formData, 'label'),
    appliesToFamilies: list(formData, 'appliesToFamilies') as ServiceOSRule['appliesToFamilies'],
    condition: text(formData, 'condition'),
    action: text(formData, 'action'),
    pricingModifierMad: num(formData, 'pricingModifierMad', 0),
    pricingMultiplier: num(formData, 'pricingMultiplier', 1),
    requiredModules: list(formData, 'requiredModules'),
    requiredCertifications: list(formData, 'requiredCertifications'),
    escalation: text(formData, 'escalation', 'medium') as ServiceOSRule['escalation'],
    status: text(formData, 'status', 'active') as ServiceOSRule['status'],
  }
  await upsertServiceOSRecord('serviceos_rules', record)
  revalidatePath('/services/rules')
}

export async function removeServiceOSBlueprint(formData: FormData) {
  await deleteServiceOSRecord('serviceos_blueprints', text(formData, 'id'))
  revalidatePath('/services/blueprints')
}
