import 'server-only'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CommercialDocumentType, CreditNote, DeliveryNote, Invoice, Payment, Quotation, SalesOrder } from '../types'

type Doc=Quotation|SalesOrder|DeliveryNote|Invoice|CreditNote|Payment
const PAGE:[number,number]=[595.28,841.89]
function text(value:unknown){return String(value??'')}
function amount(value:number){return `${Number(value||0).toFixed(2)} Dh`}
function documentLabel(type:CommercialDocumentType){return{quotation:'DEVIS',sales_order:'COMMANDE',delivery_note:'BON DE LIVRAISON',invoice:'FACTURE',credit_note:'AVOIR',payment_receipt:'REÇU DE PAIEMENT'}[type]}
function filename(type:CommercialDocumentType,number:string){return `ANGELCARE_FLASHCARDS_${documentLabel(type).replaceAll(' ','_')}_${number}.pdf`.replace(/[^A-Z0-9_.-]/gi,'_')}
function bodyArray(bytes:Uint8Array){const copy=new Uint8Array(bytes.byteLength);copy.set(bytes);return copy.buffer}
export async function generateRevenuePdf(type:CommercialDocumentType,doc:Doc){
 const pdf=await PDFDocument.create();const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);let page=pdf.addPage(PAGE);let y=790
 const navy=rgb(.06,.13,.23),red=rgb(.56,.08,.14),muted=rgb(.39,.45,.54),line=rgb(.86,.88,.91)
 const draw=(value:string,x:number,size=10,font=regular,color=navy)=>{page.drawText(value,{x,y,size,font,color,maxWidth:520});y-=size+5}
 page.drawRectangle({x:0,y:808,width:595.28,height:34,color:navy});page.drawText('ANGELCARE',{x:36,y:819,size:12,font:bold,color:rgb(1,1,1)});page.drawRectangle({x:118,y:816,width:8,height:8,color:red})
 page.drawText('FLASHCARDS OS · COMMERCIAL DOCUMENT',{x:345,y:819,size:8,font:bold,color:rgb(.84,.88,.93)})
 y=780;draw(documentLabel(type),36,24,bold,navy);const number=text((doc as any).number);page.drawText(number,{x:390,y:780,size:13,font:bold,color:red});
 page.drawText(`Statut: ${text((doc as any).status)}`,{x:390,y:762,size:9,font:regular,color:muted});
 y=730;page.drawRectangle({x:36,y:650,width:523,height:68,borderColor:line,borderWidth:1,color:rgb(.985,.988,.992)});page.drawText('CLIENT',{x:50,y:698,size:8,font:bold,color:muted});page.drawText(text((doc as any).customerName||'Client ANGELCARE'),{x:50,y:680,size:13,font:bold,color:navy});page.drawText(text((doc as any).billingContact||(doc as any).billingIdentity||(doc as any).deliveryAddress||''),{x:50,y:663,size:9,font:regular,color:muted,maxWidth:300});
 page.drawText('RÉFÉRENCE',{x:390,y:698,size:8,font:bold,color:muted});page.drawText(number,{x:390,y:680,size:10,font:bold,color:navy});page.drawText(text((doc as any).issueDate||(doc as any).confirmedAt||(doc as any).receivedAt||''),{x:390,y:663,size:9,font:regular,color:muted});
 y=625;const lines=(doc as any).lines as any[]|undefined;if(lines?.length){page.drawText('DÉSIGNATION',{x:42,y,size:8,font:bold,color:muted});page.drawText('QTÉ',{x:355,y,size:8,font:bold,color:muted});page.drawText('P.U.',{x:405,y,size:8,font:bold,color:muted});page.drawText('TOTAL',{x:495,y,size:8,font:bold,color:muted});y-=12;page.drawLine({start:{x:36,y},end:{x:559,y},thickness:1,color:line});y-=18
  for(const item of lines){if(y<170){page=pdf.addPage(PAGE);y=790}page.drawText(text(item.description).slice(0,68),{x:42,y,size:9,font:regular,color:navy,maxWidth:300});page.drawText(text(item.quantity),{x:360,y,size:9,font:regular,color:navy});page.drawText(amount(Number(item.unitPriceDh||0)),{x:405,y,size:9,font:regular,color:navy});page.drawText(amount(Number(item.totalDh||0)),{x:490,y,size:9,font:bold,color:navy});y-=22;page.drawLine({start:{x:36,y:y+8},end:{x:559,y:y+8},thickness:.5,color:line})}
 }
 const calc=(doc as any).calculation;if(calc){y=Math.max(120,y-18);page.drawRectangle({x:335,y:y-92,width:224,height:105,color:navy});page.drawText('Sous-total',{x:352,y:y-18,size:9,font:regular,color:rgb(.8,.85,.91)});page.drawText(amount(calc.subtotalDh),{x:470,y:y-18,size:9,font:bold,color:rgb(1,1,1)});page.drawText('Remise',{x:352,y:y-38,size:9,font:regular,color:rgb(.8,.85,.91)});page.drawText(amount(calc.discountDh),{x:470,y:y-38,size:9,font:bold,color:rgb(1,1,1)});page.drawText('Taxes',{x:352,y:y-58,size:9,font:regular,color:rgb(.8,.85,.91)});page.drawText(amount(calc.taxDh),{x:470,y:y-58,size:9,font:bold,color:rgb(1,1,1)});page.drawText('TOTAL',{x:352,y:y-82,size:11,font:bold,color:rgb(1,1,1)});page.drawText(amount(calc.totalDh),{x:455,y:y-82,size:12,font:bold,color:rgb(1,1,1)})}
 if(type==='payment_receipt'){const payment=doc as Payment;y=500;draw(`Montant reçu: ${amount(payment.amountDh)}`,50,16,bold,navy);draw(`Mode: ${payment.method}`,50,10,regular,muted);draw(`Référence: ${payment.transactionReference}`,50,10,regular,muted)}
 const pages=pdf.getPages();pages.forEach((p,index)=>{p.drawLine({start:{x:36,y:55},end:{x:559,y:55},thickness:.7,color:line});p.drawText('ANGELCARE · Flashcards OS · Document contrôlé',{x:36,y:38,size:7,font:regular,color:muted});p.drawText(`Page ${index+1}/${pages.length}`,{x:510,y:38,size:7,font:regular,color:muted})})
 const bytes=await pdf.save();return{bytes:bodyArray(bytes),filename:filename(type,number)}
}
