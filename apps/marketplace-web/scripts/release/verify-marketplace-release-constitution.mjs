import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv[2] || 'source'

const REQUIRED = [
  '/',
  '/angelcare-marketplace/fr',

  '/angelcare-360-access/login',
  '/angelcare-360-access/activate',
  '/angelcare-360-portal/login',
  '/angelcare-360-parent/login',
  '/angelcare-360-student/login',
  '/angelcare-360-teacher/login',
  '/angelcare-360-staff/login',

  '/angelcare-360-command-center',
  '/angelcare-360-command-center/transport',
  '/angelcare-360-command-center/paie',
  '/angelcare-360-command-center/reclamations',
  '/angelcare-360-command-center/messagerie',
  '/angelcare-360-command-center/inventaire',
  '/angelcare-360-command-center/bibliotheque',

  '/angelcare-360-operator',
]

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(full, predicate, out)
    } else if (predicate(full, entry.name)) {
      out.push(full)
    }
  }

  return out
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function routeRegex(pattern) {
  if (pattern === '/') return /^\/$/

  const segments = pattern.split('/').filter(Boolean)

  let source = '^'

  for (const segment of segments) {
    /*
     * Next.js optional catch-all:
     *
     * /angelcare-marketplace/[locale]/[[...slug]]
     *
     * MUST match BOTH:
     * /angelcare-marketplace/fr
     * /angelcare-marketplace/fr/anything
     *
     * The slash itself must therefore be optional together
     * with the catch-all segment.
     */
    if (/^\[\[\.\.\..+\]\]$/.test(segment)) {
      source += '(?:/.*)?'
      continue
    }

    if (/^\[\.\.\..+\]$/.test(segment)) {
      source += '/.+'
      continue
    }

    if (/^\[.+\]$/.test(segment)) {
      source += '/[^/]+'
      continue
    }

    source += '/' + escapeRegex(segment)
  }

  source += '$'

  return new RegExp(source)
}

function matchesConcreteRoute(pattern, concrete) {
  return routeRegex(pattern).test(concrete)
}

function sourcePatternFromPage(file, appRoot) {
  let relative = path.relative(appRoot, file).replaceAll(path.sep, '/')

  relative = relative.replace(/\/page\.(tsx?|jsx?)$/, '')
  relative = relative.replace(/^page\.(tsx?|jsx?)$/, '')

  const pieces = relative
    .split('/')
    .filter(Boolean)
    .filter(
      (segment) =>
        !(segment.startsWith('(') && segment.endsWith(')')),
    )
    .filter((segment) => !segment.startsWith('@'))

  return pieces.length
    ? `/${pieces.join('/')}`
    : '/'
}

function verifyRequired(patterns, label) {
  let failures = 0

  for (const route of REQUIRED) {
    const match = patterns.find((pattern) =>
      matchesConcreteRoute(pattern, route),
    )

    if (match) {
      console.log(`PASS ${label} ${route} <= ${match}`)
    } else {
      console.error(`FAIL ${label} ${route}`)
      failures += 1
    }
  }

  return failures
}

