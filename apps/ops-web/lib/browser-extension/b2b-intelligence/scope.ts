const TERRITORY_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'casablanca', aliases: ['casablanca', 'casa'] },
  { canonical: 'rabat', aliases: ['rabat'] },
  { canonical: 'temara', aliases: ['temara', 'témara'] },
  { canonical: 'sale', aliases: ['sale', 'salé'] },
  { canonical: 'kenitra', aliases: ['kenitra', 'kénitra'] },
  { canonical: 'tanger', aliases: ['tanger', 'tangier'] },
  { canonical: 'marrakech', aliases: ['marrakech', 'marrakesh'] },
  { canonical: 'fes', aliases: ['fes', 'fès', 'fez'] },
  { canonical: 'agadir', aliases: ['agadir'] },
  { canonical: 'mohammedia', aliases: ['mohammedia'] },
  { canonical: 'el jadida', aliases: ['el jadida', 'jadida'] },
  { canonical: 'meknes', aliases: ['meknes', 'meknès'] },
  { canonical: 'tetouan', aliases: ['tetouan', 'tétouan'] },
  { canonical: 'oujda', aliases: ['oujda'] },
]

function foldTerritory(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b\d{4,6}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeTerritory(value: unknown): string {
  const folded = foldTerritory(value)
  if (!folded) return ''
  const searchable = ` ${folded} `
  for (const territory of TERRITORY_ALIASES) {
    for (const alias of territory.aliases) {
      const candidate = foldTerritory(alias)
      if (candidate && searchable.includes(` ${candidate} `)) return territory.canonical
    }
  }
  return folded
}

function unpackScopeValue(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray((value as { values?: unknown[] }).values)) {
    return (value as { values: unknown[] }).values
  }
  if (typeof value === 'string') return value.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean)
  return []
}

export function scopeValues(scopes: Record<string, unknown>, key: string): string[] {
  return unpackScopeValue(scopes[key])
    .flatMap((value) => typeof value === 'string' ? value.split(/[,;\n]+/) : [value])
    .map(normalizeTerritory)
    .filter(Boolean)
}

export function assertTerritory(scopes: Record<string, unknown>, city: unknown) {
  const allowed = scopeValues(scopes, 'territories')
  if (!allowed.length) return
  const target = normalizeTerritory(city)
  if (!target || !allowed.includes(target)) {
    throw Object.assign(new Error('TERRITORY_NOT_ASSIGNED'), {
      status: 403,
      details: { territory: target || null, allowedTerritories: allowed },
    })
  }
}

export function filterByOwnership<T extends Record<string, any>>(
  rows: T[],
  userId: string,
  scopes: Record<string, unknown>,
) {
  const mode = String((scopes.accountOwnership as { mode?: unknown })?.mode || scopes.accountOwnership || 'all').toLowerCase()
  if (mode === 'assigned_or_created') {
    return rows.filter((row) => String(row.assigned_owner_id || '') === userId || String(row.created_by || '') === userId)
  }
  if (mode === 'assigned') return rows.filter((row) => String(row.assigned_owner_id || '') === userId)
  return rows
}
