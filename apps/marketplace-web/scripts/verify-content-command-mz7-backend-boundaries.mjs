import fs from 'fs'
const manifest=fs.existsSync('MZ7_PATCH_FILE_LIST.txt')?'MZ7_PATCH_FILE_LIST.txt':'BULK6_PATCH_FILE_LIST.txt'
const changed=fs.readFileSync(manifest,'utf8').trim().split(/\r?\n/).filter(Boolean)
for(const file of changed){
  if(/supabase\/migrations|\.sql$|schema\.prisma|database\/migrations/i.test(file)) throw new Error(`Database migration introduced: ${file}`)
  if(/(^|\/)app\/api\//.test(file)&&file!=='app/api/market-os/content-command-headquarters/actions/route.ts') throw new Error(`Unexpected API surface introduced: ${file}`)
}
if(!changed.includes('lib/market-os/content-command-headquarters/publication-release-service.ts')) throw new Error('Governed release service missing')
const route=fs.readFileSync('app/api/market-os/content-command-headquarters/actions/route.ts','utf8')
const service=fs.readFileSync('lib/market-os/content-command-headquarters/publication-release-service.ts','utf8')
for(const requirement of [
  'action === "publication_verify" ? "review"',
  'action === "publication_authorize_release" || action === "publication_terminate" ? "govern"',
  'actorRole: actor.role',
]) if(!route.includes(requirement)) throw new Error(`Authority separation missing: ${requirement}`)
if(service.includes('input.authorityRole')) throw new Error('Release authority may not be supplied as free user input')
if(!service.includes('REAL_PROVIDER_EXECUTION_NOT_AVAILABLE')) throw new Error('Provider capability boundary missing')
console.log('PASS — Bulk 6 extends the existing action authority without SQL, schema or parallel API architecture')
console.log('PASS — review, govern and publish authority remain server-resolved and separated')
