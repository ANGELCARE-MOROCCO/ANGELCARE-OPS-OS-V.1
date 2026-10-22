const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const app = path.resolve(__dirname, '../..');
const evidence = path.join(app, 'docs/jobkix/evidence');
fs.mkdirSync(evidence, { recursive: true });
const runs = [
 ['domain', ['--test','--test-reporter=tap','scripts/jobkix/domain.test.cjs']],
 ['presentation-routing', ['--test','--test-reporter=tap','scripts/jobkix/presentation-routing.test.cjs']],
 ['private-export', ['--test','--test-reporter=tap','scripts/jobkix/private-export.test.cjs']],
 ['employer-worlds', ['--test','--test-reporter=tap','scripts/jobkix/employer-worlds.test.cjs']],
 ['database', ['--test','--test-reporter=tap','scripts/jobkix/database.test.cjs']],
 ['editorial-scenes', ['--test','--test-reporter=tap','scripts/jobkix/editorial-scenes.test.cjs']],
 ['panel-selection', ['--test','--test-reporter=tap','scripts/jobkix/panel-selection.test.cjs']],
 ['auth-email', ['--test','--test-reporter=tap','scripts/jobkix/auth-email.test.cjs']],
 ['private-files', ['--test','--test-reporter=tap','scripts/jobkix/files.test.cjs']],
 ['installer', ['--test','--test-reporter=tap','scripts/jobkix/installer.test.mjs']],
 ['editorial-assets', ['scripts/jobkix/check-assets.cjs']],
 ['geography-assets', ['scripts/jobkix/check-geography-assets.cjs']],
 ['brand', ['--test','--test-reporter=tap','scripts/jobkix/brand.test.cjs']],
 ['references', ['scripts/jobkix/check-references.cjs']],
 ['owned-styles', ['scripts/jobkix/check-styles.cjs']],
 ['typescript', ['scripts/jobkix/check-types.cjs']],
];
const results = [];
for (const [name, args] of runs) {
 const startedAt = new Date().toISOString();
 const run = spawnSync(process.execPath, args, { cwd:app, encoding:'utf8', maxBuffer:8*1024*1024 });
 const output = run.stdout + run.stderr;
 fs.writeFileSync(path.join(evidence, name + '.log'), output);
 results.push({ name, command:'node ' + args.join(' '), startedAt, endedAt:new Date().toISOString(), exitCode:run.status,
  pass:run.status===0, tests:Number(output.match(/^# tests (\d+)/m)?.[1] || 0),
  limitation:name==='installer'?'Guarded tools applied only to disposable repository fixtures. Actual ZIP extraction/install/rollback is a separate package-validation report; these tests alone do not establish archive delivery or product acceptance.':(name==='database'||name==='panel-selection'||name==='editorial-scenes')?'In-process PostgreSQL via test-only PGlite; synthetic Supabase identity/trust/storage fixtures. No hosted Auth, browser, network transport, production DB or multi-session concurrency certification.':name==='typescript'?'Scoped source checking, not an application build.':name==='auth-email'?'Actual email renderer and native byte-regression fixtures; no SMTP send or hosted Auth registration.':name==='private-files'?'Actual structural PDF/image validation; no hosted private storage, browser upload or malware-engine certification.':name==='editorial-assets'?'Registered asset hashes/dimensions/decoding only; no complete page imagery or logo acceptance.':name==='geography-assets'?'Preserved public-domain source hash, deterministic geographic projection, safe SVG and decode only; no complete public-front acceptance.':name==='brand'?'Original/derivative hash, transparency, exact interior pixels, icon resize and native descriptor checks only. No browser favicon transition or rendered header/footer acceptance.':name==='references'?'Original reference SHA-256 and image dimensions only; no per-front visual review.':name==='owned-styles'?'CSS syntax and TSX bindings only; no rendered visual, contrast or responsive review.':'Actual pure domain functions; no browser or deployed end-to-end certification.' });
 console.log(name.toUpperCase()+'='+(run.status===0?'PASS':'FAILED'));
}
const sources = {};
function visit(dir) {
 for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()) visit(file);
  else sources[path.relative(app,file)]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }
}
for(const directory of ['angelcare-marketplace/jobkix','scripts/jobkix','app/jobkix','app/api/jobkix','app/angelcare-marketplace/(protected)/admin/jobkix','public/jobkix'])visit(path.join(app,directory));
for(const entry of JSON.parse(fs.readFileSync(path.join(app,'docs/jobkix/shared-file-register.json')))){const relative=entry.path.replace(/^apps\/marketplace-web\//,'');sources[relative]=crypto.createHash('sha256').update(fs.readFileSync(path.join(app,relative))).digest('hex');}
fs.writeFileSync(path.join(evidence,'source-verification.json'),JSON.stringify({recordedAt:new Date().toISOString(),results,sources,LOCAL_APPLICATION_BUILD:'FORBIDDEN_NOT_INVOKED',PRODUCTION_SQL:'NOT_EXECUTED',GIT_RELEASE_ACTIONS:'NOT_EXECUTED',DEPLOYMENT:'NOT_EXECUTED'},null,2)+'\n');
process.exitCode=results.some(r=>!r.pass)?1:0;
