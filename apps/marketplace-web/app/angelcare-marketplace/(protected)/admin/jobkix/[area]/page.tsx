import { notFound } from 'next/navigation';
import { PageHeader,StatePanel,ButtonLink } from '@/angelcare-marketplace/design-system/ui';
import { adminArea,ADMIN_AREAS } from '@/angelcare-marketplace/jobkix/admin-contract';
import { readAdmin,readOperations,readAdminPage } from '@/angelcare-marketplace/jobkix/server/admin-repository';
import { dependencyError } from '@/angelcare-marketplace/jobkix/server/http';
import { AdminWorkspace } from '@/angelcare-marketplace/jobkix/admin/Workspace';
import { a } from '@/angelcare-marketplace/jobkix/admin-copy';
import { object,integer,choice,uuid } from '@/angelcare-marketplace/jobkix/validation';
import { errorText,t } from '@/angelcare-marketplace/jobkix/i18n';
import { OperationsQueue } from '@/angelcare-marketplace/jobkix/admin/OperationsQueue';
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css';
export const dynamic='force-dynamic';
export default async function JobkixAdminPage({params,searchParams}:{params:Promise<{area:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {area:slug}=await params,area=adminArea(slug);if(!area)notFound();
 const search=await searchParams;let state='',page=1;let result,focus=null;try{page=integer(Number(search.page||1),'page',1,10000);if(slug==='health'){state=choice(search.state||'',['','pending','processing','provider_accepted','failed','delivery_unknown','cancelled'],'state');result=await readOperations(page,state);}else {result=await readAdminPage(slug,'JOBKIX '+area.id+' operational review in the authorized native administration.',page);if(slug==='editorial'&&search.edition){const focused=await readAdmin('editorial','Open the selected JOBKIX editorial revision in native administration.',uuid(search.edition));focus=Array.isArray(focused.data)&&focused.data[0]?object(focused.data[0]):null;}}}catch(error){const fault=dependencyError(error);return <StatePanel type={fault.code==='FORBIDDEN'?'denied':'error'} title="JOBKIX" text={errorText('fr',fault.code)}/>;}
 const {locale,data}=result,paged=object(data),rows=Array.isArray(paged.items)?paged.items.map(object):[],total=typeof paged.total==='number'?paged.total:0;
 const pageUrl=(next:number)=>'/angelcare-marketplace/admin/jobkix/'+slug+'?'+new URLSearchParams({page:String(next),...(typeof search.edition==='string'?{edition:search.edition}:{})});
 return <div className={styles.stack}><PageHeader eyebrow={'JOBKIX · '+area.id} title={area.name[locale]} description={a(locale,'purpose')}/><nav className={styles.toolbar} aria-label="JOBKIX">{ADMIN_AREAS.map(area=><ButtonLink key={area.id} href={'/angelcare-marketplace/admin/jobkix/'+area.slug} variant="secondary">{area.id} · {area.name[locale]}</ButtonLink>)}</nav>
  {slug==='health'?<OperationsQueue locale={locale} data={object(data)} state={state}/>:<AdminWorkspace locale={locale} slug={slug} rows={rows} focus={focus}/>}
  {slug!=='health'&&total>24?<nav className={styles.toolbar} aria-label={a(locale,'record')}>{page>1?<ButtonLink href={pageUrl(page-1)} variant="secondary">{t(locale,'previous')}</ButtonLink>:null}<span>{new Intl.NumberFormat(locale).format(page)} / {new Intl.NumberFormat(locale).format(Math.ceil(total/24))}</span>{page*24<total?<ButtonLink href={pageUrl(page+1)} variant="secondary">{t(locale,'next')}</ButtonLink>:null}</nav>:null}
 </div>;
}
