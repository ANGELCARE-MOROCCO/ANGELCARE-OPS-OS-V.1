import Link from 'next/link';
import type { Locale } from '../contracts';
import type { SearchResult } from '../server/repository';
import { href } from '../routes';
import { t } from '../i18n';
import s from '../jobkix.module.css';
export function StudioPagination({locale,path,search,result,pageKey='page'}:{locale:Locale;path:string;search:Record<string,string|string[]|undefined>;result:SearchResult;pageKey?:string}){
 function pageUrl(page:number){const params=new URLSearchParams();for(const [key,value] of Object.entries(search))if(Array.isArray(value))for(const entry of value)params.append(key,entry);else if(typeof value==='string')params.set(key,value);params.set(pageKey,String(page));return href(locale,path,params);}
 return result.total>result.pageSize?<nav className={s.pagination} aria-label={t(locale,'next')}>{result.page>1?<Link className={`${s.button} ${s.secondary}`} href={pageUrl(result.page-1)}>{t(locale,'previous')}</Link>:null}<span>{new Intl.NumberFormat(locale).format(result.page)} / {new Intl.NumberFormat(locale).format(Math.ceil(result.total/result.pageSize))}</span>{result.page*result.pageSize<result.total?<Link className={s.button} href={pageUrl(result.page+1)}>{t(locale,'next')}</Link>:null}</nav>:null;
}
