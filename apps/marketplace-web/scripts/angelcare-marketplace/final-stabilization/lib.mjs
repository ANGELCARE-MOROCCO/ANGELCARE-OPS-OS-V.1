import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function projectRoot() {
  return process.cwd()
}

export function normalize(relative) {
  return relative.split(path.sep).join('/')
}

export function exists(relative, root = projectRoot()) {
  return fs.existsSync(path.join(root, relative))
}

export function read(relative, root = projectRoot()) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
}

export function walk(directory, options = {}) {
  const root = options.root || projectRoot()
  const absolute = path.isAbsolute(directory) ? directory : path.join(root, directory)
  const result = []
  if (!fs.existsSync(absolute)) return result
  const exclusions = new Set(options.exclude || [
    'node_modules', '.next', '.git', '.vercel', '.turbo',
    'coverage', 'dist', 'build', '.angelcare-marketplace-backups',
    '.angelcare_backups', 'backups', '_archive',
  ])
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && exclusions.has(entry.name)) continue
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) visit(target)
      else result.push(normalize(path.relative(root, target)))
    }
  }
  visit(absolute)
  return result
}

export function evidenceDirectory(name = 'marketplace-final-stabilization-evidence') {
  const root = projectRoot()
  const requested = process.env.MARKETPLACE_EVIDENCE_DIR
  const directory = requested
    ? path.resolve(requested)
    : path.join(root, name)
  fs.mkdirSync(directory, { recursive: true })
  return directory
}

export function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}

export function writeEvidence(baseName, jsonValue, markdown) {
  const directory = evidenceDirectory()
  const stamp = timestamp()
  const jsonPath = path.join(directory, `${baseName}_${stamp}.json`)
  const markdownPath = path.join(directory, `${baseName}_${stamp}.md`)
  const latestJson = path.join(directory, `${baseName}_LATEST.json`)
  const latestMarkdown = path.join(directory, `${baseName}_LATEST.md`)
  fs.writeFileSync(jsonPath, `${JSON.stringify(jsonValue, null, 2)}\n`, 'utf8')
  fs.writeFileSync(markdownPath, `${markdown.trim()}\n`, 'utf8')
  fs.copyFileSync(jsonPath, latestJson)
  fs.copyFileSync(markdownPath, latestMarkdown)
  return { jsonPath, markdownPath, latestJson, latestMarkdown }
}

export async function importProjectTypeScript(root = projectRoot()) {
  const modulePath = path.join(root, 'node_modules/typescript/lib/typescript.js')
  if (!fs.existsSync(modulePath)) {
    throw new Error(`Project-local TypeScript is unavailable: ${modulePath}`)
  }
  const imported = await import(pathToFileURL(modulePath).href)
  return imported.default || imported
}

export function nextRouteFromFile(relative) {
  const normalized = normalize(relative)
  const prefix = normalized.startsWith('app/') ? 'app/' : ''
  const withoutPrefix = normalized.slice(prefix.length)
  const parts = withoutPrefix.split('/')
  const terminal = parts.at(-1)
  if (!['page.tsx', 'page.ts', 'route.ts', 'route.js'].includes(terminal)) return null
  const routeParts = parts.slice(0, -1).filter((part) => !(part.startsWith('(') && part.endsWith(')')))
  return {
    route: `/${routeParts.join('/')}`.replace(/\/$/, '') || '/',
    kind: terminal.startsWith('page') ? 'page' : 'api',
  }
}

export function routeRegex(route) {
  const parts = route === '/' ? [] : route.replace(/^\//, '').split('/')
  let pattern = '^'
  for (const part of parts) {
    if (/^\[\[\.\.\..+\]\]$/.test(part)) {
      pattern += '(?:/.*)?'
    } else if (/^\[\.\.\..+\]$/.test(part)) {
      pattern += '/.+'
    } else if (/^\[.+\]$/.test(part)) {
      pattern += '/[^/]+'
    } else {
      pattern += `/${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
    }
  }
  pattern += '/?$'
  return new RegExp(pattern)
}

export function humanBytes(value) {
  if (!Number.isFinite(value)) return 'unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let amount = value
  let unit = 0
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024
    unit += 1
  }
  return `${amount.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function tempFile(prefix, extension = '.json') {
  return path.join(os.tmpdir(), `${prefix}-${process.pid}-${Date.now()}${extension}`)
}

export function markdownTable(headers, rows) {
  const escape = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>')
  const head = `| ${headers.map(escape).join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escape).join(' | ')} |`).join('\n')
  return `${head}\n${sep}${body ? `\n${body}` : ''}`
}
