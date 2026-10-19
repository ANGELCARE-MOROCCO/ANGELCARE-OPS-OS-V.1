/* DCE R4 targeted gateway extension. No service, credentials or media changes. */
'use strict'
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process')
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const edits=[
 ["const {inspectMp3}=require('./mp3')","const {inspectMp3}=require('./mp3')\nconst {PPTX,ODP,detectPresentation}=require('./dce-formats')"],
 ["ALLOWED_MIME.add('audio/mpeg')","ALLOWED_MIME.add('audio/mpeg')\nALLOWED_MIME.add(PPTX);ALLOWED_MIME.add(ODP)"],
 ["return null}\nfunction extensionMatches", "return detectPresentation(file)}\nfunction extensionMatches"],
 ["'application/pdf':['.pdf']}","'application/pdf':['.pdf'],[PPTX]:['.pptx'],[ODP]:['.odp']}"],
 ["if(mime==='audio/mpeg'){if(activeAudioUploads.has(assetId))", "if(['audio/mpeg',PPTX,ODP].includes(mime)){if(activeAudioUploads.has(assetId))"]
]
function regular(p){if(fs.lstatSync(p).isSymbolicLink()||!fs.statSync(p).isFile())throw Error('Regular file required: '+p)}
function atomic(p,bytes){const tmp=p+'.dce-'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(tmp,bytes,{flag:'wx'});fs.renameSync(tmp,p)}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp)}}
function apply(directory,{check=false}={}){
 const dir=fs.realpathSync(directory),server=path.join(dir,'server.js'),helper=path.join(dir,'dce-formats.js');regular(server)
 const original=fs.readFileSync(server),helperBytes=fs.readFileSync(path.join(__dirname,'dce-formats.js'));let candidate=original.toString();
 for(const[before,after]of edits){if(candidate.includes(after))continue;if(candidate.split(before).length!==2)throw Error('Unrecognised gateway anchor; no overwrite: '+before.slice(0,65));candidate=candidate.replace(before,after)}
 if(fs.existsSync(helper)){regular(helper);if(hash(fs.readFileSync(helper))!==hash(helperBytes))throw Error('Different dce-formats.js preserved; reconcile before activation.')}
 const bytes=Buffer.from(candidate);if(check){console.log('GATEWAY_PREFLIGHT=PASS; no writes');return}
 if(hash(original)===hash(bytes)&&fs.existsSync(helper)){console.log('GATEWAY_DCE_R4=ALREADY_APPLIED');return}
 const temp=path.join(dir,'.dce-check-'+crypto.randomUUID()+'.cjs');try{fs.writeFileSync(temp,bytes,{flag:'wx'});const syntax=cp.spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});if(syntax.status!==0)throw Error('Candidate syntax rejected; no live file changed.')}finally{if(fs.existsSync(temp))fs.unlinkSync(temp)}
 const backup=path.join(dir,'.dce-backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomUUID().slice(0,8));fs.mkdirSync(backup,{recursive:true,mode:0o700});
 const files=[{name:'server.js',before:hash(original),after:hash(bytes)},{name:'dce-formats.js',before:fs.existsSync(helper)?hash(fs.readFileSync(helper)):null,after:hash(helperBytes)}];
 for(const f of files)if(f.before){fs.copyFileSync(path.join(dir,f.name),path.join(backup,f.name));if(hash(fs.readFileSync(path.join(backup,f.name)))!==f.before)throw Error('Backup verification failed.')}
 fs.writeFileSync(path.join(backup,'state.json'),JSON.stringify({dir,files},null,2),{mode:0o600});fs.copyFileSync(path.join(__dirname,'rollback-dce-gateway.cjs'),path.join(backup,'rollback.cjs'))
 if(hash(fs.readFileSync(server))!==hash(original))throw Error('Gateway changed during preflight; existing edit preserved.')
 try{atomic(helper,helperBytes);atomic(server,bytes);for(const f of files)if(hash(fs.readFileSync(path.join(dir,f.name)))!==f.after)throw Error('Installed hash mismatch.')}
 catch(error){for(const f of files){const target=path.join(dir,f.name);if(fs.existsSync(target)&&![f.before,f.after].includes(hash(fs.readFileSync(target))))continue;if(f.before)atomic(target,fs.readFileSync(path.join(backup,f.name)));else if(fs.existsSync(target))fs.unlinkSync(target)}throw error}
 console.log('GATEWAY_DCE_R4=APPLIED');console.log('BACKUP='+backup);console.log('ROLLBACK_COMMAND=node '+JSON.stringify(path.join(backup,'rollback.cjs')));console.log('Restart only the existing Marketplace media gateway separately. No restart performed.');return{backup}
}
module.exports={apply}
if(require.main===module){try{if(!process.argv[2])throw Error('Pass the existing Windows gateway code folder.');apply(process.argv[2],{check:process.argv.includes('--check')})}catch(e){console.error('GATEWAY_STOPPED='+e.message);process.exitCode=1}finally{console.log('TERMINAL_REMAINS_OPEN')}}
