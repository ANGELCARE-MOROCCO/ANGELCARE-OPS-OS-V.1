import 'server-only'

import { createHash } from 'node:crypto'
import type { createAccessGovernanceAdminClient } from '../admin-client'
import type {
  AuthorityModel,
  JsonObject,
  JsonValue,
  UniversalEvidence,
  UniversalTopologyEdge,
  UniversalTopologyNode,
} from './types'

type AdminClient = ReturnType<typeof createAccessGovernanceAdminClient>

type DatabaseColumn = {
  name: string
  dataType: string
  nullable: boolean
  defaultValue: string | null
}

type DatabaseTable = {
  schema: string
  name: string
  rlsEnabled: boolean
  columns: DatabaseColumn[]
  primaryKey: string[]
  foreignKeys: Array<{ column: string; foreignSchema: string; foreignTable: string; foreignColumn: string }>
  uniqueConstraints: string[][]
}

type DatabasePolicy = {
  schema: string
  table: string
  name: string
  command: string
  roles: string[]
  usingExpression: string | null
  checkExpression: string | null
}

type DatabaseFunction = {
  schema: string
  name: string
  identityArguments: string
  securityDefiner: boolean
  volatility: string
}

export type DatabaseAuthoritySnapshot = {
  generatedAt: string
  tables: DatabaseTable[]
  policies: DatabasePolicy[]
  functions: DatabaseFunction[]
}

function stableKey(prefix: string, ...parts: string[]) {
  return `${prefix}:${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24)}`
}

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: JsonObject = {}
  for (const [key, child] of Object.entries(value)) result[key] = json(child)
  return result
}

