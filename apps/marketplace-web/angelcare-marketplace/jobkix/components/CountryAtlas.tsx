import Link from 'next/link';
import { ChevronRight,Search } from 'lucide-react';
import type { Locale } from '../contracts';
import { g } from '../geography-copy';
import { t } from '../i18n';
import { href } from '../routes';
import s from '../jobkix.module.css';
/** Geographic artwork is decorative. Native GET controls own discovery. */
export function CountryAtlas({locale,context,term,city,region}:{locale:Locale;context:URLSearchParams;term:string;city:string;region:string}){
 return <section className={s.atlasOpening}><div className={`${s.container} ${s.atlasInner}`}><div className={s.atlasCopy}>
  <nav className={s.breadcrumbs} aria-label={g(locale,'directoryNavigation')}><Link href={href(locale)}>JOBKIX</Link><ChevronRight size={13} aria-hidden="true"/><span>{t(locale,'countries')}</span></nav>
  <span className={s.eyebrow}>GLOBAL CAREERS PLATFORM</span><h1>{g(locale,'directoryTitle')}</h1><p>{g(locale,'directoryIntro')}</p>
  <form className={s.atlasSearch} action={href(locale,'countries')} method="get">{Array.from(context).filter(([key])=>key!=='city').map(([key,value])=><input type="hidden" name={key} value={value} key={key}/>)}{region?<input type="hidden" name="region" value={region}/>:null}
   <label className={s.field}>{t(locale,'countries')}<input name="term" type="search" maxLength={240} defaultValue={term}/></label><label className={s.field}>{t(locale,'city')}<input name="city" type="search" maxLength={180} defaultValue={city}/></label><button className={s.button} type="submit"><Search size={18} aria-hidden="true"/>{g(locale,'searchCountries')}</button>
  </form>
 </div><div className={s.atlasMap} aria-hidden="true"><img src="/jobkix/geography/world-land.svg" alt="" width={1000} height={500} fetchPriority="high"/></div></div></section>;
}
