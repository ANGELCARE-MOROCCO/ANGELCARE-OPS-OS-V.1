import 'server-only'

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import type {
  AuthorityModel,
  EvidenceConfidence,
  JsonObject,
  JsonValue,
  UniversalAuthorityManifest,
  UniversalEvidence,
  UniversalSourceFile,
  UniversalTopologyEdge,
  UniversalTopologyNode,
} from './types'

export type SourceAnalysisResult = {
  evidence: UniversalEvidence[]
  nodes: UniversalTopologyNode[]
  edges: UniversalTopologyEdge[]
}

const AUTHENTICATION_PATTERN = /(auth(?:entication)?|session|current.*user|current.*actor|require.*user|require.*session|logged.*in)/i
const AUTHORIZATION_PATTERN = /(authori[sz]e|permission|access|guard|policy|role|entitlement|membership|capability|grant|scope)/i
const TENANT_PATTERN = /(tenant|school|organization|organisation|workspace|account.*scope)/i
const OWNERSHIP_PATTERN = /(owner|ownership|created.*by|assigned.*to|actor.*id|user.*id)/i
const FEATURE_PATTERN = /(feature|flag|entitlement|subscription|plan.*access)/i
const CACHE_PATTERN = /(cache|memo|unstable_cache|revalidate|grant.*version|session.*version)/i
const AUDIT_PATTERN = /(audit|event|ledger|history|trace)/i
const ACTION_PATTERN = /(view|read|list|create|write|update|edit|delete|remove|manage|approve|reject|execute|publish|export|import|assign|transition|admin|access)/i
const ROLE_PATTERN = /(admin|manager|owner|director|viewer|operator|auditor|agent|coordinator|approver|editor|member|staff|ceo|root)/i
const ROUTE_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

function stableKey(prefix: string, ...parts: Array<string | null | undefined>) {
  const canonical = parts.map((part) => String(part ?? '').trim()).join('|')
  return `${prefix}:${createHash('sha256').update(canonical).digest('hex').slice(0, 24)}`
}

function jsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((item) => jsonValue(item))
  if (value && typeof value === 'object') {
    const result: JsonObject = {}
    for (const [key, child] of Object.entries(value)) result[key] = jsonValue(child)
    return result
  }
  return String(value ?? '')
}

function metadata(value: Record<string, unknown>): JsonObject {
  const result: JsonObject = {}
  for (const [key, child] of Object.entries(value)) result[key] = jsonValue(child)
  return result
}

function visiblePathSegments(relativePath: string) {
  const normalized = relativePath.split('\\').join('/')
  const segments = normalized.split('/').filter(Boolean)
  const appIndex = segments.indexOf('app')
  if (appIndex >= 0) {
    return segments.slice(appIndex + 1, -1).filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')) && !segment.startsWith('@'))
  }
  return segments.slice(0, -1)
}

function routeIdentity(relativePath: string) {
  const segments = visiblePathSegments(relativePath)
  const api = segments[0] === 'api'
  const visible = api ? segments.slice(1) : segments
  const applicationKey = visible[0] || 'application-root'
  const workspaceKey = visible[1] || null
  const route = `/${segments.join('/')}`.replace(/\/+/g, '/') || '/'
  return { api, segments, visible, applicationKey, moduleKey: applicationKey, workspaceKey, route }
}

function lineRange(sourceFile: ts.SourceFile, node: ts.Node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())
  return { lineStart: start.line + 1, lineEnd: end.line + 1 }
}

function confidence(score: number): EvidenceConfidence {
  if (score >= 0.98) return 'confirmed'
  if (score >= 0.85) return 'high'
  if (score >= 0.65) return 'probable'
  if (score >= 0.4) return 'ambiguous'
  return 'unresolved'
}

function riskForPath(relativePath: string): UniversalTopologyNode['riskLevel'] {
  const lowered = relativePath.toLowerCase()
  if (/(delete|security|permission|governance|admin|payment|payroll|billing|credential|secret|execute)/.test(lowered)) return 'high'
  if (/(settings|approval|publish|audit|role|access)/.test(lowered)) return 'controlled'
  return 'low'
}

function node(input: Omit<UniversalTopologyNode, 'confidence' | 'confidenceScore' | 'riskLevel'> & { confidenceScore?: number; riskLevel?: UniversalTopologyNode['riskLevel'] }) {
  const score = input.confidenceScore ?? 0.82
  return {
    ...input,
    riskLevel: input.riskLevel ?? 'low',
    confidence: confidence(score),
    confidenceScore: score,
  } satisfies UniversalTopologyNode
}

