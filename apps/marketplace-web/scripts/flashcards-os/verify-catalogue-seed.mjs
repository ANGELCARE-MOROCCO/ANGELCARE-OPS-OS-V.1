#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const seedPath = path.join(root, 'lib/flashcards-os/catalogue-2022.seed.json')
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
const failures = []
const checks = []

function check(name, condition, detail = '') {
  checks.push({ name, condition, detail })
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
}

const expectedDomains = { LANG: 22, GEO: 30, MATH: 18, ZOO: 17, CULT: 16 }
const domainCounts = Object.fromEntries(Object.keys(expectedDomains).map((domain) => [
  domain,
  seed.collections.filter((item) => item.legacyDomain === domain).length,
]))
const ids = seed.collections.map((item) => item.id)
const codes = seed.collections.map((item) => item.code)
const slugs = seed.collections.map((item) => item.slug)
const categoryIds = new Set(seed.categories.map((item) => item.id))
const issues = seed.collections.flatMap((item) => item.issues.map((issue) => ({ code: item.code, issue })))

check('schema version is declared', typeof seed.schemaVersion === 'string' && seed.schemaVersion.length > 0)
check('portfolio identity exists', seed.portfolio?.code === 'FC-PORTFOLIO')
check('product family identity exists', seed.family?.code === 'FC')
check('22 configurable taxonomy nodes', seed.categories.length === 22, `found ${seed.categories.length}`)
check('103 legacy catalogue records', seed.collections.length === 103, `found ${seed.collections.length}`)
check('domain distribution matches source transcription', JSON.stringify(domainCounts) === JSON.stringify(expectedDomains), JSON.stringify(domainCounts))
check('collection IDs are unique', new Set(ids).size === ids.length)
check('collection codes are unique', new Set(codes).size === codes.length)
check('collection slugs are non-empty; routing uses immutable codes', slugs.every((slug) => typeof slug === 'string' && slug.length > 0))
check('all categories resolve', seed.collections.every((item) => categoryIds.has(item.categoryId)))
check('all source pages remain pages 3–7', seed.collections.every((item) => item.sourcePage >= 3 && item.sourcePage <= 7))
check('all legacy prices are evidence-only numeric values or null', seed.collections.every((item) => item.historicalPriceDh === null || (Number.isFinite(item.historicalPriceDh) && item.historicalPriceDh >= 0)))
check('all expected card counts are positive or intentionally null', seed.collections.every((item) => item.expectedCardCount === null || Number.isInteger(item.expectedCardCount) && item.expectedCardCount > 0))
check('card-level content is not invented', seed.collections.every((item) => item.structuredCardCount === 0))
check('all imports retain canonical source label', seed.collections.every((item) => item.sourceLabel === 'NEW VERSION OF CATALOGUE FC 2022'))
check('all imports start in legacy intake lifecycle', seed.collections.every((item) => item.lifecycle === 'legacy_intake'))
check('18 source anomaly decisions preserved', issues.length === 18, `found ${issues.length}`)
check('missing card counts are explicitly flagged', seed.collections.filter((item) => item.expectedCardCount === null).every((item) => item.issues.includes('missing_card_count')))
check('duplicate garments evidence retained', seed.collections.filter((item) => item.name === 'Les vêtements').length === 2)
check('duplicate Africa fruits evidence retained', seed.collections.filter((item) => item.name.toLowerCase().replace('’', "'") === "fruits d'afrique").length === 2)
check('future growth domains exist', ['cat-science', 'cat-autonomy', 'cat-social-emotional', 'cat-inclusive', 'cat-montessori'].every((id) => categoryIds.has(id)))

for (const result of checks) {
  console.log(`${result.condition ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` (${result.detail})` : ''}`)
}
console.log(`\n${checks.length - failures.length}/${checks.length} catalogue integrity checks passed.`)
if (failures.length) {
  console.error('\nCatalogue integrity failures:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
