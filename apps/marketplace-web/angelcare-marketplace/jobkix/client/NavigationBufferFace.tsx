import type {Locale} from '../contracts';
import s from './navigation-buffer.module.css';

type Phase = 'waiting'|'slow';
type Labels = {opening:string;slow:string;retry:string;dismiss:string;role:string};
const COPY:Record<Locale,Labels>={
 en:{opening:'Opening…',slow:'Still loading…',retry:'Retry',dismiss:'Dismiss',role:'JOBKIX navigation'},
 fr:{opening:'Ouverture…',slow:'Chargement en cours…',retry:'Réessayer',dismiss:'Fermer',role:'Navigation JOBKIX'},
 es:{opening:'Abriendo…',slow:'Sigue cargando…',retry:'Reintentar',dismiss:'Cerrar',role:'Navegación JOBKIX'},
 hi:{opening:'खुल रहा है…',slow:'अभी लोड हो रहा है…',retry:'फिर कोशिश करें',dismiss:'बंद करें',role:'JOBKIX नेविगेशन'},
 tl:{opening:'Binubuksan…',slow:'Naglo-load pa…',retry:'Subukan muli',dismiss:'Isara',role:'JOBKIX navigation'},
 id:{opening:'Membuka…',slow:'Masih memuat…',retry:'Coba lagi',dismiss:'Tutup',role:'Navigasi JOBKIX'},
 ar:{opening:'جارٍ الفتح…',slow:'ما زال التحميل جارياً…',retry:'إعادة المحاولة',dismiss:'إغلاق',role:'التنقل في JOBKIX'}
};
/** One visual authority for both live transitions and Next.js streaming fallbacks. */
export function NavigationBufferFace({locale,phase,fallback=false,retryable=true,onRetry,onDismiss}:{
 locale:Locale;phase:Phase;fallback?:boolean;retryable?:boolean;onRetry?:()=>void;onDismiss?:()=>void;
}){
 const copy=COPY[locale]||COPY.en;
 return <div className={s.overlay} data-jobkix-navigation-buffer={fallback?undefined:'true'} data-jobkix-route-fallback={fallback?'true':undefined} aria-live="polite" aria-atomic="true">
  <section className={s.buffer} role="status" aria-label={copy.role} dir="ltr">
   <i className={`${s.rim} ${s.top}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.right}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.bottom}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.left}`} aria-hidden="true"/>
   <div className={s.logoWindow} aria-label="JOBKIX">
    <img src="/jobkix/brand/jobkix-logo-color.png" width="1349" height="518" alt="" className={s.logo} draggable={false}/>
    <span className={s.logoGleam} aria-hidden="true"/>
   </div>
   <span className={s.caption}>{phase==='slow'?copy.slow:copy.opening}</span>
   {phase==='slow'&&!fallback?<div className={s.actions}>
    {retryable&&onRetry?<><button onClick={onRetry} type="button">{copy.retry}</button><span aria-hidden="true"/></>:null}
    {onDismiss?<button onClick={onDismiss} type="button">{copy.dismiss}</button>:null}
   </div>:null}
  </section>
 </div>;
}