function edge(input: Omit<UniversalTopologyEdge, 'confidence' | 'confidenceScore'> & { confidenceScore?: number }) {
  const score = input.confidenceScore ?? 0.82
  return { ...input, confidence: confidence(score), confidenceScore: score } satisfies UniversalTopologyEdge
}

function evidence(input: Omit<UniversalEvidence, 'confidence' | 'confidenceScore'> & { confidenceScore?: number }) {
  const score = input.confidenceScore ?? 0.82
  return { ...input, confidence: confidence(score), confidenceScore: score } satisfies UniversalEvidence
}

function callName(expression: ts.Expression, sourceFile: ts.SourceFile) {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.getText(sourceFile)
  if (ts.isElementAccessExpression(expression)) return expression.getText(sourceFile)
  return expression.getText(sourceFile)
}

function literalStrings(node: ts.Node) {
  const values: string[] = []
  function visit(current: ts.Node) {
    if (ts.isStringLiteralLike(current)) values.push(current.text)
    ts.forEachChild(current, visit)
  }
  visit(node)
  return values
}

function permissionLiteral(value: string) {
  const normalized = value.trim()
  if (normalized.length < 3 || normalized.length > 160) return false
  if (!/^[a-z0-9][a-z0-9._:/-]+$/i.test(normalized)) return false
  return ACTION_PATTERN.test(normalized) && (normalized.includes('.') || normalized.includes(':') || normalized.includes('/'))
}

function isServerActionFile(sourceFile: ts.SourceFile) {
  return sourceFile.statements.some((statement) => ts.isExpressionStatement(statement)
    && ts.isStringLiteral(statement.expression)
    && statement.expression.text === 'use server')
}

function exportedName(nodeValue: ts.Node) {
  if (ts.isFunctionDeclaration(nodeValue) && nodeValue.name) return nodeValue.name.text
  if (ts.isVariableStatement(nodeValue)) {
    const declaration = nodeValue.declarationList.declarations[0]
    return declaration && ts.isIdentifier(declaration.name) ? declaration.name.text : null
  }
  return null
}

