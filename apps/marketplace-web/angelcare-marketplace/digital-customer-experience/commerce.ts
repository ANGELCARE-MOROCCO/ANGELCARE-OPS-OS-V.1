import { text, type Data } from './types'
/** Canonical Marketplace kinds, never synthetic DCE commerce records. */
export function nativeContinuation(offer:Data):string {
 const schema=text(offer.experience_schema_key)
 if(schema.includes('academy')||offer.kind==='training')return 'enrolment'
 if(offer.kind==='service')return 'booking'
 if(['product','kit'].includes(text(offer.kind)))return 'purchase'
 return 'enquiry'
}
