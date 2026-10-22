// Deterministic extraction of the user-supplied raster masters. No logo is redrawn.
// Source RGB is unchanged in opaque foreground interiors. Only background and
// antialiased edge contamination are removed; crop coordinates remain registered.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('sharp');
const root=path.resolve(__dirname,'../..');
const registryPath=path.join(root,'docs/jobkix/brand-register.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
async function extract(original,role){
 const bytes=fs.readFileSync(path.join(root,original.preservedPath));
 if(sha(bytes)!==original.sha256)throw Error('Original changed: '+role);
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,count=width*height,seeds=new Uint8Array(count),out=Buffer.alloc(count*4),background=[];
 for(let y=0;y<height;y++){
  const sides=[[],[]];
  for(let x=8;x<56;x++)for(let c=0;c<3;c++){
   (sides[0][c]||= []).push(data[(y*width+x)*3+c]);
   (sides[1][c]||= []).push(data[(y*width+width-1-x)*3+c]);
  }
  background.push(sides.map(side=>side.map(median)));
 }
 for(let i=0;i<count;i++){
  const r=data[i*3],g=data[i*3+1],b=data[i*3+2];
  seeds[i]=((role==='color'?Math.max(r,g,b)<115:Math.min(r,g,b)>215)||
   (b>225&&r<130&&g<140)||(r>240&&g<165&&b<155))?1:0;
 }
 let left=width,top=height,right=0,bottom=0,opaque=0,partial=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,p=i*3,q=i*4;let alpha=0,foreground=null;
  if(seeds[i]){alpha=1;foreground=[data[p],data[p+1],data[p+2]];opaque++;}
  else{
   let best=Infinity,nearest=-1;
   for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
    const xx=x+dx,yy=y+dy,d=dx*dx+dy*dy;
    if(xx<0||xx>=width||yy<0||yy>=height||d>=best||!seeds[yy*width+xx])continue;
    best=d;nearest=yy*width+xx;
   }
   if(nearest<0)continue;
   const bg=background[y][0].map((v,c)=>v+(background[y][1][c]-v)*x/(width-1));
   const fg=[0,1,2].map(c=>data[nearest*3+c]);
   let numerator=0,denominator=0;
   for(let c=0;c<3;c++){const d=fg[c]-bg[c];numerator+=(data[p+c]-bg[c])*d;denominator+=d*d;}
   alpha=Math.max(0,Math.min(1,numerator/denominator));
   // Background texture cannot become a low-opacity halo around the mark.
   if(alpha<.035)continue;
   foreground=bg.map((v,c)=>Math.max(0,Math.min(255,(data[p+c]-(1-alpha)*v)/alpha)));
   partial++;
  }
  for(let c=0;c<3;c++)out[q+c]=Math.round(foreground[c]);out[q+3]=Math.round(alpha*255);
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(opaque<100000||partial<100||right-left<1000)throw Error('Invalid extraction bounds: '+role);
 const padding=16,crop={left:Math.max(0,left-padding),top:Math.max(0,top-padding),width:Math.min(width,right+padding+1)-Math.max(0,left-padding),height:Math.min(height,bottom+padding+1)-Math.max(0,top-padding)};
 const relative='public/jobkix/brand/jobkix-logo-'+role+'.png';
 await sharp(out,{raw:{width,height,channels:4}}).extract(crop).png({compressionLevel:9}).toFile(path.join(root,relative));
 return record(relative,original,{method:'Deterministic foreground/edge matting against row-wise sampled original background; no redraw, mirroring, recoloring or geometric transform',crop,opaqueSourcePixelsPreserved:opaque,edgePixels:partial,usage:role==='white'?'Dark JOBKIX footer only':'JOBKIX header and compact Marketplace brand shortcut'});
}
async function record(relative,original,extra){const bytes=fs.readFileSync(path.join(root,relative)),meta=await sharp(bytes).metadata();return {path:relative,source:original.preservedPath,sourceSha256:original.sha256,sha256:sha(bytes),bytes:bytes.length,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,...extra};}
(async()=>{
 const register=JSON.parse(fs.readFileSync(registryPath));fs.mkdirSync(path.join(root,'public/jobkix/brand'),{recursive:true});
 const derivatives=[];
 for(const role of ['color','white'])derivatives.push(await extract(register.originals.find(o=>o.preservedPath.endsWith('-'+role+'.png')),role));
 const original=register.originals.find(o=>o.preservedPath.endsWith('-favicon.png')),bytes=fs.readFileSync(path.join(root,original.preservedPath));
 if(sha(bytes)!==original.sha256)throw Error('Favicon original changed');
 for(const size of [16,32,48,180,192,512]){const relative='public/jobkix/brand/jobkix-'+(size<100?'favicon-':'icon-')+size+'.png';await sharp(bytes).resize(size,size,{fit:'contain',kernel:'lanczos3'}).png({compressionLevel:9}).toFile(path.join(root,relative));derivatives.push(await record(relative,original,{method:'Proportional Lanczos resize of complete square original; no redraw',usage:'JOBKIX namespace only'}));}
 register.derivatives=derivatives;register.processing={approvedByUser:'Deterministic pixel-based background removal, preserving the original logo geometry',rejectedAttempts:'Two image-generation extractions were rejected for visible glow/blotches. Neither is shipped.',visualReview:'PENDING'};
 fs.writeFileSync(registryPath,JSON.stringify(register,null,2)+'\n');
 console.log('BRAND_DERIVATIVES='+derivatives.length);console.log(derivatives.map(d=>d.path+' '+d.width+'x'+d.height+' '+d.bytes+' bytes').join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1;});