function isExported(nodeValue: ts.Node) {
  const modifiers = ts.canHaveModifiers(nodeValue) ? ts.getModifiers(nodeValue) : undefined
  return Boolean(modifiers?.some((modifier: ts.Modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword))
}

function authorityModelsForCall(name: string): AuthorityModel[] {
  const models = new Set<AuthorityModel>()
  if (AUTHENTICATION_PATTERN.test(name)) models.add('AUTHENTICATION_ONLY')
  if (/role/i.test(name)) models.add('NATIVE_RBAC')
  if (/permission|grant|capability/i.test(name)) models.add('DIRECT_PERMISSION_ARRAY')
  if (/membership/i.test(name)) models.add('MEMBERSHIP_AND_ROLE')
  if (/entitlement|subscription/i.test(name)) models.add('ENTITLEMENT_BASED')
  if (TENANT_PATTERN.test(name)) models.add('TENANT_MEMBERSHIP')
  if (OWNERSHIP_PATTERN.test(name)) models.add('OWNERSHIP_BASED')
  if (/policy|rls/i.test(name)) models.add('RLS_ENFORCED')
  if (FEATURE_PATTERN.test(name)) models.add('FEATURE_FLAG_GATED')
  return [...models]
}

export async function analyzeUniversalSourceFile(scanId: string, file: UniversalSourceFile): Promise<SourceAnalysisResult> {
  const content = await fs.readFile(file.absolutePath, 'utf8')
  if (file.kind === 'sql') return analyzeSqlSource(scanId, file, content)
  if (!['typescript', 'javascript'].includes(file.kind)) return analyzeConfigurationSource(scanId, file, content)
  return analyzeTypedSource(scanId, file, content)
}

function analyzeTypedSource(scanId: string, file: UniversalSourceFile, content: string): SourceAnalysisResult {
  const sourceFile = ts.createSourceFile(file.relativePath, content, ts.ScriptTarget.Latest, true,
    file.extension === '.tsx' || file.extension === '.jsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const identity = routeIdentity(file.relativePath)
  const evidenceRows: UniversalEvidence[] = []
  const nodes: UniversalTopologyNode[] = []
  const edges: UniversalTopologyEdge[] = []
  const seenNodes = new Set<string>()
  const seenEdges = new Set<string>()
  const fileNodeKey = stableKey('node', 'source_file', file.relativePath)

  function addNode(value: UniversalTopologyNode) {
    if (seenNodes.has(value.nodeKey)) return
    seenNodes.add(value.nodeKey)
    nodes.push(value)
  }
  function addEdge(value: UniversalTopologyEdge) {
    if (seenEdges.has(value.edgeKey)) return
    seenEdges.add(value.edgeKey)
    edges.push(value)
  }

  addNode(node({
    nodeKey: fileNodeKey,
    scanId,
    nodeType: 'source_file',
    canonicalKey: file.relativePath,
    displayName: path.basename(file.relativePath),
    applicationKey: identity.applicationKey,
    moduleKey: identity.moduleKey,
    workspaceKey: identity.workspaceKey,
    authorityModel: null,
    riskLevel: riskForPath(file.relativePath),
    confidenceScore: 1,
    metadata: metadata({ checksum: file.checksum, sizeBytes: file.sizeBytes, extension: file.extension }),
  }))

  let operationNodeKey: string | null = null
  const basename = path.basename(file.relativePath)
  const routeSurface = /^(page|layout|route)\.(?:[cm]?[jt]sx?)$/.test(basename) || basename === 'middleware.ts' || basename === 'middleware.js'
  if (routeSurface) {
    const nodeType = identity.api || basename.startsWith('route.') ? 'api_operation' : basename.startsWith('page.') ? 'page' : 'workspace'
    operationNodeKey = stableKey('node', nodeType, file.relativePath, identity.route)
    addNode(node({
      nodeKey: operationNodeKey,
      scanId,
      nodeType,
      canonicalKey: identity.route,
      displayName: identity.route,
      applicationKey: identity.applicationKey,
      moduleKey: identity.moduleKey,
      workspaceKey: identity.workspaceKey,
      authorityModel: null,
      riskLevel: riskForPath(file.relativePath),
      confidenceScore: 0.99,
      metadata: metadata({ sourcePath: file.relativePath, api: identity.api }),
    }))
    addEdge(edge({
      edgeKey: stableKey('edge', fileNodeKey, operationNodeKey, 'contains'),
      scanId,
      sourceNodeKey: fileNodeKey,
      targetNodeKey: operationNodeKey,
      edgeType: 'contains',
      confidenceScore: 1,
      metadata: {},
    }))
  }

  const serverActionFile = isServerActionFile(sourceFile)
  const encounteredGuards = new Set<string>()
  const encounteredModels = new Set<AuthorityModel>()

  function visit(current: ts.Node) {
    if (ts.isImportDeclaration(current) && ts.isStringLiteral(current.moduleSpecifier)) {
      const imported = current.moduleSpecifier.text
      const importedNodeKey = stableKey('node', 'source_file', imported)
      addNode(node({
        nodeKey: importedNodeKey,
        scanId,
        nodeType: 'source_file',
        canonicalKey: imported,
        displayName: imported,
        applicationKey: identity.applicationKey,
        moduleKey: identity.moduleKey,
        workspaceKey: identity.workspaceKey,
        authorityModel: null,
        confidenceScore: 0.7,
        metadata: metadata({ unresolvedImport: true }),
      }))
      addEdge(edge({
        edgeKey: stableKey('edge', fileNodeKey, importedNodeKey, 'imports'),
        scanId,
        sourceNodeKey: fileNodeKey,
        targetNodeKey: importedNodeKey,
        edgeType: 'imports',
        confidenceScore: 0.98,
        metadata: {},
      }))
    }

    if (serverActionFile && isExported(current)) {
      const name = exportedName(current)
      if (name) {
        const actionNodeKey = stableKey('node', 'server_action', file.relativePath, name)
        addNode(node({
          nodeKey: actionNodeKey,
          scanId,
          nodeType: 'server_action',
          canonicalKey: `${file.relativePath}#${name}`,
          displayName: name,
          applicationKey: identity.applicationKey,
          moduleKey: identity.moduleKey,
          workspaceKey: identity.workspaceKey,
          authorityModel: null,
          riskLevel: riskForPath(file.relativePath),
          confidenceScore: 0.98,
          metadata: metadata({ sourcePath: file.relativePath }),
        }))
        addEdge(edge({
          edgeKey: stableKey('edge', fileNodeKey, actionNodeKey, 'contains'),
          scanId,
          sourceNodeKey: fileNodeKey,
          targetNodeKey: actionNodeKey,
          edgeType: 'contains',
          confidenceScore: 1,
          metadata: {},
        }))
      }
    }

    if (ts.isFunctionDeclaration(current) && current.name && isExported(current) && ROUTE_METHODS.has(current.name.text)) {
      const methodNodeKey = stableKey('node', 'api_operation', file.relativePath, current.name.text)
      addNode(node({
        nodeKey: methodNodeKey,
        scanId,
        nodeType: 'api_operation',
        canonicalKey: `${current.name.text} ${identity.route}`,
        displayName: `${current.name.text} ${identity.route}`,
        applicationKey: identity.applicationKey,
        moduleKey: identity.moduleKey,
        workspaceKey: identity.workspaceKey,
        authorityModel: null,
        riskLevel: current.name.text === 'GET' ? riskForPath(file.relativePath) : 'high',
        confidenceScore: 1,
        metadata: metadata({ method: current.name.text, route: identity.route, sourcePath: file.relativePath }),
      }))
      operationNodeKey = methodNodeKey
    }

    if (ts.isCallExpression(current)) {
      const name = callName(current.expression, sourceFile)
      const authn = AUTHENTICATION_PATTERN.test(name)
      const authz = AUTHORIZATION_PATTERN.test(name)
      if (authn || authz || TENANT_PATTERN.test(name) || OWNERSHIP_PATTERN.test(name) || FEATURE_PATTERN.test(name)) {
        const guardType = authz ? 'authorization_guard' : 'authentication_guard'
        const guardNodeKey = stableKey('node', guardType, file.relativePath, name)
        const models = authorityModelsForCall(name)
        models.forEach((model) => encounteredModels.add(model))
        encounteredGuards.add(name)
        addNode(node({
          nodeKey: guardNodeKey,
          scanId,
          nodeType: guardType,
          canonicalKey: name,
          displayName: name,
          applicationKey: identity.applicationKey,
          moduleKey: identity.moduleKey,
          workspaceKey: identity.workspaceKey,
          authorityModel: models[0] ?? (authn ? 'AUTHENTICATION_ONLY' : 'UNKNOWN'),
          riskLevel: 'controlled',
          confidenceScore: authz ? 0.88 : 0.8,
          metadata: metadata({ models }),
        }))
        addEdge(edge({
          edgeKey: stableKey('edge', operationNodeKey ?? fileNodeKey, guardNodeKey, 'calls'),
          scanId,
          sourceNodeKey: operationNodeKey ?? fileNodeKey,
          targetNodeKey: guardNodeKey,
          edgeType: 'calls',
          confidenceScore: 0.9,
          metadata: {},
        }))
        const range = lineRange(sourceFile, current)
        const evidenceKey = stableKey('evidence', file.relativePath, String(range.lineStart), name)
        evidenceRows.push(evidence({
          evidenceKey,
          scanId,
          kind: 'source_ast',
          subjectKey: operationNodeKey ?? fileNodeKey,
          objectKey: guardNodeKey,
          filePath: file.relativePath,
          lineStart: range.lineStart,
          lineEnd: range.lineEnd,
          databaseObject: null,
          summary: `${authz ? 'Authorization' : 'Authentication'} helper ${name} is invoked.`,
          excerpt: current.getText(sourceFile).slice(0, 500),
          confidenceScore: authz ? 0.9 : 0.82,
          metadata: metadata({ helper: name, models }),
        }))
        addEdge(edge({
          edgeKey: stableKey('edge', guardNodeKey, fileNodeKey, 'evidenced_by', evidenceKey),
          scanId,
          sourceNodeKey: guardNodeKey,
          targetNodeKey: fileNodeKey,
          edgeType: 'evidenced_by',
          confidenceScore: 1,
          metadata: metadata({ evidenceKey }),
        }))

        const literals = current.arguments.flatMap((argument) => literalStrings(argument))
        for (const literal of literals) {
          if (permissionLiteral(literal)) {
            const permissionNodeKey = stableKey('node', 'permission', literal)
            addNode(node({
              nodeKey: permissionNodeKey,
              scanId,
              nodeType: 'permission',
              canonicalKey: literal,
              displayName: literal,
              applicationKey: identity.applicationKey,
              moduleKey: identity.moduleKey,
              workspaceKey: identity.workspaceKey,
              authorityModel: 'DIRECT_PERMISSION_ARRAY',
              riskLevel: ACTION_PATTERN.test(literal) && /(delete|admin|manage|execute|approve)/i.test(literal) ? 'high' : 'controlled',
              confidenceScore: 0.94,
              metadata: metadata({ namespace: literal.split(/[.:/]/)[0] }),
            }))
            addEdge(edge({
              edgeKey: stableKey('edge', guardNodeKey, permissionNodeKey, 'requires'),
              scanId,
              sourceNodeKey: guardNodeKey,
              targetNodeKey: permissionNodeKey,
              edgeType: 'requires',
              confidenceScore: 0.94,
              metadata: {},
            }))
            evidenceRows.push(evidence({
              evidenceKey: stableKey('evidence', evidenceKey, literal),
              scanId,
              kind: 'source_literal',
              subjectKey: guardNodeKey,
              objectKey: permissionNodeKey,
              filePath: file.relativePath,
              lineStart: range.lineStart,
              lineEnd: range.lineEnd,
              databaseObject: null,
              summary: `Permission literal ${literal} is required by ${name}.`,
              excerpt: literal,
              confidenceScore: 0.96,
              metadata: metadata({ permission: literal }),
            }))
          } else if (/role/i.test(name) && ROLE_PATTERN.test(literal)) {
            const roleNodeKey = stableKey('node', 'role', literal)
            addNode(node({
              nodeKey: roleNodeKey,
              scanId,
              nodeType: 'role',
              canonicalKey: literal,
              displayName: literal,
              applicationKey: identity.applicationKey,
              moduleKey: identity.moduleKey,
              workspaceKey: identity.workspaceKey,
              authorityModel: 'NATIVE_RBAC',
              riskLevel: ROLE_PATTERN.test(literal) && /(admin|owner|root|ceo)/i.test(literal) ? 'high' : 'controlled',
              confidenceScore: 0.9,
              metadata: {},
            }))
            addEdge(edge({
              edgeKey: stableKey('edge', guardNodeKey, roleNodeKey, 'requires'),
              scanId,
              sourceNodeKey: guardNodeKey,
              targetNodeKey: roleNodeKey,
              edgeType: 'requires',
              confidenceScore: 0.9,
              metadata: {},
            }))
          }
        }
      }

      if (CACHE_PATTERN.test(name)) {
        encounteredModels.add('HYBRID')
        evidenceRows.push(evidence({
          evidenceKey: stableKey('evidence', file.relativePath, 'cache', name, String(current.pos)),
          scanId,
          kind: 'source_ast',
          subjectKey: operationNodeKey ?? fileNodeKey,
          objectKey: null,
          filePath: file.relativePath,
          ...lineRange(sourceFile, current),
          databaseObject: null,
          summary: `Authorization-sensitive cache primitive ${name} requires scope and grant-version review.`,
          excerpt: current.getText(sourceFile).slice(0, 400),
          confidenceScore: 0.72,
          metadata: metadata({ category: 'cache_authority', helper: name }),
        }))
      }
    }

    ts.forEachChild(current, visit)
  }

  visit(sourceFile)

  if (operationNodeKey && encounteredGuards.size === 0) {
    evidenceRows.push(evidence({
      evidenceKey: stableKey('evidence', file.relativePath, 'unprotected-operation'),
      scanId,
      kind: 'source_ast',
      subjectKey: operationNodeKey,
      objectKey: null,
      filePath: file.relativePath,
      lineStart: 1,
      lineEnd: Math.min(20, sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1),
      databaseObject: null,
      summary: 'No recognized authentication or authorization guard was found in this operation source.',
      excerpt: null,
      confidenceScore: 0.58,
      metadata: metadata({ category: 'unprotected_candidate', route: identity.route }),
    }))
  }

  if (operationNodeKey && encounteredModels.size > 1) {
    const currentNode = nodes.find((item) => item.nodeKey === operationNodeKey)
    if (currentNode) {
      currentNode.authorityModel = 'HYBRID'
      currentNode.metadata = metadata({ ...currentNode.metadata, authorityModels: [...encounteredModels] })
    }
  } else if (operationNodeKey && encounteredModels.size === 1) {
    const currentNode = nodes.find((item) => item.nodeKey === operationNodeKey)
    if (currentNode) currentNode.authorityModel = [...encounteredModels][0]
  }

  return { evidence: evidenceRows, nodes, edges }
}

function analyzeConfigurationSource(scanId: string, file: UniversalSourceFile, content: string): SourceAnalysisResult {
  const identity = routeIdentity(file.relativePath)
  const fileNodeKey = stableKey('node', 'source_file', file.relativePath)
  const evidenceRows: UniversalEvidence[] = []
  if (AUTHORIZATION_PATTERN.test(content)) {
    evidenceRows.push(evidence({
      evidenceKey: stableKey('evidence', file.relativePath, 'configuration-authority'),
      scanId,
      kind: 'source_literal',
      subjectKey: fileNodeKey,
      objectKey: null,
      filePath: file.relativePath,
      lineStart: 1,
      lineEnd: Math.min(content.split('\n').length, 200),
      databaseObject: null,
      summary: 'Configuration source contains authorization-related declarations.',
      excerpt: null,
      confidenceScore: 0.56,
      metadata: metadata({ category: 'configuration_authority' }),
    }))
  }
  return {
    evidence: evidenceRows,
    nodes: [node({
      nodeKey: fileNodeKey,
      scanId,
      nodeType: 'source_file',
      canonicalKey: file.relativePath,
      displayName: path.basename(file.relativePath),
      applicationKey: identity.applicationKey,
      moduleKey: identity.moduleKey,
      workspaceKey: identity.workspaceKey,
      authorityModel: null,
      confidenceScore: 1,
      metadata: metadata({ checksum: file.checksum, kind: file.kind }),
    })],
    edges: [],
  }
}

function sqlColumns(body: string) {
  return body
    .split(',')
    .map((entry) => entry.trim())
    .map((entry) => entry.match(/^"?([a-z_][a-z0-9_]*)"?\s+/i)?.[1] ?? null)
    .filter((value): value is string => Boolean(value))
}

function classifySqlAuthority(name: string, columns: string[]) {
  const haystack = `${name} ${columns.join(' ')}`.toLowerCase()
  const models = new Set<AuthorityModel>()
  if (/membership|member/.test(haystack)) models.add('MEMBERSHIP_AND_ROLE')
  if (/role/.test(haystack) && /permission|grant/.test(haystack)) models.add('NATIVE_RBAC')
  if (/entitlement|subscription|feature_flag/.test(haystack)) models.add('ENTITLEMENT_BASED')
  if (/tenant/.test(haystack)) models.add('TENANT_MEMBERSHIP')
  if (/organization|organisation|school_id/.test(haystack)) models.add('ORGANIZATION_MEMBERSHIP')
  if (/workspace/.test(haystack)) models.add('WORKSPACE_MEMBERSHIP')
  if (/owner|ownership|resource_id/.test(haystack)) models.add('RESOURCE_ACL')
  if (/audit|event|ledger|history/.test(haystack)) models.add('HYBRID')
  return [...models]
}

function analyzeSqlSource(scanId: string, file: UniversalSourceFile, content: string): SourceAnalysisResult {
  const identity = routeIdentity(file.relativePath)
  const evidenceRows: UniversalEvidence[] = []
  const nodes: UniversalTopologyNode[] = []
  const edges: UniversalTopologyEdge[] = []
  const fileNodeKey = stableKey('node', 'source_file', file.relativePath)
  nodes.push(node({
    nodeKey: fileNodeKey,
    scanId,
    nodeType: 'source_file',
    canonicalKey: file.relativePath,
    displayName: path.basename(file.relativePath),
    applicationKey: identity.applicationKey,
    moduleKey: identity.moduleKey,
    workspaceKey: identity.workspaceKey,
    authorityModel: null,
    confidenceScore: 1,
    metadata: metadata({ checksum: file.checksum, kind: 'sql' }),
  }))

  const tablePattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(([\s\S]*?)\);/gi
  for (const match of content.matchAll(tablePattern)) {
    const tableName = match[1]
    const columns = sqlColumns(match[2])
    const models = classifySqlAuthority(tableName, columns)
    const tableNodeKey = stableKey('node', 'database_table', tableName)
    nodes.push(node({
      nodeKey: tableNodeKey,
      scanId,
      nodeType: models.includes('MEMBERSHIP_AND_ROLE') ? 'membership_authority' : models.includes('ENTITLEMENT_BASED') ? 'entitlement' : 'database_table',
      canonicalKey: `public.${tableName}`,
      displayName: tableName,
      applicationKey: identity.applicationKey,
      moduleKey: identity.moduleKey,
      workspaceKey: null,
      authorityModel: models.length > 1 ? 'HYBRID' : models[0] ?? null,
      riskLevel: /(permission|role|membership|grant|entitlement|credential|audit)/i.test(tableName) ? 'high' : 'controlled',
      confidenceScore: models.length ? 0.82 : 0.68,
      metadata: metadata({ columns, authorityModels: models }),
    }))
    edges.push(edge({
      edgeKey: stableKey('edge', fileNodeKey, tableNodeKey, 'contains'),
      scanId,
      sourceNodeKey: fileNodeKey,
      targetNodeKey: tableNodeKey,
      edgeType: 'contains',
      confidenceScore: 1,
      metadata: {},
    }))
    const before = content.slice(0, match.index ?? 0)
    const lineStart = before.split('\n').length
    evidenceRows.push(evidence({
      evidenceKey: stableKey('evidence', file.relativePath, tableName, 'table'),
      scanId,
      kind: 'sql_migration',
      subjectKey: tableNodeKey,
      objectKey: null,
      filePath: file.relativePath,
      lineStart,
      lineEnd: lineStart + match[0].split('\n').length - 1,
      databaseObject: `public.${tableName}`,
      summary: `Database table ${tableName} declares ${columns.length} detected columns.`,
      excerpt: match[0].slice(0, 700),
      confidenceScore: 0.98,
      metadata: metadata({ columns, authorityModels: models }),
    }))
  }

  const policyPattern = /create\s+policy\s+"?([^"\n]+)"?\s+on\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi
  for (const match of content.matchAll(policyPattern)) {
    const policyName = match[1].trim()
    const tableName = match[2]
    const policyNodeKey = stableKey('node', 'rls_policy', tableName, policyName)
    nodes.push(node({
      nodeKey: policyNodeKey,
      scanId,
      nodeType: 'rls_policy',
      canonicalKey: `${tableName}:${policyName}`,
      displayName: policyName,
      applicationKey: identity.applicationKey,
      moduleKey: identity.moduleKey,
      workspaceKey: null,
      authorityModel: 'RLS_ENFORCED',
      riskLevel: 'high',
      confidenceScore: 0.99,
      metadata: metadata({ tableName }),
    }))
    const tableNodeKey = stableKey('node', 'database_table', tableName)
    edges.push(edge({
      edgeKey: stableKey('edge', policyNodeKey, tableNodeKey, 'enforces'),
      scanId,
      sourceNodeKey: policyNodeKey,
      targetNodeKey: tableNodeKey,
      edgeType: 'enforces',
      confidenceScore: 0.99,
      metadata: {},
    }))
    evidenceRows.push(evidence({
      evidenceKey: stableKey('evidence', file.relativePath, tableName, policyName),
      scanId,
      kind: 'database_policy',
      subjectKey: policyNodeKey,
      objectKey: tableNodeKey,
      filePath: file.relativePath,
      lineStart: content.slice(0, match.index ?? 0).split('\n').length,
      lineEnd: content.slice(0, match.index ?? 0).split('\n').length,
      databaseObject: `public.${tableName}`,
      summary: `RLS policy ${policyName} protects ${tableName}.`,
      excerpt: match[0],
      confidenceScore: 0.99,
      metadata: {},
    }))
  }

  const functionPattern = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi
  for (const match of content.matchAll(functionPattern)) {
    const functionName = match[1]
    if (!AUTHORIZATION_PATTERN.test(functionName) && !AUDIT_PATTERN.test(functionName) && !CACHE_PATTERN.test(functionName)) continue
    const functionNodeKey = stableKey('node', 'database_function', functionName)
    nodes.push(node({
      nodeKey: functionNodeKey,
      scanId,
      nodeType: AUDIT_PATTERN.test(functionName) ? 'audit_authority' : CACHE_PATTERN.test(functionName) ? 'cache_authority' : 'database_function',
      canonicalKey: `public.${functionName}`,
      displayName: functionName,
      applicationKey: identity.applicationKey,
      moduleKey: identity.moduleKey,
      workspaceKey: null,
      authorityModel: 'HYBRID',
      riskLevel: 'high',
      confidenceScore: 0.9,
      metadata: {},
    }))
    evidenceRows.push(evidence({
      evidenceKey: stableKey('evidence', file.relativePath, functionName, 'function'),
      scanId,
      kind: 'database_function',
      subjectKey: functionNodeKey,
      objectKey: null,
      filePath: file.relativePath,
      lineStart: content.slice(0, match.index ?? 0).split('\n').length,
      lineEnd: content.slice(0, match.index ?? 0).split('\n').length,
      databaseObject: `public.${functionName}`,
      summary: `Database function ${functionName} participates in authorization, audit, or cache authority.`,
      excerpt: match[0],
      confidenceScore: 0.9,
      metadata: {},
    }))
  }

  return { evidence: evidenceRows, nodes, edges }
}

