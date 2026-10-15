import {createHash} from 'node:crypto'
import {createServiceClient} from '@/lib/supabase/server'
import {MarketplaceError} from '../server/errors'
import {createPublicInquiry} from '../public-universe/repository'
import type {PublicInquiryInput,PublicInquiryRecord} from '../public-universe/types'
export async function receiveRoutedInquiry(input:PublicInquiryInput,request:Request):Promise<Pick<PublicInquiryRecord,'id'|'public_reference'|'status'>>{
 if(input.honeypot||!input.consent||!input.fullName.trim()||input.message.trim().length<10||!input.email?.trim()&&!input.phone?.trim())throw new MarketplaceError('VALIDATION_ERROR','Nom, coordonnées, besoin et consentement requis.')
 if(input.sourceMetadata?.entry==='contact-centre-r1'&&(input.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())||!input.email?.trim()&&input.phone&&input.phone.replace(/\D/g,'').length<5))throw new MarketplaceError('VALIDATION_ERROR','Coordonnées de contact invalides.')
 const meta=input.sourceMetadata||{},key=typeof meta.submissionKey==='string'?meta.submissionKey:''
 if(!key)return createPublicInquiry(input,request)
 const digest=createHash('sha256').update(JSON.stringify([input.audience,input.fullName.trim(),input.email?.trim().toLowerCase()||'',input.phone?.trim()||'',input.organization?.trim()||'',input.city?.trim()||'',input.message.trim(),input.locale,meta.contactTopic,meta.requestReference,meta.serviceLocation])).digest('hex')
 const db=await createServiceClient()
 const previous=async()=>{const r=await db.from('angelcare_marketplace_public_inquiries').select('id,public_reference,status,source_metadata').contains('source_metadata',{entry:'contact-centre-r1',submissionKey:key}).maybeSingle();if(r.error)throw new MarketplaceError('INTERNAL_ERROR','Impossible de vérifier la réception précédente.',{retryable:true,cause:r.error});if(!r.data)return null;if(r.data.source_metadata?.submissionHash!==digest)throw new MarketplaceError('CONFLICT','Cette référence de soumission appartient à une demande différente.');return r.data}
 const found=await previous();if(found)return found
 try{return await createPublicInquiry({...input,sourceMetadata:{...meta,submissionHash:digest}},request)}catch(e){const cause=(e as {cause?:{code?:string}})?.cause;if(cause?.code==='23505'){const existing=await previous();if(existing)return existing}throw e}
}
