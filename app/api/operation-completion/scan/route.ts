import { NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'
import { requireRole } from '@/lib/auth/session'

type ScanItem = {
  module: string
  file: string
  label: string
  actionType: string
  confidence: number
}

const ROOT = process.cwd()
const SCAN_DIRS = ['app', 'components']
const MAX_FILES = 900
const ACTION_WORDS = [
  'save',
  'enregistrer',
  'delete',
  'supprimer',
  'create',
  'créer',
  'submit',
  'valider',
  'validate',
  'execute',
  'run',
  'launch',
  'import',
  'export',
  'upload',
  'restore',
  'suspend',
  'confirm',
  'approve',
  'reject',
  'archive',
  'send',
  'sync',
  'refresh',
]
const NAV_WORDS = ['retour', 'back', 'view', 'open', 'overview', 'profile', 'attendance', 'settings', 'tab']

function moduleFromFile(file: string) {
  const clean = file.replace(/^app\//, '').replace(/^components\//, '')
  const parts = clean.split('/').filter(Boolean)
  const first = parts.find((part) => !part.startsWith('(') && part !== '_components')
  return first || 'shared'
}

function classify(label: string) {
  const text = label.toLowerCase()
  if (text.includes('delete') || text.includes('supprimer')) return 'delete'
  if (text.includes('save') || text.includes('enregistrer')) return 'save'
  if (text.includes('create') || text.includes('new') || text.includes('créer')) return 'create'
  if (text.includes('restore')) return 'restore'
  if (text.includes('suspend') || text.includes('turn off')) return 'suspend'
  if (text.includes('import') || text.includes('upload')) return 'import'
  if (text.includes('approve') || text.includes('reject') || text.includes('validate') || text.includes('valider')) return 'approval'
  if (text.includes('sync') || text.includes('refresh')) return 'sync'
  if (text.includes('run') || text.includes('execute') || text.includes('launch')) return 'execute'
  return 'action'
}

function isNavigation(label: string) {
  const text = label.toLowerCase()
  return NAV_WORDS.some((word) => text === word || text.includes(word))
}

function extractButtons(source: string, file: string): ScanItem[] {
  const items: ScanItem[] = []
  const buttonRegex = /<button[\s\S]{0,500}?>([\s\S]{0,160}?)<\/button>/gi
  const pageActionRegex = /<PageAction[\s\S]{0,500}?>([\s\S]{0,120}?)<\/PageAction>/gi

  for (const regex of [buttonRegex, pageActionRegex]) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(source))) {
      const raw = String(match[1] || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[{}'"`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!raw) continue
      const lower = raw.toLowerCase()
      const hasActionWord = ACTION_WORDS.some((word) => lower.includes(word))
      if (!hasActionWord || isNavigation(raw)) continue

      items.push({
        module: moduleFromFile(file),
        file,
        label: raw.slice(0, 90),
        actionType: classify(raw),
        confidence: raw.length > 2 ? 86 : 55,
      })
    }
  }

  return items
}

async function walk(dir: string, out: string[] = []) {
  if (out.length >= MAX_FILES) return out

  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (out.length >= MAX_FILES) break
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue

    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, out)
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push(full)
    }
  }

  return out
}

export async function GET() {
  await requireRole(['ceo', 'manager'])

  const files: string[] = []
  for (const dir of SCAN_DIRS) {
    const absolute = path.join(ROOT, dir)
    try {
      const info = await stat(absolute)
      if (info.isDirectory()) await walk(absolute, files)
    } catch {
      // ignore unavailable directory
    }
  }

  const actions: ScanItem[] = []

  for (const absolute of files.slice(0, MAX_FILES)) {
    try {
      const source = await readFile(absolute, 'utf8')
      const relative = path.relative(ROOT, absolute)
      actions.push(...extractButtons(source, relative))
    } catch {
      // ignore unreadable files
    }
  }

  const modules = Array.from(new Set(actions.map((item) => item.module))).sort()
  const actionTypes = Array.from(new Set(actions.map((item) => item.actionType))).sort()

  return NextResponse.json({
    ok: true,
    scannedFiles: files.length,
    actions: actions.slice(0, 500),
    modules,
    actionTypes,
    generatedAt: new Date().toISOString(),
  })
}
