import 'server-only'

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { UniversalSourceFile } from './types'

const EXCLUDED_DIRECTORIES = new Set([
  '.git', '.next', '.turbo', '.vercel', '.cache', 'node_modules', 'coverage', 'dist', 'out',
  'tmp', 'temp', '__pycache__', '.angelcare_backups', '_archive', 'backups', 'recovery',
])
const EXCLUDED_NAME_MARKERS = ['.before-', '.before_', '.backup.', '.orig.', '.bak.', '.copy.']
const ELIGIBLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sql', '.json', '.yml', '.yaml', '.css', '.scss',
])
const MAX_SOURCE_FILE_BYTES = 5_000_000

function isExcludedDirectory(name: string) {
  const lowered = name.toLowerCase()
  return EXCLUDED_DIRECTORIES.has(lowered) || lowered.endsWith('-backups') || lowered.endsWith('_backups')
}

function isExcludedFile(name: string) {
  const lowered = name.toLowerCase()
  return lowered.startsWith('.env')
    || lowered.endsWith('.log')
    || lowered.endsWith('.zip')
    || lowered.endsWith('.tsbuildinfo')
    || lowered.endsWith('.pem')
    || lowered.endsWith('.p12')
    || lowered.endsWith('.pfx')
    || lowered.endsWith('.key')
    || EXCLUDED_NAME_MARKERS.some((marker) => lowered.includes(marker))
}

export function resolveUniversalScannerRoot() {
  const configured = String(process.env.ANGELCARE_SCANNER_SOURCE_ROOT ?? '').trim()
  const candidate = configured || process.cwd()
  const resolved = path.resolve(/* turbopackIgnore: true */ candidate)
  const parsed = path.parse(resolved)
  if (resolved === parsed.root) throw new Error('Scanner source root may not be the filesystem root.')
  return resolved
}

function sourceKind(extension: string): UniversalSourceFile['kind'] {
  if (['.ts', '.tsx'].includes(extension)) return 'typescript'
  if (['.js', '.jsx', '.mjs', '.cjs'].includes(extension)) return 'javascript'
  if (extension === '.sql') return 'sql'
  if (extension === '.json') return 'json'
  if (['.yml', '.yaml'].includes(extension)) return 'configuration'
  return 'other'
}

async function checksumFile(filePath: string) {
  const buffer = await fs.readFile(filePath)
  return createHash('sha256').update(buffer).digest('hex')
}

export type UniversalDirectoryInventory = {
  relativeDirectory: string
  directories: string[]
  files: UniversalSourceFile[]
  warnings: string[]
}

function resolveContainedDirectory(root: string, relativeDirectory: string) {
  const resolvedRoot = path.resolve(/* turbopackIgnore: true */ root)
  const resolvedDirectory = path.resolve(/* turbopackIgnore: true */ resolvedRoot, relativeDirectory || '.')
  const relative = path.relative(resolvedRoot, resolvedDirectory)
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Inventory directory escaped the configured scanner root.')
  return resolvedDirectory
}

export async function inventoryUniversalDirectory(
  root = resolveUniversalScannerRoot(),
  relativeDirectory = '',
): Promise<UniversalDirectoryInventory> {
  const current = resolveContainedDirectory(root, relativeDirectory)
  const directories: string[] = []
  const files: UniversalSourceFile[] = []
  const warnings: string[] = []
  let entries
  try {
    entries = await fs.readdir(current, { withFileTypes: true })
  } catch (error) {
    return {
      relativeDirectory,
      directories,
      files,
      warnings: [`Unable to read ${relativeDirectory || '.'}: ${error instanceof Error ? error.message : 'unknown error'}`],
    }
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    const absolute = path.join(/* turbopackIgnore: true */ current, entry.name)
    const childRelative = path.relative(root, absolute).split(path.sep).join('/')
    if (entry.isDirectory()) {
      if (!isExcludedDirectory(entry.name)) directories.push(childRelative)
      continue
    }
    if (!entry.isFile() || isExcludedFile(entry.name)) continue
    const extension = path.extname(entry.name).toLowerCase()
    if (!ELIGIBLE_EXTENSIONS.has(extension)) continue
    try {
      const stat = await fs.stat(absolute)
      if (stat.size > MAX_SOURCE_FILE_BYTES) {
        warnings.push(`Skipped oversized source file ${childRelative} (${stat.size} bytes).`)
        continue
      }
      files.push({
        absolutePath: absolute,
        relativePath: childRelative,
        extension,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        checksum: await checksumFile(absolute),
        kind: sourceKind(extension),
      })
    } catch (error) {
      warnings.push(`Unable to inspect ${childRelative}: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  directories.sort()
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  return { relativeDirectory, directories, files, warnings }
}

export async function inventoryUniversalSource(root = resolveUniversalScannerRoot()) {
  const output: UniversalSourceFile[] = []
  const warnings: string[] = []
  const queue = ['']
  while (queue.length) {
    const relativeDirectory = queue.shift() ?? ''
    const inventory = await inventoryUniversalDirectory(root, relativeDirectory)
    output.push(...inventory.files)
    warnings.push(...inventory.warnings)
    queue.push(...inventory.directories)
  }
  output.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  return { files: output, warnings }
}
