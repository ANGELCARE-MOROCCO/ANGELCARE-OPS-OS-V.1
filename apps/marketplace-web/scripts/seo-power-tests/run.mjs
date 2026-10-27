import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));
fs.mkdirSync('scripts/seo-power-tests/reports',{recursive:true});
for(const file of ['build-fixture.mjs','database.mjs','backend.mjs','api.mjs']){const r=spawnSync(process.execPath,['scripts/seo-power-tests/'+file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
