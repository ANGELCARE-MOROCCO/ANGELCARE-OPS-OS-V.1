import { notFound,redirect } from 'next/navigation';
import { isLocale } from '@/angelcare-marketplace/jobkix/contracts';
import { readAdmin } from '@/angelcare-marketplace/jobkix/server/admin-repository';
import { dependencyError } from '@/angelcare-marketplace/jobkix/server/http';
import { object,uuid } from '@/angelcare-marketplace/jobkix/validation';
import { LegalPage } from '@/angelcare-marketplace/jobkix/pages/Legal';
import { Empty,str } from '@/angelcare-marketplace/jobkix/components/Public';
import { errorText } from '@/angelcare-marketplace/jobkix/i18n';
import { ProfessionalWorld } from '@/angelcare-marketplace/jobkix/pages/ProfessionalWorld';
import { editorialPreviewTarget } from '@/angelcare-marketplace/jobkix/editorial-preview';
import { resolveEditorialImages } from '@/angelcare-marketplace/jobkix/server/editorial-media';
import { Home } from '@/angelcare-marketplace/jobkix/pages/Home';
import { GeographicWorld,Abroad } from '@/angelcare-marketplace/jobkix/pages/Geography';
import { EmployerProfile } from '@/angelcare-marketplace/jobkix/pages/Employers';
import { PublicSupport } from '@/angelcare-marketplace/jobkix/pages/PublicSupport';
import { Journeys } from '@/angelcare-marketplace/jobkix/pages/Journeys';
import { Reputation } from '@/angelcare-marketplace/jobkix/pages/Reputation';
import { e } from '@/angelcare-marketplace/jobkix/experience-copy';
import styles from '@/angelcare-marketplace/jobkix/jobkix.module.css';
import { Guide } from '@/angelcare-marketplace/jobkix/pages/Guide';
export const dynamic='force-dynamic';
export const metadata={robots:{index:false,follow:false,nocache:true},alternates:{canonical:null}};
export default async function EditionPreview({params}:{params:Promise<{locale:string;id:string}>}){
 const {locale,id}=await params;if(!isLocale(locale))notFound();try{uuid(id);}catch{notFound();}
 let result;try{result=await readAdmin('editorial','Private preview of the saved JOBKIX editorial revision.',id);}catch(error){const fault=dependencyError(error);if(fault.code==='AUTHENTICATION_REQUIRED')redirect('/angelcare-marketplace/admin/login?returnTo='+encodeURIComponent(`/jobkix/${locale}/preview/${id}`));return <Empty locale={locale} problem title={errorText(locale,fault.code)}/>;}
 if(!Array.isArray(result.data)||!result.data[0])notFound();const edition=object(result.data[0]);if(edition.locale!==locale)notFound();
 const target=editorialPreviewTarget(str(edition,'document_kind'),str(edition,'document_slug'));if(!target)notFound();
 const preview=await resolveEditorialImages({id:edition.id,kind:edition.document_kind,title:edition.title,summary:edition.summary,sections:edition.sections,translationRevision:edition.version,sourceRevision:edition.source_revision,author:edition.author_name,publishedAt:null});
 if(target.kind==='legal')return <LegalPage locale={locale} slug={target.slug} preview={preview}/>;
 if(target.kind==='guide'||target.kind==='help')return <Guide locale={locale} slug={target.slug} kind={target.kind} search={{}} preview={preview}/>;
 const notice=<p className={styles.notice} role="status">{e(locale,'privatePreview')}</p>;
 if(target.kind==='home')return <>{notice}<Home locale={locale} preview={preview}/></>;
 if(target.kind==='country'||target.kind==='city')return <>{notice}<GeographicWorld locale={locale} country={target.country} cityKey={target.kind==='city'?target.cityKey:undefined} search={{}} preview={preview}/></>;
 if(target.kind==='abroad')return <>{notice}<Abroad locale={locale} search={{}} preview={preview}/></>;
 if(target.kind==='employer')return <>{notice}<EmployerProfile locale={locale} id={target.id} search={{}} preview={preview}/></>;
 if(target.kind==='support')return <>{notice}<PublicSupport locale={locale} screen={target.screen} search={{}} preview={preview}/></>;
 if(target.kind==='journey')return <>{notice}<Journeys locale={locale} screen={target.screen} search={{}} preview={preview}/></>;
 if(target.kind==='methodology')return <>{notice}<Reputation locale={locale} screen="P14" search={{}} preview={preview}/></>;
 if(target.kind==='setting'||target.kind==='occupation')return <ProfessionalWorld locale={locale} kind={target.kind} slug={target.slug} search={{}} preview={preview}/>;
 notFound();
}
