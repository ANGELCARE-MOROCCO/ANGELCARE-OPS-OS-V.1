import path from 'node:path'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'

type Audience = 'public' | 'private' | 'admin' | 'shared'
const SCRIPT_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']

function entryAudience(relative: string): Exclude<Audience, 'shared'> | null {
  const normalized = relative.split(path.sep).join('/')
  if (!normalized.startsWith('app/angelcare-marketplace/') && !normalized.startsWith('app/api/angelcare-marketplace/')) return null
  if (normalized.includes('/admin/')) return 'admin'
  if (normalized.includes('/account/') || normalized.includes('/customer/') || normalized.includes('/workspace/') || normalized.includes('/private/')) return 'private'
  return 'public'
}

function resolveImport(importer: string, specifier: string, appRoot: string, files: Set<string>): string | null {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null
  const base = specifier.startsWith('@/') ? path.join(appRoot, specifier.slice(2)) : path.resolve(path.dirname(importer), specifier)
  const candidates = [base, ...SCRIPT_EXTENSIONS.map((extension) => `${base}${extension}`), ...SCRIPT_EXTENSIONS.map((extension) => path.join(base, `index${extension}`))]
  return candidates.find((candidate) => files.has(path.normalize(candidate))) || null
}

export async function buildSourceAudienceMap(filePaths: string[], appRoot: string): Promise<Map<string, Audience>> {
  const scriptFiles = filePaths.filter((file) => SCRIPT_EXTENSIONS.includes(path.extname(file))).map(path.normalize)
  const fileSet = new Set(scriptFiles)
  const graph = new Map<string, string[]>()
  await Promise.all(scriptFiles.map(async (file) => {
    const source = await readFile(file, 'utf8')
    const imports = ts.preProcessFile(source, true, true).importedFiles
      .map((item) => resolveImport(file, item.fileName, appRoot, fileSet))
      .filter((item): item is string => Boolean(item))
    graph.set(file, [...new Set(imports)])
  }))

  const audiences = new Map<string, Set<Exclude<Audience, 'shared'>>>()
  for (const entry of scriptFiles) {
    const audience = entryAudience(path.relative(appRoot, entry))
    if (!audience) continue
    const queue = [entry]
    const visited = new Set<string>()
    while (queue.length) {
      const current = queue.pop()!
      if (visited.has(current)) continue
      visited.add(current)
      const currentAudiences = audiences.get(current) || new Set<Exclude<Audience, 'shared'>>()
      currentAudiences.add(audience)
      audiences.set(current, currentAudiences)
      queue.push(...(graph.get(current) || []))
    }
  }

  return new Map([...audiences].map(([file, scopes]) => [file, scopes.size === 1 ? [...scopes][0] : 'shared']))
}
