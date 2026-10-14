import type { Row } from '../catalogue-population/model'
/** Runs the existing canonical writer against an isolated graph. All external
 * reference reads go to the real service client; no production mutation is made.
 * The resulting graph is committed by one guarded database transaction. */
export const OWN_TABLES:Record<string,string>={angelcare_marketplace_catalog_items:'item',angelcare_marketplace_catalog_variants:'variants',angelcare_marketplace_catalog_item_media:'media',angelcare_marketplace_catalog_availability:'availability',angelcare_marketplace_catalog_item_categories:'categories',angelcare_marketplace_finance_price_rules:'priceRules',angelcare_marketplace_homepage_placements:'placements'}
const clone=<T,>(v:T):T=>structuredClone(v)
export function canonicalSnapshot(source:Row|null):Row|null{
 if(!source?.id)return null
 const snapshot=clone(source)
 for(const key of Object.values(OWN_TABLES).filter(k=>k!=='item'))snapshot[key]=(snapshot[key]||[]).sort((a:Row,b:Row)=>String(a.id).localeCompare(String(b.id),'en'))
 return snapshot
}
export function planningClient(real:any,before:Row|null,reservedId:string,virtual:Row[]=[]){
 const tables:Record<string,Row[]>={}
 for(const [table,key]of Object.entries(OWN_TABLES))tables[table]=key==='item'?(before?[Object.fromEntries(Object.entries(clone(before)).filter(([k])=>!Object.values(OWN_TABLES).includes(k)))]:[]):clone(before?.[key]||[])
 const snapshot=()=>{const item=tables.angelcare_marketplace_catalog_items[0];if(!item)return{};return {...clone(item),...Object.fromEntries(Object.entries(OWN_TABLES).filter(([,key])=>key!=='item').map(([table,key])=>[key,clone(tables[table])]))}}
 class Query{
  filters:Array<[string,string,unknown]>=[];op='select';payload:Row[]=[];columns='*';options:Row={};one='';orders:Array<[string,boolean]>=[];size:number|null=null;bounds:number[]|null=null;promise:Promise<Row>|null=null
  constructor(readonly table:string){}
  select(columns='*',options:Row={}){this.columns=columns;this.options={...this.options,...options};return this}
  eq(k:string,v:unknown){this.filters.push(['eq',k,v]);return this} neq(k:string,v:unknown){this.filters.push(['neq',k,v]);return this} in(k:string,v:unknown[]){this.filters.push(['in',k,v]);return this} is(k:string,v:unknown){return this.eq(k,v)}
  order(k:string,options:Row={}){this.orders.push([k,options.ascending!==false]);return this}limit(n:number){this.size=n;return this}range(a:number,b:number){this.bounds=[a,b];return this}
  update(value:Row){this.op='update';this.payload=[clone(value)];return this}insert(value:Row|Row[]){this.op='insert';this.payload=clone(Array.isArray(value)?value:[value]);return this}upsert(value:Row|Row[],options:Row={}){this.op='upsert';this.payload=clone(Array.isArray(value)?value:[value]);this.options=options;return this}delete(){this.op='delete';return this}single(){this.one='single';return this}maybeSingle(){this.one='maybe';return this}
  match(row:Row){return this.filters.every(([op,k,v])=>op==='eq'?row[k]===v:op==='neq'?row[k]!==v:Array.isArray(v)&&v.includes(row[k]))}
  async external(){let q=real.from(this.table).select(this.columns.includes(':')?'*':this.columns,this.options);for(const [op,k,v]of this.filters)q=q[op](k,v);for(const [k,asc]of this.orders)q=q.order(k,{ascending:asc});if(this.size!==null)q=q.limit(this.size);if(this.bounds)q=q.range(...this.bounds);return q}
  async execute():Promise<Row>{
   if(!OWN_TABLES[this.table]){if(this.op!=='select')throw Error('Le plan ne peut pas modifier une autorité externe : '+this.table);let q=real.from(this.table).select(this.columns,this.options);for(const [op,k,v]of this.filters)q=q[op](k,v);for(const [k,asc]of this.orders)q=q.order(k,{ascending:asc});if(this.size!==null)q=q.limit(this.size);if(this.bounds)q=q.range(...this.bounds);if(this.one)q=this.one==='single'?q.single():q.maybeSingle();return q}
   let table=tables[this.table],matched=table.filter(r=>this.match(r)),returned=matched
   if(this.op==='select'&&this.table==='angelcare_marketplace_catalog_items'){
    const ownOnly=this.filters.some(([op,k,v])=>op==='eq'&&((k==='id'&&v===reservedId)||(k==='item_key'&&v===table[0]?.item_key)))
    if(!ownOnly){const other=await this.external();if(other.error)return other;const extra=[...(other.data||[]),...virtual.filter(r=>r.id!==reservedId)];const seen=new Set(returned.map(r=>r.id));returned=[...returned,...extra.filter(r=>this.match(r)&&!seen.has(r.id)&&(seen.add(r.id),true))]}
   }
   if(this.op!=='select'){
    if(this.op==='delete'){tables[this.table]=table.filter(r=>!this.match(r));returned=[]}
    else if(this.op==='update'){for(const row of matched)Object.assign(row,this.payload[0]);returned=matched}
    else {returned=[];for(const input of this.payload){if(this.table!=='angelcare_marketplace_catalog_items'&&input.catalog_item_id!==reservedId)throw Error('Écriture du plan hors offre.');const conflict=String(this.options.onConflict||'id').split(',');const existing=this.op==='upsert'?table.find(r=>conflict.every(k=>r[k]===input[k])):null;const id=this.table==='angelcare_marketplace_catalog_items'?reservedId:input.id||crypto.randomUUID();const row=existing?Object.assign(existing,input):{id,...input};if(!existing)table.push(row);returned.push(row)}}
   }
   for(const [key,asc]of this.orders)returned=[...returned].sort((a,b)=>String(a[key]??'').localeCompare(String(b[key]??''),'en')*(asc?1:-1))
   const count=returned.length;if(this.bounds)returned=returned.slice(this.bounds[0],this.bounds[1]+1);if(this.size!==null)returned=returned.slice(0,this.size)
   const data=returned.map(row=>this.columns.includes(':')&&this.table==='angelcare_marketplace_catalog_items'?snapshot():this.columns==='*'?clone(row):Object.fromEntries(this.columns.split(',').map(key=>[key.trim(),row[key.trim()]??null])))
   if(this.one&&data.length>1)return{data:null,error:{message:'Référence ambiguë dans le plan.'}}
   if(this.one==='single'&&!data.length)return{data:null,error:{message:'Enregistrement attendu absent.'}}
   return{data:this.one?data[0]||null:data,error:null,count}
  }
  then(resolve:any,reject:any){this.promise??=this.execute();return this.promise.then(resolve,reject)}
 }
 return {client:{from:(table:string)=>new Query(table)},snapshot}
}
