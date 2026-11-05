'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {ComplianceWorld,ConsentChoice} from './consent-policy';
import {analyticsSupported,readConsent,saveConsent,subscribeConsent,trackingAllowedOnPath,worldForPath} from './consent-policy';
import s from './ConsentExperience.module.css';

const GTM_ID = 'GTM-NHKMDXGK';
type Locale = 'en'|'fr'|'ar'|'es'|'hi'|'tl'|'id';
type Copy = { label:string;heading:string;intro:string;accept:string;reject:string;customize:string;save:string;necessary:string;necessaryCopy:string;always:string;functional:string;functionalCopy:string;analytics:string;analyticsCopy:string;ads:string;adsCopy:string;unavailable:string;privacy:string;cookiePolicy:string;settings:string;note:string;};
const L:Record<Locale,Copy> = {
 en:{label:'Privacy preferences',heading:'Your privacy, your choice',intro:'Essential technology supports requested services. Optional measurement and convenience features stay off until you choose them.',accept:'Accept available options',reject:'Reject optional',customize:'Customize',save:'Save my choices',necessary:'Strictly necessary',necessaryCopy:'Security, requested sessions and service operation only where needed.',always:'Required',functional:'Optional preferences',functionalCopy:'Additional convenience preferences. Saving an item you deliberately request may still use local storage.',analytics:'Optional analytics',analyticsCopy:'Only on approved public pages after opt-in. Never on KidFlix.',ads:'Advertising and profiling',adsCopy:'Not activated. No advertising consent can be granted through this interface.',unavailable:'Inactive',privacy:'Privacy',cookiePolicy:'Cookie information',settings:'Privacy and cookies',note:'You can change or withdraw optional choices here at any time.'},
 fr:{label:'Préférences de confidentialité',heading:'Votre confidentialité, votre choix',intro:'Les technologies essentielles assurent les services demandés. Les mesures et fonctionnalités facultatives restent désactivées sans votre choix.',accept:'Accepter les options disponibles',reject:'Tout refuser (facultatif)',customize:'Personnaliser',save:'Enregistrer mes choix',necessary:'Strictement nécessaires',necessaryCopy:'Sécurité, sessions demandées et fonctionnement des services, uniquement lorsque nécessaire.',always:'Indispensables',functional:'Préférences facultatives',functionalCopy:'Confort supplémentaire. Un enregistrement demandé volontairement peut utiliser le stockage local.',analytics:'Analyse d’audience facultative',analyticsCopy:'Uniquement sur les pages publiques autorisées après accord. Jamais sur KidFlix.',ads:'Publicité et profilage',adsCopy:'Non activés. Cette interface ne recueille aucune autorisation publicitaire.',unavailable:'Inactif',privacy:'Confidentialité',cookiePolicy:'Informations cookies',settings:'Confidentialité et cookies',note:'Vous pouvez modifier ou retirer vos choix facultatifs à tout moment.'},
 ar:{label:'تفضيلات الخصوصية',heading:'خصوصيتك، اختيارك',intro:'تُستخدم التقنيات الضرورية للخدمات المطلوبة فقط. تبقى القياسات والميزات الاختيارية معطلة حتى تختارها.',accept:'قبول الخيارات المتاحة',reject:'رفض جميع الاختيارات',customize:'تخصيص',save:'حفظ اختياراتي',necessary:'ضرورية للغاية',necessaryCopy:'الأمان والجلسات المطلوبة وتشغيل الخدمة عند الحاجة فقط.',always:'ضرورية',functional:'تفضيلات اختيارية',functionalCopy:'تفضيلات إضافية؛ قد يستخدم الحفظ الذي تطلبه تخزين المتصفح.',analytics:'تحليلات اختيارية',analyticsCopy:'على الصفحات العامة المسموحة فقط بعد الموافقة؛ ولا تشمل KidFlix.',ads:'الإعلانات والتنميط',adsCopy:'غير مفعّلة. لا تُمنح موافقة على الإعلانات عبر هذه الواجهة.',unavailable:'غير فعال',privacy:'الخصوصية',cookiePolicy:'معلومات ملفات الارتباط',settings:'الخصوصية وملفات الارتباط',note:'يمكنك تعديل اختياراتك أو سحب الموافقة الاختيارية في أي وقت.'},
 es:{label:'Preferencias de privacidad',heading:'Tu privacidad, tu elección',intro:'Las tecnologías esenciales sirven las funciones solicitadas. La medición opcional queda desactivada hasta que la autorices.',accept:'Aceptar opciones disponibles',reject:'Rechazar opcionales',customize:'Personalizar',save:'Guardar mis elecciones',necessary:'Estrictamente necesarias',necessaryCopy:'Seguridad y sesiones solicitadas únicamente cuando se necesitan.',always:'Necesarias',functional:'Preferencias opcionales',functionalCopy:'Comodidades adicionales; guardar algo voluntariamente puede usar almacenamiento local.',analytics:'Analítica opcional',analyticsCopy:'Solo en páginas públicas permitidas y con consentimiento. Nunca en KidFlix.',ads:'Publicidad y perfiles',adsCopy:'Desactivados. Este panel no concede consentimiento publicitario.',unavailable:'Inactivo',privacy:'Privacidad',cookiePolicy:'Cookies',settings:'Privacidad y cookies',note:'Puedes cambiar o retirar las opciones voluntarias en cualquier momento.'},
 hi:{label:'गोपनीयता प्राथमिकताएँ',heading:'आपकी गोपनीयता, आपका निर्णय',intro:'आवश्यक तकनीक अनुरोधित सेवा के लिए है। वैकल्पिक मापन आपकी अनुमति तक बंद है।',accept:'उपलब्ध विकल्प स्वीकारें',reject:'वैकल्पिक अस्वीकारें',customize:'चुनें',save:'विकल्प सहेजें',necessary:'अत्यावश्यक',necessaryCopy:'सुरक्षा और अनुरोधित सत्रों के लिए आवश्यक तकनीक।',always:'आवश्यक',functional:'वैकल्पिक प्राथमिकताएँ',functionalCopy:'अतिरिक्त सुविधा; स्वयं चुने गए सेव अनुरोध में स्थानीय भंडारण लग सकता है।',analytics:'वैकल्पिक विश्लेषण',analyticsCopy:'अनुमति मिलने पर चयनित सार्वजनिक पृष्ठों पर; KidFlix पर नहीं।',ads:'विज्ञापन और प्रोफाइलिंग',adsCopy:'बंद हैं। यह पैनल विज्ञापन सहमति नहीं देता।',unavailable:'निष्क्रिय',privacy:'गोपनीयता',cookiePolicy:'कुकी जानकारी',settings:'गोपनीयता और कुकी',note:'आप किसी भी समय अपनी वैकल्पिक सहमति बदल या वापस ले सकते हैं।'},
 tl:{label:'Mga kagustuhan sa privacy',heading:'Iyong privacy, iyong pasya',intro:'Ang mahahalagang teknolohiya ay para sa hiniling na serbisyo. Naka-off ang opsyonal na pagsukat hangga’t walang pahintulot.',accept:'Tanggapin ang mga opsyon',reject:'Tanggihan ang opsyonal',customize:'I-customize',save:'I-save ang napili',necessary:'Mahigpit na kailangan',necessaryCopy:'Seguridad at mga hiniling na session kapag kailangan.',always:'Kailangan',functional:'Opsyonal na kagustuhan',functionalCopy:'Karagdagang ginhawa; maaaring gumamit ng lokal na storage ang kusang pag-save.',analytics:'Opsyonal na analytics',analyticsCopy:'Sa pinayagang pampublikong pahina lamang matapos pumayag; hindi sa KidFlix.',ads:'Mga ad at profiling',adsCopy:'Hindi aktibo. Walang pahintulot sa ads na kinukuha rito.',unavailable:'Hindi aktibo',privacy:'Privacy',cookiePolicy:'Impormasyon sa cookies',settings:'Privacy at cookies',note:'Maaari mong baguhin o bawiin ang opsyonal na pahintulot anumang oras.'},
 id:{label:'Preferensi privasi',heading:'Privasi Anda, pilihan Anda',intro:'Teknologi wajib mendukung layanan yang diminta. Pengukuran opsional tetap nonaktif hingga Anda memilihnya.',accept:'Terima opsi tersedia',reject:'Tolak opsional',customize:'Sesuaikan',save:'Simpan pilihan',necessary:'Sangat diperlukan',necessaryCopy:'Keamanan dan sesi layanan yang diminta bila diperlukan.',always:'Wajib',functional:'Preferensi opsional',functionalCopy:'Kenyamanan tambahan; menyimpan secara sukarela mungkin memakai penyimpanan lokal.',analytics:'Analitik opsional',analyticsCopy:'Hanya di halaman publik yang diizinkan setelah persetujuan; tidak di KidFlix.',ads:'Iklan dan pemrofilan',adsCopy:'Tidak aktif. Panel ini tidak meminta persetujuan iklan.',unavailable:'Nonaktif',privacy:'Privasi',cookiePolicy:'Informasi cookie',settings:'Privasi dan cookie',note:'Anda dapat mengubah atau mencabut pilihan opsional kapan saja.'},
};
const LOGOS:Record<ComplianceWorld,string>={angelcare:'/brand/angelcare-pearl-rim-colour-r1.png',kidflix:'/kidflix/kidflix-official-optimized.webp',jobkix:'/jobkix/brand/jobkix-logo-color.png'};
const LABELS:Record<ComplianceWorld,string>={angelcare:'ANGELCARE Marketplace',kidflix:'KidFlix',jobkix:'JOBKIX'};
function languageOf(path: string):Locale {const x=path.split('/').filter(Boolean)[1];return x in L?x as Locale:'en';}
function legalLink(world:ComplianceWorld,locale:Locale,kind:'privacy'|'cookies'){
 const base=world==='angelcare'?`/angelcare-marketplace/${locale}`:`/${world}/${locale}`;
 if(world==='kidflix')return kind==='privacy'?`${base}/privacy`:`${base}/cookies`;
 if(world==='jobkix')return `${base}/legal/${kind==='privacy'?'privacy':'cookies'}`;
 return `${base}/legal/${kind==='privacy'?'privacy':'cookies'}`;
}
const DENIED={ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'};
declare global {interface Window {dataLayer?:unknown[]}}
function googleConsent(mode:'default'|'update',allow:boolean) {
 window.dataLayer ||= [];
 function gtag(..._args:unknown[]){window.dataLayer?.push(arguments);}
 gtag('consent',mode,{...DENIED,analytics_storage:allow?'granted':'denied'});
}
function loadGtm(){
 const scripts=Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="googletagmanager.com/gtm.js"]'));
 if(scripts.length) return; // Never install a duplicate container.
 googleConsent('default',false);
 googleConsent('update',true);
 window.dataLayer ||= [];
 window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
 const el=document.createElement('script');el.async=true;el.src=`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;el.setAttribute('data-angelcare-gtm',GTM_ID);document.head.appendChild(el);
}
function liveHost(){return typeof location!=='undefined' && ['angelcarehub.com','my.angelcarehub.com'].includes(location.hostname);}
function eligible(world:ComplianceWorld,path:string){return analyticsSupported(world) && trackingAllowedOnPath(path) && liveHost() && process.env.NODE_ENV==='production';}

export default function ConsentExperience(){
 const pathname=usePathname()||'';
 const world=worldForPath(pathname);
 const [ready,setReady]=useState(false),[selected,setSelected]=useState<ConsentChoice|null>(null);
 const [expanded,setExpanded]=useState(false),[analytics,setAnalytics]=useState(false),[functional,setFunctional]=useState(false);
 const liveTag=useRef(false),lastWorld=useRef<ComplianceWorld|null>(null),lastPath=useRef('');
 useEffect(()=>{
   if(!world){setReady(true);return;}
   const sync=()=>{const saved=readConsent(world);setSelected(saved);setAnalytics(Boolean(saved?.analytics));setFunctional(Boolean(saved?.functional));};
   sync();setExpanded(false);setReady(true);
   return subscribeConsent(sync);
 },[world]);
 useEffect(()=>{
   if (!ready) return;
   if(liveTag.current && (!world || lastWorld.current !== world || !eligible(world,pathname) || !selected?.analytics)){
     googleConsent('update',false);
     // Force a full document boundary; a loaded third-party runtime cannot be removed safely.
     window.location.reload();return;
   }
   if(!world||!selected?.analytics||!eligible(world,pathname))return;
   if(!liveTag.current){loadGtm();liveTag.current=Boolean(document.querySelector('script[data-angelcare-gtm]'));}
   lastWorld.current=world;
   if(lastPath.current!==pathname && liveTag.current){
     lastPath.current=pathname;
     window.dataLayer?.push({event:'angelcare_public_navigation',ac_world:world,page_path:pathname,page_location:location.origin+pathname});
   }
 },[ready,world,pathname,selected]);
 if(!world||!ready) return null;
 const locale=languageOf(pathname),copy=L[locale];
 const isRtl=locale==='ar';
 const classes=`${s.mount} ${s[world]}`;
 function commit(value:{analytics:boolean;functional:boolean}){
   const next=saveConsent(world!,value);
   if(!next){setSelected(null);setAnalytics(false);setFunctional(false);return;}
   setSelected(next);setAnalytics(next.analytics);setFunctional(next.functional);setExpanded(false);
   if(liveTag.current&&!next.analytics){googleConsent('update',false);window.location.reload();}
 }
 const showPanel=selected===null||expanded;
 return <aside className={classes} dir={isRtl?'rtl':'ltr'} aria-label={copy.label} data-compliance-world={world} data-compliance-version="2">
  {showPanel?<section className={s.panel} aria-label={copy.label}>
   <div className={s.top}><div className={s.brand}><img src={LOGOS[world]} alt={LABELS[world]} loading="lazy"/><small>{copy.label}</small></div></div>
   <h2 className={s.title}>{copy.heading}</h2>
   <p className={s.copy}>{copy.intro}</p>
   {expanded?<div className={s.prefs}>
    <div className={s.preference}><div><strong>{copy.necessary}</strong><p>{copy.necessaryCopy}</p></div><span className={s.state}>{copy.always}</span><input aria-label={copy.necessary} type="checkbox" checked readOnly disabled/></div>
    <label className={s.preference}><div><strong>{copy.functional}</strong><p>{copy.functionalCopy}</p></div><input type="checkbox" checked={functional} onChange={e=>setFunctional(e.target.checked)}/></label>
    <label className={s.preference}><div><strong>{copy.analytics}</strong><p>{copy.analyticsCopy}</p></div>{analyticsSupported(world)?<input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)}/>:<span className={s.state}>{copy.unavailable}</span>}</label>
    <div className={s.preference}><div><strong>{copy.ads}</strong><p>{copy.adsCopy}</p></div><span className={s.state}>{copy.unavailable}</span></div>
    <div className={s.actions}><button className={`${s.button} ${s.primary}`} type="button" onClick={()=>commit({analytics,functional})}>{copy.save}</button><button className={s.button} type="button" onClick={()=>commit({analytics:false,functional:false})}>{copy.reject}</button></div>
   </div>:<div className={s.actions}>
    <button className={`${s.button} ${s.primary}`} type="button" onClick={()=>commit({analytics:analyticsSupported(world),functional:true})}>{copy.accept}</button>
    <button className={s.button} type="button" onClick={()=>commit({analytics:false,functional:false})}>{copy.reject}</button>
    <button className={`${s.button} ${s.full}`} type="button" onClick={()=>setExpanded(true)}>{copy.customize}</button>
   </div>}
   <div className={s.links}><a className={s.link} href={legalLink(world,locale,'privacy')}>{copy.privacy}</a><a className={s.link} href={legalLink(world,locale,'cookies')}>{copy.cookiePolicy}</a></div>
   <p className={s.note}>{copy.note}</p>
  </section>:<button className={s.settings} type="button" onClick={()=>setExpanded(true)} aria-label={copy.settings}>{copy.settings}</button>}
 </aside>;
}
