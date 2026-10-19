'use strict'
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{randomBytes}=require('node:crypto')
try{
 const output=path.resolve(process.argv[2]||path.join(os.homedir(),'Downloads')),origin=(process.argv[3]||'https://my.angelcarehub.com').replace(/\/$/,'');if(new URL(origin).protocol!=='https:')throw Error('Use the existing HTTPS Marketplace origin.');
 const token=process.env.MARKETPLACE_DCE_PROCESSOR_TOKEN||randomBytes(32).toString('hex'),analytics=process.env.MARKETPLACE_DCE_ANALYTICS_SECRET||randomBytes(32).toString('hex');if(token.length<32||analytics.length<32)throw Error('Configured secrets need at least 32 characters.');
 const files=[['ANGELCARE_DCE_MARKETPLACE_ENV_READY.txt',`MARKETPLACE_DCE_PROCESSOR_TOKEN=${token}\nMARKETPLACE_DCE_ANALYTICS_SECRET=${analytics}\n`],['ANGELCARE_DCE_PROCESSOR_ENV_READY.txt',`MARKETPLACE_DCE_ORIGIN=${origin}\nMARKETPLACE_DCE_PROCESSOR_TOKEN=${token}\nMARKETPLACE_DCE_PROCESSOR_ID=dce-processor-01\n`]];
 fs.mkdirSync(output,{recursive:true});for(const [name]of files)if(fs.existsSync(path.join(output,name)))throw Error('Existing configuration preserved: '+name+'; reuse it or choose a different output folder.');
 const written=[];try{for(const[name,body]of files){const p=path.join(output,name);fs.writeFileSync(p,body,{flag:'wx',mode:0o600});written.push(p);console.log('CREATED='+p)}}catch(e){for(const p of written)fs.unlinkSync(p);throw e}
 console.log('CONFIGURATION_PREPARED_ONLY; no production variables, services or files changed.')
}catch(e){console.error('CONFIG_STOPPED='+e.message);process.exitCode=1}finally{console.log('TERMINAL_REMAINS_OPEN')}
