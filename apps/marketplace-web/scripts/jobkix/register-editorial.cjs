const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('sharp');
const app=path.resolve(__dirname,'../..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function main(){
 const [name,source,subject,promptFile]=process.argv.slice(2);
 if(!name||!/^[a-z0-9-]+$/.test(name)||!source||!subject||!promptFile)throw Error('Usage: register-editorial name original-png subject prompt-file');
 const dir=path.join(app,'public/jobkix/editorial');fs.mkdirSync(dir,{recursive:true});
 const desktop=path.join(dir,name+'.webp'),mobile=path.join(dir,name+'-mobile.webp');
 if(fs.existsSync(desktop)||fs.existsSync(mobile))throw Error('Existing asset collision');
 const original=fs.readFileSync(source),metadata=await sharp(original).metadata();
 await sharp(original).rotate().resize({width:1920,withoutEnlargement:true}).webp({quality:86,effort:6}).toFile(desktop);
 const cropLeft=name==='home-hero'?Math.round(metadata.width*0.38):0;
 await sharp(original).extract({left:cropLeft,top:0,width:metadata.width-cropLeft,height:metadata.height}).resize({width:1000,withoutEnlargement:true}).webp({quality:86,effort:6}).toFile(mobile);
 const files=[];
 for(const file of [desktop,mobile]){const bytes=fs.readFileSync(file),m=await sharp(bytes).metadata();files.push({path:path.relative(app,file),width:m.width,height:m.height,bytes:bytes.length,sha256:hash(bytes)});}
 const registry=path.join(app,'docs/jobkix/asset-register.json');const records=fs.existsSync(registry)?JSON.parse(fs.readFileSync(registry,'utf8')):[];
 records.push({id:name,subject,purpose:name==='home-hero'?'P00 editorial homepage opening':'Profession/setting editorial discovery',source,originalSha256:hash(original),originalDimensions:{width:metadata.width,height:metadata.height},provenance:'OpenAI built-in image_gen; AI-generated fictional editorial imagery, not a human photographer or an actual employer, employee or platform success story.',rights:'Generated for this user task. No third-party employer branding or identifiable real workplace was supplied.',prompt:fs.readFileSync(promptFile,'utf8'),focalDesktop:{x:75,y:50},focalMobile:{x:50,y:50},visualInspection:'PENDING_LARGE_DETAIL_AND_CROP_REVIEW',files});
 fs.writeFileSync(registry,JSON.stringify(records,null,2)+'\n');console.log('ASSET_REGISTERED='+name);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