function json(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((item) => json(item))
  return object(value)
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function values(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : []
}

function parseColumn(value: unknown): DatabaseColumn | null {
  const row = object(value)
  const name = String(row.name ?? '').trim()
  if (!name) return null
  return {
    name,
    dataType: String(row.dataType ?? row.data_type ?? ''),
    nullable: Boolean(row.nullable),
    defaultValue: row.defaultValue === null || row.default_value === null ? null : String(row.defaultValue ?? row.default_value ?? '') || null,
  }
}

function parseTable(value: unknown): DatabaseTable | null {
  const row = object(value)
  const name = String(row.name ?? '').trim()
  if (!name) return null
  const columns = (Array.isArray(row.columns) ? row.columns : []).map(parseColumn).filter((item): item is DatabaseColumn => Boolean(item))
  const foreignKeys = values(row.foreignKeys ?? row.foreign_keys).map((entry: JsonValue) => {
    const child = object(entry)
    return {
      column: String(child.column ?? ''),
      foreignSchema: String(child.foreignSchema ?? child.foreign_schema ?? 'public'),
      foreignTable: String(child.foreignTable ?? child.foreign_table ?? ''),
      foreignColumn: String(child.foreignColumn ?? child.foreign_column ?? ''),
    }
  }).filter((item: { column: string; foreignSchema: string; foreignTable: string; foreignColumn: string }) => Boolean(item.column && item.foreignTable && item.foreignColumn))
  const uniqueSource = values(row.uniqueConstraints ?? row.unique_constraints)
  return {
    schema: String(row.schema ?? 'public'),
    name,
    rlsEnabled: Boolean(row.rlsEnabled ?? row.rls_enabled),
    columns,
    primaryKey: strings(row.primaryKey ?? row.primary_key),
    foreignKeys,
    uniqueConstraints: uniqueSource.map((entry: JsonValue) => strings(entry)).filter((entry: string[]) => entry.length > 0),
  }
}

function parsePolicy(value: unknown): DatabasePolicy | null {
  const row = object(value)
  const name = String(row.name ?? '').trim()
  const table = String(row.table ?? '').trim()
  if (!name || !table) return null
  return {
    schema: String(row.schema ?? 'public'),
    table,
    name,
    command: String(row.command ?? 'ALL'),
    roles: strings(row.roles),
    usingExpression: row.usingExpression === null || row.using_expression === null ? null : String(row.usingExpression ?? row.using_expression ?? '') || null,
    checkExpression: row.checkExpression === null || row.check_expression === null ? null : String(row.checkExpression ?? row.check_expression ?? '') || null,
  }
}

function parseFunction(value: unknown): DatabaseFunction | null {
  const row = object(value)
  const name = String(row.name ?? '').trim()
  if (!name) return null
  return {
    schema: String(row.schema ?? 'public'),
    name,
    identityArguments: String(row.identityArguments ?? row.identity_arguments ?? ''),
    securityDefiner: Boolean(row.securityDefiner ?? row.security_definer),
    volatility: String(row.volatility ?? ''),
  }
}

export async function loadDatabaseAuthoritySnapshot(client: AdminClient): Promise<DatabaseAuthoritySnapshot> {
  const { data, error } = await client.rpc('access_governance_introspect_authority')
  if (error) throw new Error(`Database authority introspection failed: ${error.message}`)
  const payload = object(data)
  return {
    generatedAt: String(payload.generatedAt ?? payload.generated_at ?? new Date().toISOString()),
    tables: (Array.isArray(payload.tables) ? payload.tables : []).map(parseTable).filter((item): item is DatabaseTable => Boolean(item)),
    policies: (Array.isArray(payload.policies) ? payload.policies : []).map(parsePolicy).filter((item): item is DatabasePolicy => Boolean(item)),
    functions: (Array.isArray(payload.functions) ? payload.functions : []).map(parseFunction).filter((item): item is DatabaseFunction => Boolean(item)),
  }
}

function modelsForTable(table: DatabaseTable) {
  const text = `${table.name} ${table.columns.map((column) => column.name).join(' ')}`.toLowerCase()
  const models = new Set<AuthorityModel>()
  if (/member|membership|actor_role|user_role/.test(text)) models.add('MEMBERSHIP_AND_ROLE')
  if (/role/.test(text) && /permission|grant|capability/.test(text)) models.add('NATIVE_RBAC')
  if (/permission|grant|capability/.test(text)) models.add('DIRECT_PERMISSION_ARRAY')
  if (/entitlement|subscription|feature_flag|plan_key/.test(text)) models.add('ENTITLEMENT_BASED')
  if (/tenant_id/.test(text)) models.add('TENANT_MEMBERSHIP')
  if (/organization_id|organisation_id|school_id/.test(text)) models.add('ORGANIZATION_MEMBERSHIP')
  if (/workspace_id|workspace_key/.test(text)) models.add('WORKSPACE_MEMBERSHIP')
  if (/resource_id|owner_id|assigned_to/.test(text)) models.add('RESOURCE_ACL')
  if (table.rlsEnabled) models.add('RLS_ENFORCED')
  return [...models]
}

function nodeTypeForTable(table: DatabaseTable): UniversalTopologyNode['nodeType'] {
  const text = table.name.toLowerCase()
  if (/member|membership|actor_role|user_role/.test(text)) return 'membership_authority'
  if (/entitlement|feature_flag|subscription/.test(text)) return 'entitlement'
  if (/audit|event|ledger|history/.test(text)) return 'audit_authority'
  if (/cache|version/.test(text)) return 'cache_authority'
  return 'database_table'
}

function applicationHint(table: DatabaseTable) {
  const segments = table.name.split('_').filter(Boolean)
  const authorityIndex = segments.findIndex((segment) => ['membership', 'memberships', 'role', 'roles', 'permission', 'permissions', 'grant', 'grants', 'entitlement', 'entitlements', 'audit', 'logs'].includes(segment))
  const prefix = authorityIndex > 0 ? segments.slice(0, authorityIndex) : segments.slice(0, Math.min(3, segments.length))
  return prefix.join('_') || 'database'
}

export function topologyFromDatabaseSnapshot(scanId: string, snapshot: DatabaseAuthoritySnapshot) {
  const nodes: UniversalTopologyNode[] = []
  const edges: UniversalTopologyEdge[] = []
  const evidence: UniversalEvidence[] = []

  for (const table of snapshot.tables) {
    const canonical = `${table.schema}.${table.name}`
    const tableNodeKey = stableKey('node', 'database_table', canonical)
    const models = modelsForTable(table)
    const score = models.length ? 0.9 : 0.72
    nodes.push({
      nodeKey: tableNodeKey,
      scanId,
      nodeType: nodeTypeForTable(table),
      canonicalKey: canonical,
      displayName: table.name,
      applicationKey: applicationHint(table),
      moduleKey: applicationHint(table),
      workspaceKey: null,
      authorityModel: models.length > 1 ? 'HYBRID' : models[0] ?? null,
      riskLevel: /(permission|role|member|grant|entitlement|audit|credential)/i.test(table.name) ? 'high' : 'controlled',
      confidence: score >= 0.85 ? 'high' : 'probable',
      confidenceScore: score,
      metadata: {
        schema: table.schema,
        rlsEnabled: table.rlsEnabled,
        columns: table.columns.map((column) => column.name),
        primaryKey: table.primaryKey,
        uniqueConstraints: table.uniqueConstraints,
        authorityModels: models,
      },
    })
    evidence.push({
      evidenceKey: stableKey('evidence', 'database_metadata', canonical),
      scanId,
      kind: 'database_metadata',
      subjectKey: tableNodeKey,
      objectKey: null,
      filePath: null,
      lineStart: null,
      lineEnd: null,
      databaseObject: canonical,
      summary: `Live metadata confirms ${canonical} with ${table.columns.length} columns${table.rlsEnabled ? ' and RLS enabled' : ''}.`,
      excerpt: null,
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: { authorityModels: models, primaryKey: table.primaryKey },
    })
    for (const foreignKey of table.foreignKeys) {
      const target = `${foreignKey.foreignSchema}.${foreignKey.foreignTable}`
      const targetNodeKey = stableKey('node', 'database_table', target)
      edges.push({
        edgeKey: stableKey('edge', tableNodeKey, targetNodeKey, foreignKey.column),
        scanId,
        sourceNodeKey: tableNodeKey,
        targetNodeKey,
        edgeType: 'maps_to',
        confidence: 'confirmed',
        confidenceScore: 1,
        metadata: { column: foreignKey.column, foreignColumn: foreignKey.foreignColumn },
      })
    }
  }

  for (const policy of snapshot.policies) {
    const canonical = `${policy.schema}.${policy.table}:${policy.name}`
    const policyNodeKey = stableKey('node', 'rls_policy', canonical)
    const tableNodeKey = stableKey('node', 'database_table', `${policy.schema}.${policy.table}`)
    nodes.push({
      nodeKey: policyNodeKey,
      scanId,
      nodeType: 'rls_policy',
      canonicalKey: canonical,
      displayName: policy.name,
      applicationKey: policy.table.split('_').slice(0, 3).join('_'),
      moduleKey: policy.table.split('_').slice(0, 3).join('_'),
      workspaceKey: null,
      authorityModel: 'RLS_ENFORCED',
      riskLevel: 'high',
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: {
        table: `${policy.schema}.${policy.table}`,
        command: policy.command,
        roles: policy.roles,
        usingExpression: policy.usingExpression,
        checkExpression: policy.checkExpression,
      },
    })
    edges.push({
      edgeKey: stableKey('edge', policyNodeKey, tableNodeKey, 'enforces'),
      scanId,
      sourceNodeKey: policyNodeKey,
      targetNodeKey: tableNodeKey,
      edgeType: 'enforces',
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: {},
    })
    evidence.push({
      evidenceKey: stableKey('evidence', 'database_policy', canonical),
      scanId,
      kind: 'database_policy',
      subjectKey: policyNodeKey,
      objectKey: tableNodeKey,
      filePath: null,
      lineStart: null,
      lineEnd: null,
      databaseObject: `${policy.schema}.${policy.table}`,
      summary: `Live RLS policy ${policy.name} applies ${policy.command} to ${policy.table}.`,
      excerpt: policy.usingExpression,
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: { roles: policy.roles, checkExpression: policy.checkExpression },
    })
  }

  for (const fn of snapshot.functions) {
    if (!/(auth|access|permission|role|membership|grant|entitlement|audit|cache|session|tenant|organization|workspace)/i.test(fn.name)) continue
    const canonical = `${fn.schema}.${fn.name}(${fn.identityArguments})`
    const functionNodeKey = stableKey('node', 'database_function', canonical)
    nodes.push({
      nodeKey: functionNodeKey,
      scanId,
      nodeType: /audit|event|ledger/i.test(fn.name) ? 'audit_authority' : /cache|version/i.test(fn.name) ? 'cache_authority' : 'database_function',
      canonicalKey: canonical,
      displayName: fn.name,
      applicationKey: fn.name.split('_').slice(0, 3).join('_'),
      moduleKey: fn.name.split('_').slice(0, 3).join('_'),
      workspaceKey: null,
      authorityModel: 'HYBRID',
      riskLevel: fn.securityDefiner ? 'critical' : 'high',
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: { securityDefiner: fn.securityDefiner, volatility: fn.volatility },
    })
    evidence.push({
      evidenceKey: stableKey('evidence', 'database_function', canonical),
      scanId,
      kind: 'database_function',
      subjectKey: functionNodeKey,
      objectKey: null,
      filePath: null,
      lineStart: null,
      lineEnd: null,
      databaseObject: canonical,
      summary: `Live function ${canonical} participates in the authorization estate.`,
      excerpt: null,
      confidence: 'confirmed',
      confidenceScore: 1,
      metadata: { securityDefiner: fn.securityDefiner, volatility: fn.volatility },
    })
  }

  return { nodes, edges, evidence }
}
