import { JobkixFault,type Locale } from './contracts';
import { filtersParams,readFilters,type SearchFilters } from './discovery';
import { href } from './routes';
export interface DirectoryQuery {term:string;letter:string;view:'grid'|'list';page:number;context:SearchFilters}
export function directoryQuery(input:Record<string,string|string[]|undefined>):DirectoryQuery{
 const params=new URLSearchParams();for(const [key,value] of Object.entries(input)){if(Array.isArray(value)){for(const entry of value)params.append(key,entry);}else if(value!==undefined)params.set(key,value);}
 for(const key of ['term','letter','view','page'])if(params.getAll(key).length>1)throw new JobkixFault('INVALID_INPUT');
 const term=(params.get('term')||'').trim(),letter=params.get('letter')||'',view=params.get('view')||'grid',page=Number(params.get('page')||1);
 if(term.length>240||letter.length>4||/[\u0000-\u001f\u007f]/u.test(term+letter)||!['grid','list'].includes(view)||!Number.isInteger(page)||page<1||page>10000)throw new JobkixFault('INVALID_INPUT');
 const context=readFilters(params);delete context.page;
 return {term,letter,view:view==='list'?'list':'grid',page,context};
}
export function directoryHref(locale:Locale,kind:'setting'|'occupation',query:DirectoryQuery,change:Partial<Pick<DirectoryQuery,'term'|'letter'|'view'|'page'>>={}):string{
 const current={...query,...change},params=filtersParams(query.context);if(current.term)params.set('term',current.term);if(current.letter)params.set('letter',current.letter);if(current.view==='list')params.set('view','list');if(current.page>1)params.set('page',String(current.page));return href(locale,kind==='setting'?'sectors':'professions',params);
}
