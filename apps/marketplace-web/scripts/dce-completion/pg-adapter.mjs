// Isolated test transport: executes the actual DCE SQL against local PGlite.
// This is not an alternate production repository or an authentication implementation.
const quote=s=>'"'+String(s).replaceAll('"','""')+'"'
function column(s){const [head,tail]=s.split('->>');return quote(head)+(tail?'->>'+"'"+tail.replaceAll("'","''")+"'":'')}
export function adapter(pg){
 class Query {
  constructor(table){this.table=table;this.filters=[];this.values=[];this.orders=[];this.fields='*';this.mode='select'}
  param(v){this.values.push(v);return '$'+this.values.length}
  select(fields='*',options={}){this.fields=fields;this.count=options.count;this.head=options.head;return this}
  eq(k,v){this.filters.push(column(k)+'='+this.param(v));return this}
  neq(k,v){this.filters.push(column(k)+'<>'+this.param(v));return this}
  is(k,v){this.filters.push(column(k)+(v===null?' is null':v?' is true':' is false'));return this}
  not(k,op,v){if(op==='is')this.filters.push(column(k)+' is not null');else if(op==='in'){const vals=String(v).slice(1,-1).split(',');this.filters.push(column(k)+' not in ('+vals.map(v=>this.param(v)).join(',')+')')}else if(op==='eq')this.filters.push(column(k)+'<>'+this.param(v));else throw Error('Unsupported test filter: '+op);return this}
  in(k,values){this.filters.push(values.length?column(k)+' in ('+values.map(v=>this.param(v)).join(',')+')':'false');return this}
  contains(k,v){this.filters.push(column(k)+' @> '+this.param(JSON.stringify(v))+'::jsonb');return this}
  ilike(k,v){this.filters.push(column(k)+' ilike '+this.param(v));return this}
  gte(k,v){this.filters.push(column(k)+'>='+this.param(v));return this}
  lte(k,v){this.filters.push(column(k)+'<='+this.param(v));return this}
  gt(k,v){this.filters.push(column(k)+'>'+this.param(v));return this}
  or(expression){const tokens=String(expression).match(/[^,]+\.in\.\([^)]*\)|[^,]+/g)||[];const clauses=tokens.map(token=>{const match=token.match(/^([^.]*)\.(ilike|like|eq|is|in)\.(.*)$/);if(!match)throw Error('Unsupported test OR '+token);const [,key,op,val]=match;if(op==='is')return column(key)+' is null';if(op==='in')return column(key)+' in ('+val.slice(1,-1).split(',').map(v=>this.param(v)).join(',')+')';return column(key)+(op==='eq'?'=':' '+op+' ')+this.param(op==='like'?val.replaceAll('*','%'):val)});this.filters.push('('+clauses.join(' or ')+')');return this}
  order(key,options={}){this.orders.push(column(key)+(options.ascending===false?' desc':' asc'));return this}
  range(from,to){this.offset=from;this.size=to-from+1;return this}
  limit(n){this.size=n;return this}
  maybeSingle(){this.one='maybe';return this}
  single(){this.one='required';return this}
  insert(payload){this.mode='insert';this.payload=payload;return this}
  update(payload){this.mode='update';this.payload=payload;return this}
  delete(){this.mode='delete';return this}
  async execute(){try{
   const where=this.filters.length?' where '+this.filters.join(' and '):'',table='public.'+quote(this.table);let sql,params=[...this.values],count=null
   if(this.mode==='select'){
    if(this.count){const r=await pg.query('select count(*)::int total from '+table+where,params);count=r.rows[0].total}
    const fields=this.fields==='*'?'*':this.fields.split(',').map(column).join(',')
    sql='select '+fields+' from '+table+where+(this.orders.length?' order by '+this.orders.join(','):'')+(this.size?' limit '+Number(this.size):'')+(this.offset?' offset '+Number(this.offset):'')
   }else if(this.mode==='insert'){
    const list=Array.isArray(this.payload)?this.payload:[this.payload],keys=Object.keys(list[0]);params=[]
    sql='insert into '+table+'('+keys.map(quote).join(',')+') values '+list.map(row=>'('+keys.map(k=>{const v=row[k];params.push(v&&typeof v==='object'?JSON.stringify(v):v);return '$'+params.length}).join(',')+')').join(',')+' returning *'
   }else if(this.mode==='update'){
    const assignments=Object.entries(this.payload).map(([k,v])=>{params.push(v&&typeof v==='object'?JSON.stringify(v):v);return quote(k)+'=$'+params.length})
    sql='update '+table+' set '+assignments.join(',')+where+' returning *'
   }else sql='delete from '+table+where+' returning *'
   const result=await pg.query(sql,params);if(this.one==='required'&&result.rows.length!==1)throw Error('Expected exactly one row');if(this.one&&result.rows.length>1)throw Error('Multiple rows in single result')
   return{data:this.head?null:this.one?(result.rows[0]||null):result.rows,count,error:null}
  }catch(e){return{data:null,error:{message:e.message,code:e.code||'TEST_DRIVER'},count:null}}}
  then(resolve,reject){return this.execute().then(resolve,reject)}
 }
 return{from:table=>new Query(table),rpc:async(name,args)=>{try{const params=Object.values(args).map(v=>v&&typeof v==='object'?JSON.stringify(v):v),r=await pg.query('select public.'+quote(name)+'('+Object.keys(args).map((key,i)=>quote(key)+' => $'+(i+1)).join(',')+') as result',params);return{data:r.rows[0]?.result,error:null}}catch(e){return{data:null,error:{message:e.message,code:e.code}}}}}
}
