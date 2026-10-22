/** Prepare a source candidate only. Never builds, connects to services, runs SQL or writes Git. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'../..'),repo=path.resolve(app,'../..'),prefix='apps/marketplace-web/';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=name=>JSON.parse(fs.readFileSync(path.join(app,'docs/jobkix',name),'utf8'));
function walk(directory){const result=[];for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isSymbolicLink())throw Error('Symlink refused: '+file);if(entry.isDirectory())result.push(...walk(file));else if(entry.isFile())result.push(file);else throw Error('Non-regular file refused: '+file);}return result;}
function write(file,bytes){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{flag:'wx'});}
function main(){
 if(process.argv.length!==2)throw Error('Usage: node scripts/jobkix/prepare-release.cjs');
 const verification=read('evidence/source-verification.json'),changed=read('changed-files.json');
 if(!verification.results.length||verification.results.some(row=>!row.pass))throw Error('Source verification has unresolved failures');
 for(const [relative,expected] of Object.entries(verification.sources))if(hash(fs.readFileSync(path.join(app,relative)))!==expected)throw Error('Source changed since verification: '+relative);
 const registered=new Map(changed.map(row=>[row.path,row]));
 const sources=Object.keys(verification.sources).sort();
 if(sources.length!==registered.size||sources.some(relative=>!registered.has(relative)))throw Error('Changed-file manifest does not match verified source');
 const base=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'jobkix-release-candidate-'));
 const name='ANGELCARE_JOBKIX_RELEASE_CANDIDATE_20261022',directory=path.join(base,name);fs.mkdirSync(directory);
 const documentation=walk(path.join(app,'docs/jobkix')).map(file=>path.relative(app,file));
 // Earlier restart archives and restore utilities stay in the user's repo. They
 // are historical backups, not current implementation or installer payload.
 const excluded=documentation.filter(relative=>relative.startsWith('docs/jobkix/checkpoints/'));
 const files=[...sources,...documentation.filter(relative=>!excluded.includes(relative))].sort();
 if(new Set(files).size!==files.length)throw Error('Duplicate package target');
 const rows=[];
 for(const relative of files){
  if(relative.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.'))||/\.(zip|tar|gz|tsbuildinfo)$/i.test(relative)||/(?:^|\/)(?:node_modules|backups|cache|fixture-session)(?:\/|\.)/.test(relative))throw Error('Excluded package entry: '+relative);
  const source=path.join(app,relative),stat=fs.lstatSync(source);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe source: '+relative);
  const bytes=fs.readFileSync(source),record=registered.get(relative),before=record?.before||'NEW',after=hash(bytes);
  if(record?.after!==undefined&&record.after!==after)throw Error('Checkpoint drift: '+relative);
  write(path.join(directory,'payload',prefix,relative),bytes);rows.push({path:prefix+relative,before,after,bytes:bytes.length});
  if(before!=='NEW'){
   const original=fs.readFileSync(record.checkpoint);if(hash(original)!==before)throw Error('Original-byte checkpoint mismatch: '+relative);
   write(path.join(directory,'baseline',prefix,relative),original);
  }
 }
 const rootIdentity=fs.readFileSync(path.join(repo,'package.json')),appIdentity=fs.readFileSync(path.join(app,'package.json'));
 write(path.join(directory,'baseline/package.json'),rootIdentity);write(path.join(directory,'baseline',prefix,'package.json'),appIdentity);
 for(const file of ['install.mjs','verify.mjs','rollback.mjs'])write(path.join(directory,file),fs.readFileSync(path.join(app,'scripts/jobkix/installer',file)));
 const manifest={format:1,mission:'JOBKIX_SOURCE_IMPLEMENTATION',application:'angelcare-marketplace-web',classification:'SOURCE_RELEASE_CANDIDATE_NOT_PRODUCTION_APPROVAL',baselineHead:read('source-baseline.json').head,rootPackageJsonSha256:hash(rootIdentity),packageJsonSha256:hash(appIdentity),files:rows};
 write(path.join(directory,'payload-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 write(path.join(directory,'package-exclusions.json'),JSON.stringify({files:excluded,reason:'Historical restart/checkpoint archives and their restore utilities; retained unchanged in the original repository and excluded to prevent restoring older source.'},null,2)+'\n');
 const sql=rows.filter(row=>row.path.startsWith(prefix+'angelcare-marketplace/jobkix/migrations/')).map(row=>({order:Number(path.basename(row.path).slice(0,3)),path:'payload/'+row.path,sha256:row.after,bytes:row.bytes}));
 if(sql.length!==28||sql.some((row,index)=>row.order!==index+1))throw Error('Unexpected migration sequence');
 write(path.join(directory,'SQL_ORDER.json'),JSON.stringify({status:'AUTHORED_ISOLATED_TESTED_HOSTED_PREFLIGHT_PENDING',productionExecuted:false,files:sql},null,2)+'\n');
 const readiness=read('release-candidate.json');
 write(path.join(directory,'RELEASE_STATUS.json'),JSON.stringify(readiness,null,2)+'\n');
 write(path.join(directory,'RELEASE_CANDIDATE.md'),fs.readFileSync(path.join(app,'docs/jobkix/RELEASE_CANDIDATE.md')));
 write(path.join(directory,'SQL_MANUAL_GUIDE.md'),fs.readFileSync(path.join(app,'docs/jobkix/SQL_MANUAL_GUIDE.md')));
 const previews=[['P00-en-1440.png','JOBKIX_HOMEPAGE_PREVIEW.png'],['P00-en-390.png','JOBKIX_HOMEPAGE_MOBILE.png'],['P12-ar-390-employer-polish.png','JOBKIX_RTL_PREVIEW.png']];
 for(const [source,target] of previews)write(path.join(directory,target),fs.readFileSync(path.join(app,'docs/jobkix/evidence/browser',source)));
 const command=`node "$PACKAGE_DIRECTORY/install.mjs" "/Users/user/Desktop/angelcare-platform"\nnode "$PACKAGE_DIRECTORY/verify.mjs" "/Users/user/Desktop/angelcare-platform"\n`;
 write(path.join(directory,'APPLY_COMMAND.txt'),'# Set PACKAGE_DIRECTORY to this extracted folder. Source only; no SQL, build, push or deployment.\n# This repository already contains these changes; identical files create no rollback receipt.\n'+command+'# For a new installation, use the exact rollback command printed by install.mjs and keep this folder/backups.\n');
 const bundle=walk(directory).map(file=>({path:path.relative(directory,file).split(path.sep).join('/'),sha256:hash(fs.readFileSync(file)),bytes:fs.statSync(file).size})).sort((a,b)=>a.path.localeCompare(b.path));
 write(path.join(directory,'bundle-manifest.json'),JSON.stringify({format:1,files:bundle},null,2)+'\n');
 const output={directory,name,payloadFiles:rows.length,sourceFiles:sources.length,originalFiles:rows.filter(row=>row.before!=='NEW').length,bundleFiles:bundle.length+1,uncompressedBytes:bundle.reduce((total,row)=>total+row.bytes,0),sourceVerification:verification.recordedAt};
 write(path.join(base,'staging-result.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}
try{main();}catch(error){console.error(error.message);process.exitCode=1;}
