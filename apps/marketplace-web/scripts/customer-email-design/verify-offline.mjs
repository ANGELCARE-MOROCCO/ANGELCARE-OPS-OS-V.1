import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
registerHooks({resolve(specifier,context,nextResolve){try{return nextResolve(specifier,context)}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&context.parentURL?.includes('/customer-email-design/')&&!/\.[a-z]+$/i.test(specifier))return nextResolve(specifier+'.ts',context);throw error}}})
const {composeCustomerEmail,customerEmailDefinitions}=await import('../../angelcare-marketplace/customer-commerce/customer-email-design/catalog.ts')
let count=0
for(const [key,definition] of Object.entries(customerEmailDefinitions))for(const locale of ['fr','en','ar']){
 const message=composeCustomerEmail(key,{locale,origin:'https://my.angelcarehub.com',state:definition.states[0],reference:'OFFLINE-FIXTURE',evidenceReference:'OFFLINE-NO-REAL-EVENT',amount:0,currency:'MAD',scheduledAt:'2026-10-20T09:00:00Z',timeZone:'Africa/Casablanca',customerReply:'Offline fixture — no email is sent.'})
 assert(message.html.includes('dir="'+(locale==='ar'?'rtl':'ltr')+'"'))
 assert(message.html.includes('/brand/angelcare-pearl-rim-colour-r1.png'))
 assert(message.text.includes(message.subject));count++
}
const base={locale:'fr',origin:'https://my.angelcarehub.com',reference:'OFFLINE-FIXTURE',state:'pending',amount:20,currency:'MAD',evidenceReference:'OFFLINE-NO-REAL-EVENT'}
assert.throws(()=>composeCustomerEmail('payment_received',base));count++
assert.throws(()=>composeCustomerEmail('booking_confirmed',{...base,state:'confirmed'}));count++
assert.throws(()=>composeCustomerEmail('refund_recorded',{...base,state:'requested'}));count++
assert.throws(()=>composeCustomerEmail('support_reply',{...base,state:'replied'}));count++
console.log(`CUSTOMER_EMAIL_OFFLINE=${count}/${count} PASS`)
console.log('No network, database, SMTP, email, build or production changes. Terminal remains open.')
