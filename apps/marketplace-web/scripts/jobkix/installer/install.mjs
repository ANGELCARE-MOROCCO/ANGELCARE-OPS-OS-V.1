import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const packageRoot=path.dirname(fileURLToPath(import.meta.url));
export const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const digest=file=>{try{const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Unsafe target: '+file);return hash(fs.readFileSync(file));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
export function noLinks(file){const absolute=path.resolve(file),parts=absolute.split(path.sep);let cursor=path.parse(absolute).root;for(const part of parts.slice(1)){cursor=path.join(cursor,part);try{if(fs.lstatSync(cursor).isSymbolicLink())throw Error('Symlink refused: '+cursor);}catch(e){if(e.code!=='ENOENT')throw e;}}return absolute;}
const prefix='apps/marketplace-web/';
export function allowed(file){
 if(typeof file!=='string'||!file.startsWith(prefix)||file.includes('\\')||file.includes('\0')||file.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.')))throw Error('Unsafe payload path: '+file);
 const relative=file.slice(prefix.length);
 const owned=['angelcare-marketplace/jobkix/','app/jobkix/','app/api/jobkix/','app/angelcare-marketplace/(protected)/admin/jobkix/','public/jobkix/','scripts/jobkix/','docs/jobkix/'];
 const shared=['angelcare-marketplace/customer-commerce/auth-email-native/messages.ts','angelcare-marketplace/customer-commerce/auth-email-native/worker.ts','angelcare-marketplace/shells/AdminShell.tsx','app/layout.tsx','app/robots.ts','proxy.ts','angelcare-marketplace/public-universe/components/GlobalPublicShell.tsx',
  // Exact two-file repair separately approved by the user; no broader KidFlix scope.
  'angelcare-marketplace/kidflix/journey/journey.module.css','angelcare-marketplace/kidflix/kidflix.module.css'];
 if(!owned.some(directory=>relative.startsWith(directory))&&!shared.includes(relative))throw Error('Out-of-scope target: '+file);
 return relative;
}
export function loadPackage(){noLinks(packageRoot);const manifest=JSON.parse(fs.readFileSync(noLinks(path.join(packageRoot,'payload-manifest.json')),'utf8'));if(manifest.mission!=='JOBKIX_SOURCE_IMPLEMENTATION'||manifest.format!==1||manifest.application!=='angelcare-marketplace-web'||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Invalid package identity');const used=new Set();for(const row of manifest.files){allowed(row.path);if(used.has(row.path)||!Number.isSafeInteger(row.bytes)||row.bytes<0||!/^[a-f0-9]{64}$/.test(row.after)||!(row.before==='NEW'||/^[a-f0-9]{64}$/.test(row.before)))throw Error('Invalid manifest row');used.add(row.path);const file=noLinks(path.join(packageRoot,'payload',row.path));if(digest(file)!==row.after||fs.statSync(file).size!==row.bytes)throw Error('Corrupt payload: '+row.path);}
 const found=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Payload symlink');if(e.isDirectory())walk(file);else if(e.isFile())found.push(path.relative(path.join(packageRoot,'payload'),file).split(path.sep).join('/'));else throw Error('Unsafe payload entry');}}walk(path.join(packageRoot,'payload'));if(found.length!==used.size||found.some(p=>!used.has(p)))throw Error('Unexpected payload files');return manifest;}
export function repository(input,manifest){
 if(!input)throw Error('Provide the repository root: node install.mjs /path/to/angelcare-platform');
 const root=noLinks(input),app=noLinks(path.join(root,'apps/marketplace-web')),pkg=noLinks(path.join(app,'package.json')),rootPkg=noLinks(path.join(root,'package.json'));
 if(digest(pkg)!==manifest.packageJsonSha256||JSON.parse(fs.readFileSync(pkg,'utf8')).name!==manifest.application||digest(rootPkg)!==manifest.rootPackageJsonSha256||JSON.parse(fs.readFileSync(rootPkg,'utf8')).name!=='angelcare-platform')throw Error('Repository/application identity mismatch');
 return root;
}
export function targets(root,manifest){return manifest.files.map(row=>({...row,target:noLinks(path.join(root,row.path))}));}
function mkdirParents(dir,created){if(fs.existsSync(dir)){if(!fs.lstatSync(dir).isDirectory())throw Error('Not a directory: '+dir);return;}mkdirParents(path.dirname(dir),created);noLinks(dir);fs.mkdirSync(dir);created.push(dir);}
export function stagedWrite(file,bytes,expected,mode,created=[]){noLinks(file);mkdirParents(path.dirname(file),created);const stage=file+'.jobkix-stage-'+crypto.randomUUID();let fd;try{fd=fs.openSync(stage,'wx',mode||0o644);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;noLinks(file);if(digest(file)!==expected)throw Error('Concurrent target change: '+file);if(expected===null){fs.linkSync(stage,file);fs.unlinkSync(stage);}else fs.renameSync(stage,file);}finally{if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(stage);}catch(e){if(e.code!=='ENOENT')throw e;}}}
export function lock(root){const backups=noLinks(path.join(packageRoot,'backups'));fs.mkdirSync(backups,{recursive:true});const key=hash(root).slice(0,24),lockDir=path.join(backups,key+'.lock');fs.mkdirSync(lockDir);return()=>fs.rmdirSync(lockDir);}
export function backupPath(id){if(!/^[0-9TZa-f-]+$/.test(id))throw Error('Invalid backup identifier');return noLinks(path.join(packageRoot,'backups',id));}
export function install(input,{simulateFailureAfter,concurrentHook}={}){
 const manifest=loadPackage(),root=repository(input,manifest),release=lock(root);
 try{
  const rows=targets(root,manifest),current=rows.map(r=>digest(r.target));
  const completed=rows.every((r,i)=>current[i]===r.after);
  if(completed){const backupDir=path.join(packageRoot,'backups');const match=fs.readdirSync(backupDir).filter(n=>!n.endsWith('.lock')).map(n=>{try{return JSON.parse(fs.readFileSync(path.join(backupDir,n,'receipt.json'),'utf8'));}catch{return null;}}).find(v=>v?.root===root&&v?.manifestHash===hash(JSON.stringify(manifest))&&v?.status==='installed');if(!match){console.log('ALREADY_PRESENT=PASS: all packaged files match; no repository files changed.');console.log('BACKUP_ID=NONE_NO_MUTATION');console.log('ROLLBACK_COMMAND=UNAVAILABLE_NO_INSTALLATION_RECEIPT');return {root,status:'already-present',id:null,manifestHash:hash(JSON.stringify(manifest))};}console.log('IDEMPOTENT=PASS');printRollback(match.id,root);return match;}
  for(let i=0;i<rows.length;i++)if(current[i]!== (rows[i].before==='NEW'?null:rows[i].before))throw Error((rows[i].before==='NEW'?'Unexpected new-file collision: ':'Source conflict: ')+rows[i].path);
  const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID(),dir=backupPath(id);fs.mkdirSync(dir);
  const receipt={id,root,manifestHash:hash(JSON.stringify(manifest)),status:'prepared',files:[],createdDirectories:[]};
  for(const row of rows){const mode=row.before==='NEW'?0o644:fs.statSync(row.target).mode&0o777;let original=null;if(row.before!=='NEW'){original=fs.readFileSync(row.target);if(hash(original)!==row.before)throw Error('Concurrent change before backup: '+row.path);const saved=path.join(dir,'originals',row.path);fs.mkdirSync(path.dirname(saved),{recursive:true});fs.writeFileSync(saved,original,{flag:'wx',mode:0o600});}receipt.files.push({...row,mode});}
  const receiptFile=path.join(dir,'receipt.json');fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2),{flag:'wx',mode:0o600});
  console.log('BACKUP_ID='+id);
  const applied=[];
  try{
   for(let i=0;i<rows.length;i++){const row=rows[i];concurrentHook?.(i,row);noLinks(row.target);const bytes=fs.readFileSync(path.join(packageRoot,'payload',row.path));if(hash(bytes)!==row.after)throw Error('Payload changed during installation: '+row.path);stagedWrite(row.target,bytes,row.before==='NEW'?null:row.before,receipt.files[i].mode,receipt.createdDirectories);applied.push(row);if(simulateFailureAfter===i+1)throw Error('Simulated partial-write failure');}
   if(rows.some(r=>digest(r.target)!==r.after))throw Error('Installed hash mismatch');receipt.status='installed';fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2));console.log('INSTALL=PASS');printRollback(id,root);return receipt;
  }catch(error){const conflicts=[];for(const row of applied.reverse()){try{noLinks(row.target);if(digest(row.target)!==row.after)throw Error('Later edit protected');if(row.before==='NEW')fs.unlinkSync(row.target);else{const bytes=fs.readFileSync(path.join(dir,'originals',row.path));if(hash(bytes)!==row.before)throw Error('Backup corruption');stagedWrite(row.target,bytes,row.after,receipt.files.find(r=>r.path===row.path).mode);}}catch(e){conflicts.push(row.path+': '+e.message);}}
   for(const d of [...receipt.createdDirectories].reverse()){try{noLinks(d);fs.rmdirSync(d);}catch(e){if(!['ENOENT','ENOTEMPTY'].includes(e.code))conflicts.push(d+': '+e.message);}}
   receipt.status=conflicts.length?'recovery-conflict':'restored-after-failure';receipt.conflicts=conflicts;fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2));console.error('BACKUP_ID='+id);if(conflicts.length)throw Error(error.message+'; manual recovery required: '+conflicts.join(', '));throw error;
  }
 }finally{release();}
}
export function shellQuote(value){return "'"+String(value).replaceAll("'", "'\\''")+"'";}
function printRollback(id,root){console.log('BACKUP_ID='+id);console.log('ROLLBACK_COMMAND=node '+[path.join(packageRoot,'rollback.mjs'),root,id].map(shellQuote).join(' '));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{if(process.argv.length!==3)throw Error('Usage: node install.mjs /path/to/angelcare-platform');install(process.argv[2]);}catch(e){console.error(e.message);process.exitCode=1;}}
