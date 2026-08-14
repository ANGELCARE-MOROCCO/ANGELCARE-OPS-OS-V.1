import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { DocumentBlock, DocumentTemplateRecord } from './types'

const safe=(value:unknown)=>String(value??'').replace(/[\r\n\t]+/g,' ').trim()
const money=(value:unknown)=>`${Number(value||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} Dh`
type Section={key?:string;title:string;rows:Array<[string,unknown]>}
type PdfColor={r:number;g:number;b:number}
const NAMED:Record<string,PdfColor>={navy:{r:.04,g:.12,b:.25},red:{r:.66,g:.04,b:.12},graphite:{r:.16,g:.19,b:.24}}
function accent(value:string){const key=safe(value).toLowerCase();if(NAMED[key])return NAMED[key];const m=key.match(/^#?([0-9a-f]{6})$/i);if(!m)return NAMED.navy;const h=m[1];return{r:parseInt(h.slice(0,2),16)/255,g:parseInt(h.slice(2,4),16)/255,b:parseInt(h.slice(4,6),16)/255}}
function wrap(text:string,max=78){const words=safe(text).split(/\s+/).filter(Boolean);if(!words.length)return['—'];const lines:string[]=[];let line='';for(const word of words){if(!line)line=word;else if(`${line} ${word}`.length<=max)line+=` ${word}`;else{lines.push(line);line=word}}if(line)lines.push(line);return lines}
function blocks(template:DocumentTemplateRecord,sections:Section[]):DocumentBlock[]{const raw=template.settings?.blocks;if(Array.isArray(raw)&&raw.length)return raw.filter(x=>x&&typeof x==='object') as DocumentBlock[];return[{id:'title',type:'title',label:'Titre',visible:true},...sections.map((s,i)=>({id:`section-${i}`,type:'table' as const,label:s.title,sectionKey:s.key||s.title,visible:true,width:100 as const})),{id:'legal',type:'legal',label:'Mentions légales',visible:Boolean(template.legal_text)}]}
const sectionFor=(block:DocumentBlock,sections:Section[])=>sections.find(s=>s.key===block.sectionKey||s.title===block.sectionKey||s.title===block.label)

export async function buildEnterprisePdf(input:{template:DocumentTemplateRecord;reference:string;title:string;subtitle?:string;sections:Section[]}):Promise<Uint8Array>{
 const pdf=await PDFDocument.create(), landscape=input.template.orientation==='landscape', base:[number,number]=input.template.page_size==='A3'?[841.89,1190.55]:[595.28,841.89], dims:[number,number]=landscape?[base[1],base[0]]:base
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),brand=accent(input.template.accent),margin=44
 let logo:Awaited<ReturnType<typeof pdf.embedPng>>|null=null
 try{const configured=safe(input.template.logo_path||'/logo.png').replace(/^\/+/,''),bytes=await fs.readFile(path.join(process.cwd(),'public',configured));logo=await pdf.embedPng(bytes)}catch{logo=null}
 let qr:Awaited<ReturnType<typeof pdf.embedPng>>|null=null
 try{const png=await QRCode.toBuffer(input.reference||input.title,{type:'png',margin:0,width:256,errorCorrectionLevel:'M'});qr=await pdf.embedPng(png)}catch{qr=null}
 const createPage=()=>{const page=pdf.addPage(dims),{width,height}=page.getSize();page.drawRectangle({x:0,y:height-8,width,height:8,color:rgb(brand.r,brand.g,brand.b)});if(logo){const scale=Math.min(112/logo.width,40/logo.height);page.drawImage(logo,{x:margin,y:height-70,width:logo.width*scale,height:logo.height*scale})}else page.drawText('ANGELCARE',{x:margin,y:height-50,size:18,font:bold,color:rgb(brand.r,brand.g,brand.b)});page.drawText(safe(input.template.header_title||'ANGELCARE').slice(0,42),{x:width-265,y:height-42,size:10,font:bold,color:rgb(brand.r,brand.g,brand.b)});if(input.template.header_subtitle)page.drawText(safe(input.template.header_subtitle).slice(0,48),{x:width-265,y:height-55,size:7.5,font,color:rgb(.32,.38,.46)});page.drawText(safe(input.reference).slice(0,54),{x:width-265,y:height-67,size:7.5,font,color:rgb(.32,.38,.46)});return page}
 let page=createPage(),y=page.getHeight()-108
 const ensure=(needed=48)=>{if(y<90+needed){page=createPage();y=page.getHeight()-98}}
 const dynamic=(value:string)=>value.replaceAll('{{reference}}',input.reference).replaceAll('{{title}}',input.title).replaceAll('{{subtitle}}',input.subtitle||'').replaceAll('{{generated_at}}',new Date().toLocaleString('fr-FR'))
 const drawText=(value:string,size=9,color=rgb(.08,.11,.16),max=landscape?120:82)=>{for(const line of wrap(dynamic(value),max)){ensure(size+10);page.drawText(line,{x:margin,y,size,font,color});y-=size+4}}
 const drawTable=(section:Section)=>{ensure(40);page.drawText(safe(section.title).toUpperCase().slice(0,70),{x:margin,y,size:9.5,font:bold,color:rgb(brand.r,brand.g,brand.b)});y-=17;for(const [label,raw]of section.rows){const value=typeof raw==='number'&&/amount|total|montant|revenu|solde|balance|credit/i.test(label)?money(raw):safe(raw)||'—';const lines=wrap(value,landscape?105:72).slice(0,8);ensure(Math.max(22,lines.length*13+6));page.drawText(safe(label).slice(0,34),{x:margin,y,size:8,font:bold,color:rgb(.25,.29,.35)});lines.forEach((line,index)=>page.drawText(line,{x:margin+170,y:y-index*13,size:8.4,font,color:rgb(.08,.11,.16)}));y-=Math.max(17,lines.length*13)}y-=8}
 for(const block of blocks(input.template,input.sections).filter(b=>b.visible!==false)){
  const size=block.size==='lg'?20:block.size==='sm'?8.3:11
  if(block.type==='title'){ensure(60);page.drawText(safe(input.title).slice(0,80),{x:margin,y,size:22,font:bold,color:rgb(.04,.12,.25)});y-=27;if(input.subtitle)drawText(input.subtitle,9.5,rgb(.3,.35,.42));y-=7;continue}
  if(block.type==='text'){drawText(block.text||block.label,size);y-=6;continue}
  if(block.type==='divider'){ensure(12);page.drawLine({start:{x:margin,y},end:{x:page.getWidth()-margin,y},thickness:1,color:rgb(.83,.86,.9)});y-=14;continue}
  if(block.type==='spacer'){y-=Number(block.settings?.height||24);continue}
  if(block.type==='qr'){if(qr){ensure(100);const qrSize=Number(block.settings?.size||76);page.drawImage(qr,{x:block.align==='right'?page.getWidth()-margin-qrSize:block.align==='center'?(page.getWidth()-qrSize)/2:margin,y:y-qrSize,width:qrSize,height:qrSize});y-=qrSize+12}else drawText(input.reference,8);continue}
  if(block.type==='signature'){ensure(90);const cols=Array.isArray(block.settings?.signatories)?block.settings.signatories.map(String):['Opérateur / Autorité'];const width=(page.getWidth()-margin*2-24*Math.max(0,cols.length-1))/Math.max(1,cols.length);cols.forEach((name,index)=>{const x=margin+index*(width+24);page.drawLine({start:{x,y:y-38},end:{x:x+width,y:y-38},thickness:.7,color:rgb(.45,.48,.52)});page.drawText(name.slice(0,30),{x,y:y-51,size:7.5,font:bold,color:rgb(.3,.34,.4)})});y-=72;continue}
  if(block.type==='legal'){const legal=block.text||input.template.legal_text||'';if(legal){ensure(42);drawText(legal,6.5,rgb(.45,.48,.52),landscape?145:98);y-=5}continue}
  if(block.type==='image'){const src=safe(block.src);if(src){try{const bytes=await fs.readFile(path.join(process.cwd(),'public',src.replace(/^\/+/,''))),img=await pdf.embedPng(bytes),maxW=Number(block.settings?.maxWidth||220),scale=Math.min(maxW/img.width,100/img.height);ensure(img.height*scale+12);page.drawImage(img,{x:margin,y:y-img.height*scale,width:img.width*scale,height:img.height*scale});y-=img.height*scale+12}catch{drawText(`[Image indisponible: ${src}]`,7,rgb(.6,.2,.2))}}continue}
  const section=sectionFor(block,input.sections);if(section)drawTable(section)
 }
 const pages=pdf.getPages();pages.forEach((current,index)=>{const{width}=current.getSize(),footer=safe(input.template.footer_text||'ANGELCARE Marketplace Enterprise Command');current.drawText(footer.slice(0,78),{x:margin,y:30,size:7.3,font,color:rgb(.4,.43,.48)});if(input.template.settings?.showPageNumbers!==false)current.drawText(`${index+1}/${pages.length}`,{x:width-65,y:30,size:7,font,color:rgb(.45,.48,.52)})})
 return pdf.save()
}
