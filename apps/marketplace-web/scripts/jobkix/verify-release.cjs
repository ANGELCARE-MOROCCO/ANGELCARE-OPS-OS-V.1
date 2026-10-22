/** Validate the actual ZIP and shipped tools using a disposable baseline; never mutates the user's repo. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function snapshot(root){const rows=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name),stat=fs.lstatSync(file);assert.ok(!stat.isSymbolicLink());rows.push({path:path.relative(root,file),mode:stat.mode&0o777,type:entry.isDirectory()?'directory':'file',...(entry.isFile()?{hash:hash(fs.readFileSync(file))}:{})});if(entry.isDirectory())walk(file);}}walk(root);return rows.sort((a,b)=>a.path.localeCompare(b.path));}
async function main(){
 if(process.argv.length!==4)throw Error('Usage: node scripts/jobkix/verify-release.cjs ABSOLUTE_ZIP_PATH REPORT_PATH');
 const archive=path.resolve(process.argv[2]),reportPath=path.resolve(process.argv[3]);if(fs.existsSync(reportPath))throw Error('Report already exists; choose a new evidence path');
 const archiveStat=fs.lstatSync(archive);assert.ok(archiveStat.isFile()&&!archiveStat.isSymbolicLink()&&archiveStat.size>0);
 const base=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'jobkix-extracted-acceptance-')),extraction=path.join(base,'extracted');fs.mkdirSync(extraction);
 const checks=[];
 const python=String.raw`import sys,zipfile,pathlib,stat
archive,destination=sys.argv[1:]
with zipfile.ZipFile(archive) as z:
 names=set();roots=set();total=0
 for e in z.infolist():
  p=pathlib.PurePosixPath(e.filename)
  if p.is_absolute() or '\\' in e.filename or any(x in ('','..','.') for x in e.filename.rstrip('/').split('/')) or '\x00' in e.filename:raise Exception('Unsafe ZIP path')
  if e.filename in names:raise Exception('Duplicate ZIP path')
  names.add(e.filename);roots.add(p.parts[0]);total+=e.file_size
  mode=e.external_attr>>16
  if mode and stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR):raise Exception('Unsafe ZIP entry type')
 if len(roots)!=1 or total>8*1024**3:raise Exception('Unexpected archive structure or size')
 if z.testzip() is not None:raise Exception('ZIP integrity failure')
 z.extractall(destination)
 print(next(iter(roots)))`;
 const extracted=spawnSync('python3',['-c',python,archive,extraction],{encoding:'utf8',maxBuffer:1024*1024});assert.equal(extracted.status,0,extracted.stderr);checks.push('ZIP_INTEGRITY_AND_SAFE_EXTRACTION');
 const directory=path.join(extraction,extracted.stdout.trim()),bundle=JSON.parse(fs.readFileSync(path.join(directory,'bundle-manifest.json'))),seen=new Set();
 for(const row of bundle.files){assert.ok(typeof row.path==='string'&&!path.isAbsolute(row.path)&&!row.path.includes('\\')&&row.path.split('/').every(part=>part&&part!=='.'&&part!=='..'));assert.ok(!seen.has(row.path));seen.add(row.path);const file=path.join(directory,row.path),stat=fs.lstatSync(file);assert.ok(stat.isFile()&&!stat.isSymbolicLink());assert.equal(stat.size,row.bytes);assert.equal(hash(fs.readFileSync(file)),row.sha256,row.path);}
 const actual=snapshot(directory).filter(row=>row.type==='file').map(row=>row.path).sort();assert.deepEqual(actual,[...seen,'bundle-manifest.json'].sort());checks.push('EVERY_ARCHIVE_FILE_HASH');
 const installer=await import(pathToFileURL(path.join(directory,'install.mjs')).href),rollback=await import(pathToFileURL(path.join(directory,'rollback.mjs')).href),manifest=installer.loadPackage();checks.push('EVERY_PAYLOAD_FILE_HASH_AND_SCOPE');
 const root=path.join(base,'repository');fs.cpSync(path.join(directory,'baseline'),root,{recursive:true,errorOnExist:true});
 const unrelated=path.join(root,'unrelated-user-file.txt');fs.writeFileSync(unrelated,'unrelated work must survive\n',{mode:0o600});const before=snapshot(root);
 assert.throws(()=>installer.install(root,{simulateFailureAfter:7}),/Simulated partial-write failure/);assert.deepEqual(snapshot(root),before);checks.push('ACTUAL_PAYLOAD_PARTIAL_FAILURE_EXACT_RECOVERY');
 const receipt=installer.install(root);assert.equal(receipt.status,'installed');checks.push('SHIPPED_INSTALL_SUCCESS');
 const verified=spawnSync(process.execPath,[path.join(directory,'verify.mjs'),root],{encoding:'utf8'});assert.equal(verified.status,0,verified.stderr);checks.push('SHIPPED_VERIFY_SUCCESS');
 const again=installer.install(root);assert.equal(again.id,receipt.id);checks.push('IDEMPOTENT_REAPPLICATION');
 const first=manifest.files[0],target=path.join(root,first.path),installed=fs.readFileSync(target);fs.appendFileSync(target,'\nlater user edit\n');const edited=snapshot(root);
 assert.throws(()=>rollback.rollback(root,receipt.id),/Rollback refused/);assert.deepEqual(snapshot(root),edited);fs.writeFileSync(target,installed);checks.push('ROLLBACK_PROTECTS_LATER_EDITS');
 rollback.rollback(root,receipt.id);assert.deepEqual(snapshot(root),before);checks.push('SHIPPED_ROLLBACK_EXACT_BASELINE_RESTORATION');
 const result={recordedAt:new Date().toISOString(),status:'PASS',classification:'SOURCE_PACKAGE_VERIFICATION_NOT_PRODUCT_OR_PRODUCTION_ACCEPTANCE',archive,bytes:archiveStat.size,sha256:hash(fs.readFileSync(archive)),payloadFiles:manifest.files.length,bundleFiles:bundle.files.length+1,checks,fixture:root,extractedPackage:directory,limitations:['Disposable target baseline includes only original affected shared files and package identity files, plus an unrelated-file preservation sentinel. No complete live repository, hosted services, production SQL, application build or deployment is exercised.','Original 73-family/455-language/27-front contract acceptance remains incomplete; standby integrations are not passing production checks.']};
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
}
main().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
