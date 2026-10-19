/* Guarded two-file source rollback; no restart or media changes. */
'use strict'
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
try{const state=JSON.parse(fs.readFileSync(path.join(__dirname,'state.json')));for(const f of state.files){const p=path.join(state.dir,f.name);if(!fs.existsSync(p)||fs.lstatSync(p).isSymbolicLink()||hash(fs.readFileSync(p))!==f.after)throw Error('Later gateway edit preserved: '+f.name);if(f.before&&hash(fs.readFileSync(path.join(__dirname,f.name)))!==f.before)throw Error('Backup hash mismatch.')}
for(const f of state.files){const p=path.join(state.dir,f.name);if(f.before)fs.copyFileSync(path.join(__dirname,f.name),p);else fs.unlinkSync(p)}console.log('GATEWAY_SOURCE_ROLLBACK=PASS; restart the existing gateway separately.')}
catch(e){console.error('ROLLBACK_STOPPED='+e.message);process.exitCode=1}finally{console.log('TERMINAL_REMAINS_OPEN')}
