import data from './catalog-data.json'
import type { MarketingAiCommand, MarketingAiFrequency, MarketingAiOperation, MarketingAiSkill } from './types'

const skills = data.skills as MarketingAiSkill[]
const operations = data.operations as MarketingAiOperation[]

function commandMode(skill: MarketingAiSkill, operation: MarketingAiOperation): MarketingAiCommand['authorityMode'] {
  if (['OBSERVE', 'RESEARCH', 'SCAN', 'MAP', 'ANALYZE', 'COMPARE', 'BENCHMARK', 'DIAGNOSE', 'DETECT', 'SCORE', 'FORECAST', 'SIMULATE', 'MONITOR', 'MEASURE', 'ATTRIBUTE'].includes(operation.code)) return 'observe'
  if (['PROPOSE', 'DESIGN', 'PLAN', 'PRIORITIZE', 'SUMMARIZE', 'REPORT', 'LEARN', 'UPDATE', 'SUPPRESS', 'SCALE', 'RECOVER', 'RECONCILE'].includes(operation.code)) return 'advise'
  if (['COMPILE', 'BRIEF', 'DRAFT', 'REWRITE', 'ADAPT', 'TRANSLATE', 'OPTIMIZE', 'CLASSIFY', 'TAG', 'LINK', 'VERSION', 'SCHEDULE', 'REVIEW', 'PREPARE', 'EXPORT', 'ARCHIVE', 'REUSE'].includes(operation.code)) return 'prepare'
  return 'orchestrate_internal'
}

function normalizeFrequency(value: string): MarketingAiFrequency {
  const allowed: MarketingAiFrequency[] = ['manual', 'hourly', 'every_4_hours', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'quarterly']
  return allowed.includes(value as MarketingAiFrequency) ? value as MarketingAiFrequency : 'manual'
}

export function getMarketingAiSkills(): MarketingAiSkill[] {
  return skills.map((skill) => ({ ...skill, defaultFrequency: normalizeFrequency(skill.defaultFrequency) }))
}

export function getMarketingAiOperations(): MarketingAiOperation[] {
  return operations.map((operation) => ({ ...operation, defaultFrequency: normalizeFrequency(operation.defaultFrequency) }))
}

export function generateMarketingAiCommands(): MarketingAiCommand[] {
  return getMarketingAiSkills().flatMap((skill, skillIndex) =>
    getMarketingAiOperations().map((operation, operationIndex) => {
      const sequence = skillIndex * operations.length + operationIndex + 1
      const code = `MKT-AI-${String(sequence).padStart(4, '0')}`
      const authorityMode = commandMode(skill, operation)
      const riskLevel = skill.riskLevel
      return {
        code,
        name: `${operation.name} · ${skill.name}`,
        skillCode: skill.code,
        skillName: skill.name,
        category: skill.category,
        objective: `${operation.name} for ${skill.name}: ${skill.description}`,
        instruction: [
          'Operate as the governed SANILA Marketing Director AI for ANGELCARE.',
          operation.instruction,
          `Apply the core skill: ${skill.name}. ${skill.description}`,
          'Be decisive, evidence-driven, commercially intelligent, culturally relevant to Morocco, premium corporate in tone, and explicit about assumptions.',
          'Use strong structure, precise next actions, named owners, deadlines, risks, stop conditions and human decision gates.',
          'Never perform external communication, external publication, ad activation, public statements or direct outreach.',
          'Treat missing data as unavailable, never as zero. Mark AI-prepared outputs and require human review when risk is medium or higher.',
        ].join(' '),
        defaultFrequency: operation.defaultFrequency === 'manual' ? skill.defaultFrequency : operation.defaultFrequency,
        authorityMode,
        riskLevel,
        requiresHumanReview: riskLevel !== 'low' || authorityMode !== 'observe',
        status: 'active',
        deployed: true,
        tags: [skill.category, skill.code, operation.code, authorityMode, 'angelcare', 'sanila', 'internal-only'],
        source: 'system_catalog',
        version: data.version,
      }
    }),
  )
}

export function getMarketingAiCatalogStats() {
  return {
    skills: skills.length,
    operations: operations.length,
    commands: skills.length * operations.length,
    version: data.version,
  }
}

export function getCatalogCommandByCode(code: string): MarketingAiCommand | undefined {
  return generateMarketingAiCommands().find((command) => command.code === code)
}
