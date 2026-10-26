import {BarChart3,ShieldCheck} from 'lucide-react';
import type {Locale} from '../contracts';
import {APPLICATION_STATUS,applicationStatus} from '../application-copy';
import css from './employer-analytics.module.css';
const copy:Record<Locale,{title:string,help:string,subtotal:string,source:string,none:string}>={
 en:{title:'Application-stage distribution',help:'An operational view of current recorded stages',subtotal:'Applications in reporting window',source:'Server-reported data · no inferred conversion rates',none:'No recorded applications in this period'},
 fr:{title:'Répartition des candidatures',help:'Vue opérationnelle des étapes enregistrées',subtotal:'Candidatures sur la période',source:'Données serveur · aucune conversion estimée',none:'Aucune candidature sur cette période'},
 es:{title:'Distribución de solicitudes',help:'Etapas registradas de las candidaturas',subtotal:'Solicitudes del período',source:'Datos del servidor · sin estimaciones',none:'No hay solicitudes en este período'},
 hi:{title:'आवेदन चरण वितरण',help:'दर्ज किए गए आवेदन चरण',subtotal:'रिपोर्ट अवधि के आवेदन',source:'सर्वर के दर्ज आंकड़े',none:'इस अवधि में कोई आवेदन नहीं'},
 tl:{title:'Mga yugto ng aplikasyon',help:'Mga yugto na nasa sistema',subtotal:'Mga aplikasyon sa panahon',source:'Tala mula sa server lamang',none:'Walang aplikasyon sa panahong ito'},
 id:{title:'Distribusi status lamaran',help:'Tahap lamaran yang tercatat',subtotal:'Lamaran pada periode ini',source:'Data server · tanpa perkiraan',none:'Tidak ada lamaran pada periode ini'},
 ar:{title:'توزيع مراحل الطلبات',help:'المراحل المسجلة في النظام',subtotal:'الطلبات خلال الفترة',source:'بيانات الخادم دون تقديرات',none:'لا توجد طلبات في هذه الفترة'}
};
export function EmployerAnalyticsVisual({locale,states,total}:{locale:Locale;states:Record<string,unknown>;total:number}){
 const l=copy[locale]||copy.en,values=Object.keys(APPLICATION_STATUS).map(key=>({key,value:typeof states[key]==='number'&&Number.isFinite(states[key])?Math.max(0,states[key] as number):0})),max=Math.max(1,...values.map(v=>v.value));
 return <section className={css.root} aria-label={l.title}><header className={css.heading}><div><span className={css.kicker}><BarChart3 size={15}/>{l.help}</span><h2>{l.title}</h2></div><div className={css.total}><span>{l.subtotal}</span><strong>{Intl.NumberFormat(locale).format(total)}</strong></div></header><div className={css.graph}>{values.map((item,i)=><div className={css.row} key={item.key}><span>{applicationStatus(locale,item.key)}</span><div className={css.track}><i data-series={i%4} style={{width:`${item.value?Math.max(2,item.value/max*100):0}%`}}/></div><strong>{Intl.NumberFormat(locale).format(item.value)}</strong></div>)}</div>{!total?<p className={css.empty}>{l.none}</p>:null}<footer><ShieldCheck size={14}/>{l.source}</footer></section>;
}
