/** Supplier Ops -> existing ONE WORLD rate authority -> canonical Finance price rules.
 * Does not introduce another price book, approve Finance rules or bypass governance.
 */
import 'server-only'
import { MarketplaceError } from '../server/errors'
import { createCommerceResource,updateCommerceResource } from '../commerce-studio/repository'
import type { MarketplaceRequestContext } from '../domain/types'
import type { Selection } from './contract'

type Row=Record<string,any>
const txt=(x:unknown,max=200)=>String(x??'').trim().slice(0,max)
const uuid=(x:unknown)=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(txt(x))
const iso=(x:unknown)=>{const s=txt(x,10).toUpperCase();return s==='DH'?'MAD':s}
function blocked(reason:string):never{throw new MarketplaceError('DEPENDENCY_BLOCKED',reason)}
async function activeRate(db:any,currency:string):Promise<number>{
 if(currency==='USD')return 1
 const r=await db.from('ac_owc_rates').select('rate,observed_on,status').eq('currency',currency).eq('status','active').limit(2)
 if(r.error||r.data?.length!==1)blocked('ONE WORLD has no uniquely active verified USD reference rate for '+currency)
 const item=r.data[0],age=Date.now()-Date.parse(item.observed_on+'T00:00:00Z')
 if(!Number.isFinite(age)||age>7*86400000||age<0)blocked('ONE WORLD currency rate is stale/unverifiable for '+currency)
 const rate=Number(item.rate);if(!Number.isFinite(rate)||rate<=0)blocked('Invalid ONE WORLD rate for '+currency)
 return rate
}
async function selectedBook(db:any,bookId:string){
 if(!uuid(bookId))throw new MarketplaceError('VALIDATION_ERROR','Canonical Finance price book UUID required')
 const r=await db.from('angelcare_marketplace_finance_price_books').select('id,name,currency_label,status,territory_id,valid_from,valid_until,currency_valid').eq('id',bookId).single()
 if(r.error||!r.data)blocked('Finance price book not found')
 if(!['active','approved'].includes(r.data.status)||r.data.currency_valid===false)blocked('Finance price book must be approved or active and currency-validated')
 const now=new Date().toISOString().slice(0,10)
 if(r.data.valid_from>now||r.data.valid_until&&r.data.valid_until<now)blocked('Finance price book outside valid period')
 const c=iso(r.data.currency_label)
 if(!/^[A-Z]{3}$/.test(c))blocked('Finance price book has no ISO currency label')
 return {...r.data,currency:c}
}
export async function financeCatalogue(db:any){
 const [books,rules]=await Promise.all([
  db.from('angelcare_marketplace_finance_price_books').select('id,name,currency_label,status,territory_id,valid_from,valid_until,currency_valid').in('status',['approved','active']).limit(200),
  db.from('angelcare_marketplace_finance_price_rules').select('id,catalog_item_id,price_book_id,status,standard_price,cost_basis,target_margin,updated_at').in('status',['draft','financial_review','commercial_review','approval_pending','approved','active']).order('updated_at',{ascending:false}).limit(500)
 ])
 return {books:books.error?[]:books.data||[],rules:rules.error?[]:rules.data||[],authorityAvailable:!books.error&&!rules.error}
}
export async function proposal(ctx:MarketplaceRequestContext,db:any,selection:Selection,raw:Row){
 if(!selection.catalog_item_id||!selection.supplier_offer_id)blocked('Canonical Product 360 item and supplier offer required before price proposal')
 if(selection.cost===null||selection.cost<=0||selection.shipping_cost===null||selection.duty_cost===null)blocked('Verified supplier cost, freight and duty required')
 if(selection.compliance.freightVerified!==true||!selection.compliance.evidenceNotes)blocked('Validated freight and sourcing evidence required')
 const offer=await db.from('angelcare_marketplace_supplier_offers').select('id,status').eq('id',selection.supplier_offer_id).single()
 if(offer.error||!['approved','active'].includes(offer.data?.status))blocked('Supplier offer must be approved through canonical supplier authority')
 const book=await selectedBook(db,txt(raw.priceBookId))
 const price=Number(raw.standardPrice)
 if(!Number.isFinite(price)||price<=0||price>100000000||Math.abs(price*100-Math.round(price*100))>1e-6)throw new MarketplaceError('VALIDATION_ERROR','Finance standard price must have at most two decimals and be positive')
 const reason=txt(raw.reason,1500)
 if(reason.length<15)throw new MarketplaceError('VALIDATION_ERROR','Financial proposal evidence/approval rationale (minimum 15 characters) required')
 const source=iso(selection.currency),srcRate=await activeRate(db,source),destRate=await activeRate(db,book.currency)
 // ONE WORLD rates are stored in currency-per-USD; do not mistake USD->source for source->USD.
 const supplierLanded=selection.cost+selection.shipping_cost+selection.duty_cost
 const cost=Number((supplierLanded/srcRate*destRate).toFixed(2))
 if(!Number.isFinite(cost)||cost<=0||cost>price)blocked('Proposed retail price does not cover the verified landed cost in the Finance price-book currency')
 const margin=Number(((price-cost)/price*100).toFixed(3))
 const previous=await db.from('angelcare_marketplace_finance_price_rules').select('id,status').eq('catalog_item_id',selection.catalog_item_id).eq('price_book_id',book.id).neq('status','archived').limit(10)
 if(previous.error)blocked('Finance rules lookup failed')
 if(previous.data?.length)blocked('A Finance rule already exists for this product and book; review/update it in the existing Finance authority before proposing another')
 const inserted=await createCommerceResource({resource:'price-rules',context:ctx,payload:{
  price_book_id:book.id,source_object_type:'catalog_item',source_object_id:selection.catalog_item_id,catalog_item_id:selection.catalog_item_id,
  pricing_model:'fixed',unit_label:'unit',standard_price:price,cost_basis:cost,target_margin:margin,
  territory_id:book.territory_id,status:'draft',
 }})
 const record=inserted.record as Row
 return {ruleId:record.id,status:record.status,priceBook:book.name,currency:book.currency,standardPrice:price,costBasis:cost,targetMargin:margin,
  rateSource:'ONE WORLD active verified reference',approvalRequired:true,publicPriceChanged:false}
}
export async function approvedRetailRule(db:any,catalogItemId:string){
 const rules=await db.from('angelcare_marketplace_finance_price_rules').select('id,status,price_book_id,standard_price,catalog_item_id').eq('catalog_item_id',catalogItemId).eq('status','active').limit(20)
 if(rules.error)blocked('Finance retail rules unavailable')
 const results=[] as {rule:Row;book:Row}[]
 for(const rule of rules.data||[]){
  const book=await db.from('angelcare_marketplace_finance_price_books').select('id,status,currency_label,currency_valid,valid_from,valid_until').eq('id',rule.price_book_id).single()
  if(book.error||!book.data||book.data.status!=='active'||book.data.currency_valid===false)continue
  const now=new Date().toISOString().slice(0,10)
  if(book.data.valid_from>now||book.data.valid_until&&book.data.valid_until<now)continue
  if(iso(book.data.currency_label)==='MAD')results.push({rule,book:book.data})
 }
 if(results.length!==1)blocked('Exactly one active MAD Finance price rule in a valid active book required; international ONE WORLD destinations are separately governed')
 const chosen=results[0]
 const retail=Number(chosen.rule.standard_price)
 if(!Number.isFinite(retail)||retail<=0)blocked('Finance standard retail price invalid')
 return {ruleId:chosen.rule.id,price:retail,currency:'Dh',bookId:chosen.book.id}
}
export async function activateRetail(ctx:MarketplaceRequestContext,db:any,selection:Selection){
 if(!selection.catalog_item_id)blocked('Canonical product required')
 const source=await approvedRetailRule(db,selection.catalog_item_id)
 const item=await db.from('angelcare_marketplace_catalog_items').select('id,status,price_mode,currency_label,price_amount').eq('id',selection.catalog_item_id).single()
 if(item.error||!item.data)blocked('Canonical Product 360 item not found')
 if(item.data.status==='published')blocked('Published item price changes require the existing governed repricing/approval procedure; no silent overwrite')
 const result=await updateCommerceResource({resource:'catalog-items',id:selection.catalog_item_id,context:ctx,
  payload:{price_mode:'fixed',currency_label:'Dh',price_amount:source.price}})
 return {catalogId:selection.catalog_item_id,sourceRuleId:source.ruleId,financeBookId:source.bookId,
  retailPrice:source.price,currency:'MAD',publicPriceChanged:false,canonicalMutation:true,recordId:(result.record as Row).id}
}