function firstObject(nodes: UniversalTopologyNode[], applicationKey: string, predicate: (nodeValue: UniversalTopologyNode) => boolean) {
  const match = nodes.find((item) => item.applicationKey === applicationKey && predicate(item))
  return match ? metadata({ nodeKey: match.nodeKey, canonicalKey: match.canonicalKey, displayName: match.displayName }) : {}
}

export function inferUniversalAuthorityManifests(scanId: string, nodes: UniversalTopologyNode[], evidenceRows: UniversalEvidence[]) {
  const applications = new Map<string, UniversalTopologyNode[]>()
  for (const nodeValue of nodes) {
    if (!nodeValue.applicationKey) continue
    const current = applications.get(nodeValue.applicationKey) ?? []
    current.push(nodeValue)
    applications.set(nodeValue.applicationKey, current)
  }

  const manifests: UniversalAuthorityManifest[] = []
  for (const [applicationKey, applicationNodes] of applications) {
    const models = new Set<AuthorityModel>()
    applicationNodes.forEach((item) => { if (item.authorityModel) models.add(item.authorityModel) })
    const applicationEvidence = evidenceRows.filter((item) => applicationNodes.some((nodeValue) => nodeValue.nodeKey === item.subjectKey || nodeValue.nodeKey === item.objectKey))
    const unresolved: string[] = []
    const hasProtectedOperation = applicationNodes.some((item) => ['api_operation', 'server_action', 'page'].includes(item.nodeType))
    const hasAuthorizationGuard = applicationNodes.some((item) => item.nodeType === 'authorization_guard')
    const hasMembership = applicationNodes.some((item) => item.nodeType === 'membership_authority')
    const hasRole = applicationNodes.some((item) => item.nodeType === 'role')
    const hasPermission = applicationNodes.some((item) => item.nodeType === 'permission')
    const hasRls = applicationNodes.some((item) => item.nodeType === 'rls_policy')

    if (hasProtectedOperation && !hasAuthorizationGuard) unresolved.push('No confirmed authorization guard chain was reconstructed for one or more operations.')
    if (hasMembership && !hasRole) unresolved.push('Membership authority was detected without a confirmed role authority.')
    if (hasRole && !hasPermission) unresolved.push('Role authority was detected without a confirmed permission relationship.')
    if (hasRls) models.add('RLS_ENFORCED')
    if (!models.size) models.add('UNKNOWN')
    if (models.size > 1) models.add('HYBRID')

    const scoreParts = [
      hasProtectedOperation ? 0.2 : 0.1,
      hasAuthorizationGuard ? 0.25 : 0,
      hasPermission ? 0.15 : 0,
      hasMembership || hasRole ? 0.15 : 0,
      hasRls ? 0.1 : 0,
      Math.min(0.15, applicationEvidence.length / 100),
    ]
    const score = Math.min(0.99, scoreParts.reduce((sum, item) => sum + item, 0))
    const manifestKey = stableKey('manifest', applicationKey)
    manifests.push({
      manifestKey,
      scanId,
      applicationKey,
      moduleKey: applicationKey,
      displayName: applicationKey.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
      authorityModels: [...models],
      identityAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'authentication_guard' || item.nodeType === 'identity'),
      globalAuthority: metadata({ source: 'access_resource_registry', inferred: true }),
      membershipAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'membership_authority'),
      roleAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'role'),
      permissionAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'permission'),
      tenantAuthority: firstObject(applicationNodes, applicationKey, (item) => item.authorityModel === 'TENANT_MEMBERSHIP'),
      organizationAuthority: firstObject(applicationNodes, applicationKey, (item) => item.authorityModel === 'ORGANIZATION_MEMBERSHIP'),
      workspaceAuthority: firstObject(applicationNodes, applicationKey, (item) => item.authorityModel === 'WORKSPACE_MEMBERSHIP'),
      entitlementAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'entitlement'),
      rlsAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'rls_policy'),
      revocationAuthority: firstObject(applicationNodes, applicationKey, (item) => item.canonicalKey.toLowerCase().includes('revok') || item.canonicalKey.toLowerCase().includes('deactiv')),
      auditAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'audit_authority'),
      cacheAuthority: firstObject(applicationNodes, applicationKey, (item) => item.nodeType === 'cache_authority'),
      mutationAuthority: {},
      evidenceKeys: applicationEvidence.map((item) => item.evidenceKey).slice(0, 500),
      confidence: confidence(score),
      confidenceScore: score,
      validationStatus: unresolved.length ? 'review_required' : 'generated',
      executable: false,
      unresolved: unresolved.length ? unresolved : ['Mutation and verification authority require explicit evidence-backed confirmation before execution.'],
      metadata: metadata({ nodeCount: applicationNodes.length, evidenceCount: applicationEvidence.length }),
    })
  }
  return manifests.sort((left, right) => left.applicationKey.localeCompare(right.applicationKey))
}
