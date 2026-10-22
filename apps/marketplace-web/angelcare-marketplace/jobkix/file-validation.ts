import { createHash } from 'node:crypto';
import { PDFDocument,PDFDict,PDFArray,PDFName,PDFStream,type PDFObject } from 'pdf-lib';
import { JobkixFault } from './contracts';
export const MAX_FILE_BYTES=20*1024*1024;
export const FILE_POLICY='jobkix-static-content-v1';
const fail=()=>{throw new JobkixFault('INVALID_INPUT',{file:'unsupported_or_active_content'});};
export function safeFilename(value:string){const name=value.normalize('NFC').trim();if(!name||name.length>240||/[\\/\u0000-\u001f\u007f]/.test(name)||name.startsWith('.'))fail();return name;}
/** Structural static-content validation. This is not a malware-engine certification. */
export async function validateDocument(bytes:Uint8Array,filename:string,mime:string,purpose:string){
 const name=safeFilename(filename);if(!bytes.length||bytes.length>MAX_FILE_BYTES)fail();
 if(purpose==='cv'&&mime!=='application/pdf')fail();
 try{
  if(mime==='application/pdf'){
   if(!/\.pdf$/i.test(name)||Buffer.from(bytes.subarray(0,8)).toString('ascii').slice(0,5)!=='%PDF-'||!Buffer.from(bytes.subarray(Math.max(0,bytes.length-1024))).toString('latin1').trimEnd().endsWith('%%EOF'))fail();
   const doc=await PDFDocument.load(bytes,{ignoreEncryption:false,throwOnInvalidObject:true,updateMetadata:false});if(doc.getPageCount()<1||doc.getPageCount()>200)fail();
   const visited=new Set<PDFObject>(),stack:PDFObject[]=doc.context.enumerateIndirectObjects().map(([,object])=>object);let count=0;
   const forbidden=new Set(['JS','JavaScript','AA','OpenAction','Launch','EmbeddedFile','EmbeddedFiles','RichMedia','XFA','AcroForm','SubmitForm','ImportData','GoToR','GoToE']);
   while(stack.length){const item=stack.pop();if(!item||visited.has(item))continue;visited.add(item);if(++count>100000)fail();
    if(item instanceof PDFName&&forbidden.has(item.decodeText()))fail();
    if(item instanceof PDFStream)stack.push(item.dict);
    if(item instanceof PDFDict)for(const [key,value] of item.entries()){if(forbidden.has(key.decodeText()))fail();stack.push(value);}
    if(item instanceof PDFArray)stack.push(...item.asArray());
   }
  }else if(mime==='image/png'||mime==='image/jpeg'){
   if(mime==='image/png'){
    const data=Buffer.from(bytes);if(data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.subarray(12,16).toString('ascii')!=='IHDR')fail();
    const width=data.readUInt32BE(16),height=data.readUInt32BE(20);if(!width||!height||width>12000||height>12000||width*height>16000000)fail();
   }
   const doc=await PDFDocument.create();const image=mime==='image/png'?await doc.embedPng(bytes):await doc.embedJpg(bytes);
   if(image.width<1||image.height<1||image.width>12000||image.height>12000||image.width*image.height>16000000)fail();
   if(mime==='image/png'&&!/\.png$/i.test(name)||mime==='image/jpeg'&&!/\.jpe?g$/i.test(name))fail();
  }else fail();
 }catch(error){if(error instanceof JobkixFault)throw error;fail();}
 const sha256=createHash('sha256').update(bytes).digest('hex');return {filename:name,mime,bytes:bytes.length,sha256,validationReference:FILE_POLICY+':'+sha256};
}
