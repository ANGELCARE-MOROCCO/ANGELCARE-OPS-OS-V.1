import path from 'node:path'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

const candidates = [
  '.env.production.local',
  '.env.local',
  '.env.production',
  '.env',
  path.resolve(process.cwd(), '../../.env.production.local'),
  path.resolve(process.cwd(), '../../.env.local'),
  path.resolve(process.cwd(), '../../.env.production'),
  path.resolve(process.cwd(), '../../.env'),
]

const loaded = []
for (const candidate of candidates) {
  const resolved = path.resolve(candidate)
  if (!existsSync(resolved)) continue
  try {
    loadEnvFile(resolved)
    loaded.push(resolved)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed loading environment file ${resolved}: ${message}`)
  }
}

export function requireEnv(...names) {
  for (const name of names) {
    const value = process.env[name]
    if (value && value.trim()) return value.trim()
  }
  throw new Error(`Missing required environment variable. Tried: ${names.join(', ')}. Loaded env files: ${loaded.length ? loaded.join(', ') : 'none'}`)
}

export function loadedEnvFiles() {
  return [...loaded]
}
