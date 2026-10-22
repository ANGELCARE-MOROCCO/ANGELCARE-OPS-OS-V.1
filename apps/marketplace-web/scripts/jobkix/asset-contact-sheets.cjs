/** Asset inspection artifacts only. These are not rendered interface screenshots. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto');
const app=path.resolve(__dirname,'../..'),evidence=path.join(app,'docs/jobkix/evidence/asset-review');
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const label=(text,width=800)=>Buffer.from(`<svg width="${width}" height="36"><rect width="100%" height="100%" fill="#071425"/><text x="12" y="24" font-family="Arial" font-size="16" fill="white">${escape(text)}</text></svg>`);
async function main(){
 fs.mkdirSync(evidence,{recursive:true});const assets=JSON.parse(fs.readFileSync(path.join(app,'docs/jobkix/asset-register.json'))).filter(asset=>asset.id.startsWith('setting-'));
 const overview=[];
 for(let i=0;i<assets.length;i++){
  const asset=assets[i],desktop=asset.files.find(file=>!file.path.endsWith('-mobile.webp')),bytes=fs.readFileSync(path.join(app,desktop.path));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==desktop.sha256)throw Error('Asset hash drift: '+asset.id);
  overview.push({input:await sharp(bytes).resize(400,267,{fit:'cover'}).toBuffer(),left:(i%4)*400,top:Math.floor(i/4)*303},{input:label(asset.id,400),left:(i%4)*400,top:Math.floor(i/4)*303+267});
 }
 await sharp({create:{width:1600,height:Math.ceil(assets.length/4)*303,channels:3,background:'#fff'}}).composite(overview).webp({quality:94}).toFile(path.join(evidence,'all-settings-contact.webp'));
 const pages=[];
 for(let offset=0;offset<assets.length;offset+=4){const composites=[];
  for(let i=0;i<Math.min(4,assets.length-offset);i++){const asset=assets[offset+i],meta=await sharp(asset.source).metadata(),width=meta.width,height=meta.height;
   const upper=await sharp(asset.source).extract({left:0,top:0,width,height:Math.round(height*.72)}).resize(800,420,{fit:'contain',background:'#f0f1f5'}).png().toBuffer();
   const hands=await sharp(asset.source).extract({left:Math.round(width*.12),top:Math.round(height*.39),width:Math.round(width*.76),height:Math.round(height*.48)}).resize(800,420,{fit:'contain',background:'#f0f1f5'}).png().toBuffer();
   const top=i*456;composites.push({input:label(asset.id+' · faces and setting'),left:0,top},{input:label(asset.id+' · hands and objects'),left:800,top},{input:upper,left:0,top:top+36},{input:hands,left:800,top:top+36});
  }
  const filename='settings-details-'+(Math.floor(offset/4)+1)+'.png';await sharp({create:{width:1600,height:Math.min(4,assets.length-offset)*456,channels:3,background:'#fff'}}).composite(composites).png().toFile(path.join(evidence,filename));pages.push(filename);
 }
 fs.writeFileSync(path.join(evidence,'index.json'),JSON.stringify({kind:'Actual asset contact and detail inspection artifacts, not implementation screenshots',assets:assets.map(asset=>({id:asset.id,sourceSha256:asset.originalSha256})),overview:'all-settings-contact.webp',detailPages:pages},null,2)+'\n');
 console.log('ASSET_INSPECTION_SHEETS='+assets.length+' compositions; '+pages.length+' detail pages');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