function verifySource() {
  const appRoot = path.resolve('apps/marketplace-web/app')

  if (!fs.existsSync(appRoot)) {
    console.error(`FAIL app root missing: ${appRoot}`)
    process.exit(1)
  }

  const pages = walk(
    appRoot,
    (_file, name) => /^page\.(tsx?|jsx?)$/.test(name),
  )

  const patterns = [
    ...new Set(
      pages.map((file) =>
        sourcePatternFromPage(file, appRoot),
      ),
    ),
  ].sort()

  let failures = verifyRequired(patterns, 'SOURCE')

  const marketplaceAuthority =
    '/angelcare-marketplace/[locale]/[[...slug]]'

  if (patterns.includes(marketplaceAuthority)) {
    console.log(
      `PASS MARKETPLACE DYNAMIC AUTHORITY ${marketplaceAuthority}`,
    )
  } else {
    console.error(
      `FAIL MARKETPLACE DYNAMIC AUTHORITY ${marketplaceAuthority}`,
    )
    failures += 1
  }

  const marketplaceRegex =
    routeRegex(marketplaceAuthority)

  if (
    marketplaceRegex.test('/angelcare-marketplace/fr') &&
    marketplaceRegex.test(
      '/angelcare-marketplace/fr/example',
    )
  ) {
    console.log(
      'PASS OPTIONAL CATCH-ALL SEMANTICS /angelcare-marketplace/fr',
    )
  } else {
    console.error(
      'FAIL OPTIONAL CATCH-ALL SEMANTICS /angelcare-marketplace/fr',
    )
    failures += 1
  }

  const rootFile = path.join(appRoot, 'page.tsx')

  if (!fs.existsSync(rootFile)) {
    console.error('FAIL ROOT app/page.tsx missing')
    failures += 1
  } else {
    const source = fs.readFileSync(rootFile, 'utf8')

    if (
      source.includes('permanentRedirect') &&
      source.includes('/angelcare-marketplace/fr')
    ) {
      console.log(
        'PASS ROOT CONTRACT / -> 308 -> /angelcare-marketplace/fr',
      )
    } else {
      console.error('FAIL ROOT CONTRACT')
      failures += 1
    }
  }

  // MARKETPLACE_LOCALE_ROOT_FAIL_OPEN_CONSTITUTION
  const marketplaceLocaleRootFile = path.join(
    appRoot,
    'angelcare-marketplace',
    '[locale]',
    '[[...slug]]',
    'page.tsx',
  )

  if (!fs.existsSync(marketplaceLocaleRootFile)) {
    console.error('FAIL MARKETPLACE LOCALE ROOT FILE')
    failures += 1
  } else {
    const marketplaceLocaleRootSource = fs.readFileSync(
      marketplaceLocaleRootFile,
      'utf8',
    )

    const continuityAuthorities = [
      'MARKETPLACE_LOCALE_ROOT_FAIL_OPEN',
      'MarketplaceIndex',
      'searchDiscovery',
    ]

    const missingContinuityAuthorities = continuityAuthorities.filter(
      (authority) => !marketplaceLocaleRootSource.includes(authority),
    )

    if (missingContinuityAuthorities.length) {
      console.error(
        `FAIL MARKETPLACE ROOT CONTINUITY ${missingContinuityAuthorities.join(',')}`,
      )
      failures += 1
    } else {
      console.log(
        'PASS MARKETPLACE ROOT CONTINUITY — valid locale root cannot fail closed on homepage data',
      )
    }
  }

  console.log(`SOURCE_ROUTE_PATTERNS=${patterns.length}`)
  console.log(`REQUIRED_ROUTES=${REQUIRED.length}`)

  if (failures) {
    console.error(
      `SOURCE_CONSTITUTION=FAIL (${failures})`,
    )
    process.exit(1)
  }

  console.log('SOURCE_CONSTITUTION=PASS')
}

function normalizeCompiledKey(key) {
  let route = String(key)

  route = route.replace(/\/page$/, '')

  const segments = route
    .split('/')
    .filter(Boolean)
    .filter(
      (segment) =>
        !(segment.startsWith('(') && segment.endsWith(')')),
    )
    .filter((segment) => !segment.startsWith('@'))

  route = segments.length
    ? `/${segments.join('/')}`
    : '/'

  return route
}

function verifyCompiled() {
  const nextRoot = process.env.NEXT_DIR
    ? path.resolve(process.env.NEXT_DIR)
    : path.resolve('apps/marketplace-web/.next')

  if (!fs.existsSync(nextRoot)) {
    console.error(`FAIL NEXT_DIR missing: ${nextRoot}`)
    process.exit(1)
  }

  const manifests = walk(
    nextRoot,
    (_file, name) =>
      name === 'app-paths-manifest.json',
  )

  if (!manifests.length) {
    console.error(
      'FAIL no app-paths-manifest.json files found',
    )
    process.exit(1)
  }

  const keys = new Set()

  for (const manifest of manifests) {
    let parsed

    try {
      parsed = JSON.parse(
        fs.readFileSync(manifest, 'utf8'),
      )
    } catch (error) {
      console.error(
        `FAIL parse ${manifest}: ${error.message}`,
      )
      process.exit(1)
    }

    for (const key of Object.keys(parsed || {})) {
      keys.add(normalizeCompiledKey(key))
    }
  }

  const patterns = [...keys].sort()

  const failures =
    verifyRequired(patterns, 'COMPILED')

  console.log(
    `APP_PATH_MANIFESTS=${manifests.length}`,
  )
  console.log(
    `COMPILED_ROUTE_PATTERNS=${patterns.length}`,
  )
  console.log(`REQUIRED_ROUTES=${REQUIRED.length}`)

  if (failures) {
    console.error(
      `COMPILED_CONSTITUTION=FAIL (${failures})`,
    )
    process.exit(1)
  }

  console.log('COMPILED_CONSTITUTION=PASS')
}

if (mode === 'source') {
  verifySource()
} else if (mode === 'compiled') {
  verifyCompiled()
} else {
  console.error(`Unknown mode: ${mode}`)
  process.exit(1)
}
