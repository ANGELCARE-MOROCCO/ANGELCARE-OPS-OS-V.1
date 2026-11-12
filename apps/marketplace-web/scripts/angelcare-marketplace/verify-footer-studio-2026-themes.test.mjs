import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=readFileSync(new URL('../../angelcare-marketplace/footer-studio/premium-themes.ts', import.meta.url),'utf8')
const legacy=readFileSync(new URL('../../angelcare-marketplace/footer-studio/themes.ts', import.meta.url),'utf8')
const css=readFileSync(new URL('../../angelcare-marketplace/footer-studio/footer-studio.module.css', import.meta.url),'utf8')
const studio=readFileSync(new URL('../../angelcare-marketplace/footer-studio/components/FooterStudioCommand.tsx', import.meta.url),'utf8')
const sql=readFileSync(new URL('../../supabase/migrations/20261112190000_angelcare_footer_studio_10_professional_themes.sql',import.meta.url),'utf8')
const chunk=source.match(/=\s*(\[[\s\S]*?\])\s+as FooterTheme\[\]/)
assert.ok(chunk,'Could not find the ten theme objects')
const themes=JSON.parse(chunk[1])
test('ten newly built themes have unique names, layouts and stable keys',()=>{
 assert.equal(themes.length,10)
 for(const key of ['theme_key','layout_key']) assert.equal(new Set(themes.map(t=>t[key])).size,10)
 themes.forEach((t,i)=>{assert.equal(t.preview_metadata.sequence,9+i);assert.equal(t.preview_metadata.edition,'2026');assert.equal(t.status,'active');assert.ok(['compact','balanced','generous'].includes(t.tokens.density));for(const l of ['fr','en','ar'])assert.ok(t.name[l]&&t.description[l]);assert.ok(css.includes('data-layout="'+t.layout_key+'"'),'Missing layout '+t.layout_key);assert.ok(sql.includes("'"+t.theme_key+"'"),'Missing SQL theme '+t.theme_key)})
})
test('legacy system themes remain registered and the studio shows accurate counts',()=>{
 assert.ok(legacy.includes('PREMIUM_FOOTER_THEMES'))
 assert.ok(studio.includes("summary.themes.length+' thèmes'"))
 assert.ok(studio.includes('data-layout={theme.layout_key}'))
 assert.ok(studio.includes('theme.preview_metadata.edition'))
})
test('existing publisher and renderer keep the same controlled content model',()=>{
 const runtime=readFileSync(new URL('../../angelcare-marketplace/footer-studio/components/FooterExperience.tsx',import.meta.url),'utf8')
 assert.ok(runtime.includes('profile.sections.filter'))
 assert.ok(runtime.includes('data-layout={profile.theme.layout_key}'))
 assert.ok(runtime.includes('contact_desks'))
 assert.ok(sql.includes('ON CONFLICT (theme_key) DO NOTHING'))
})
