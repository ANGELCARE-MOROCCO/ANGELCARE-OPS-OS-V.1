import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const index=Number(process.argv[2]||0)
assert.ok(index>=1&&index<=10,'category index must be 1..10')
const source=fs.readFileSync(path.join(process.cwd(),'angelcare-marketplace/studio-universal/visual-catalogue.ts'),'utf8')
const experiences=JSON.parse(source.match(/ANGELCARE_STUDIO_VISUAL_EXPERIENCES\s*=\s*(\[[\s\S]*?\])\s*as const satisfies/)[1])
const categories=JSON.parse(source.match(/ANGELCARE_STUDIO_VISUAL_CATEGORIES\s*=\s*(\[[\s\S]*?\])\s*as const satisfies/)[1])
const category=categories[index-1]
assert.ok(category,`category ${index} missing`)
const rows=experiences.filter(row=>row.categoryKey===category.key)
assert.equal(rows.length,10,`${category.key} must contain 10 experiences`)
assert.equal(new Set(rows.map(row=>row.key)).size,10,`${category.key} aliases must be unique`)
for(const row of rows){assert.ok(row.canonicalType,`${row.key}: canonical type missing`);assert.ok(row.label,`${row.key}: label missing`);assert.equal(category.componentKeys.includes(row.key),true,`${row.key}: missing from category registration`)}
console.log(`PASS CATEGORY_${String(index).padStart(2,'0')} ${category.key} EXPERIENCES=${rows.length}`)
