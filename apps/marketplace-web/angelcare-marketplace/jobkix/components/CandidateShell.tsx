import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight,ArrowUpRight,Bell,BookOpen,Bookmark,BriefcaseBusiness,CalendarCheck2,ChevronRight,CircleHelp,Compass,FileText,Globe2,HeartHandshake,Home,LockKeyhole,Menu,MessageCircle,Search,Settings2,ShieldCheck,Sparkles,UserRound,UserRoundCheck,UsersRound,ChartColumnIncreasing} from 'lucide-react';
import type {Locale} from '../contracts';
import {SCREENS,href} from '../routes';
import {screenName} from '../screen-copy';
import {SignOut} from '../client/SignOut';
import {t} from '../i18n';
import pm from './candidate-pro-max5.module.css';

type Props={locale:Locale;screenId:string;title:string;children:ReactNode};
type Texts={platform:string,workspace:string,menu:string,overview:string,opportunities:string,journey:string,identity:string,communication:string,account:string,search:string,searchButton:string,explore:string,quick:string,related:string,notifications:string,support:string,privacy:string,back:string,rights:string,active:string,continue:string,tools:string,home:string,profile:string};
const WORDS:Record<Locale,Texts>={
 en:{platform:'GLOBAL CAREER COMMAND CENTER',workspace:'My career workspace',menu:'Career navigation',overview:'Overview',opportunities:'Discover & collect',journey:'My applications',identity:'Career identity',communication:'Interviews & messages',account:'Privacy & assistance',search:'Explore jobs, skills, professions...',searchButton:'Search jobs',explore:'Discover opportunities',quick:'Quick actions',related:'Connected workspaces',notifications:'Notifications',support:'Help & support',privacy:'Private, candidate-controlled experience',back:'Return',rights:'Your career. Your choices.',active:'Your space',continue:'Open workspace',tools:'Career tools',home:'Home',profile:'Career passport'},
 fr:{platform:'CENTRE DE PILOTAGE DE CARRIÈRE',workspace:'Mon espace carrière',menu:'Navigation carrière',overview:'Vue générale',opportunities:'Découvrir et enregistrer',journey:'Mes candidatures',identity:'Identité professionnelle',communication:'Entretiens et messages',account:'Confidentialité et assistance',search:'Rechercher emplois, métiers, compétences...',searchButton:'Rechercher',explore:'Découvrir les offres',quick:'Actions rapides',related:'Espaces associés',notifications:'Notifications',support:'Aide et assistance',privacy:'Espace privé contrôlé par le candidat',back:'Retour',rights:'Votre carrière. Vos choix.',active:'Votre espace',continue:'Ouvrir',tools:'Outils carrière',home:'Accueil',profile:'Passeport professionnel'},
 es:{platform:'CENTRO DE CONTROL DE CARRERA',workspace:'Mi espacio profesional',menu:'Navegación profesional',overview:'Resumen',opportunities:'Descubrir y guardar',journey:'Mis candidaturas',identity:'Identidad profesional',communication:'Entrevistas y mensajes',account:'Privacidad y ayuda',search:'Buscar empleos y profesiones...',searchButton:'Buscar',explore:'Descubrir oportunidades',quick:'Acciones rápidas',related:'Espacios relacionados',notifications:'Notificaciones',support:'Ayuda y soporte',privacy:'Espacio privado controlado por el candidato',back:'Volver',rights:'Tu carrera. Tus decisiones.',active:'Tu espacio',continue:'Abrir',tools:'Herramientas',home:'Inicio',profile:'Pasaporte profesional'},
 hi:{platform:'वैश्विक करियर केंद्र',workspace:'मेरा करियर कार्यक्षेत्र',menu:'करियर नेविगेशन',overview:'अवलोकन',opportunities:'खोजें और सहेजें',journey:'मेरे आवेदन',identity:'पेशेवर पहचान',communication:'साक्षात्कार और संदेश',account:'गोपनीयता और सहायता',search:'नौकरियाँ और पेशे खोजें...',searchButton:'खोजें',explore:'अवसर खोजें',quick:'त्वरित कार्य',related:'संबंधित कार्यक्षेत्र',notifications:'सूचनाएँ',support:'सहायता',privacy:'उम्मीदवार द्वारा नियंत्रित निजी कार्यक्षेत्र',back:'वापस',rights:'आपका करियर। आपके निर्णय।',active:'आपका स्थान',continue:'खोलें',tools:'करियर उपकरण',home:'होम',profile:'करियर पासपोर्ट'},
 tl:{platform:'GLOBAL CAREER CENTER',workspace:'Aking career workspace',menu:'Career navigation',overview:'Pangkalahatang-ideya',opportunities:'Maghanap at mag-save',journey:'Aking mga aplikasyon',identity:'Propesyonal na identidad',communication:'Panayam at mga mensahe',account:'Privacy at suporta',search:'Maghanap ng trabaho at propesyon...',searchButton:'Maghanap',explore:'Tuklasin ang oportunidad',quick:'Mabilis na aksyon',related:'Kaugnay na workspace',notifications:'Mga abiso',support:'Tulong at suporta',privacy:'Pribadong espasyong kontrolado ng kandidato',back:'Bumalik',rights:'Karera mo. Desisyon mo.',active:'Iyong espasyo',continue:'Buksan',tools:'Mga career tool',home:'Home',profile:'Career Passport'},
 id:{platform:'PUSAT KARIER GLOBAL',workspace:'Ruang karier saya',menu:'Navigasi karier',overview:'Ringkasan',opportunities:'Temukan dan simpan',journey:'Lamaran saya',identity:'Identitas profesional',communication:'Wawancara dan pesan',account:'Privasi dan bantuan',search:'Cari pekerjaan dan profesi...',searchButton:'Cari',explore:'Temukan peluang',quick:'Tindakan cepat',related:'Ruang terkait',notifications:'Notifikasi',support:'Bantuan dan dukungan',privacy:'Ruang pribadi yang dikendalikan kandidat',back:'Kembali',rights:'Karier Anda. Pilihan Anda.',active:'Ruang Anda',continue:'Buka',tools:'Alat karier',home:'Beranda',profile:'Paspor Karier'},
 ar:{platform:'مركز إدارة المسار المهني',workspace:'مساحتي المهنية',menu:'التنقل المهني',overview:'نظرة عامة',opportunities:'استكشف واحفظ',journey:'طلباتي',identity:'الهوية المهنية',communication:'المقابلات والرسائل',account:'الخصوصية والمساعدة',search:'ابحث عن وظائف ومهن ومهارات...',searchButton:'بحث',explore:'استكشف الفرص',quick:'إجراءات سريعة',related:'مساحات مرتبطة',notifications:'الإشعارات',support:'المساعدة والدعم',privacy:'مساحة خاصة يتحكم فيها المرشح',back:'عودة',rights:'مسارك المهني. اختياراتك.',active:'مساحتك',continue:'فتح',tools:'الأدوات المهنية',home:'الرئيسية',profile:'الجواز المهني'}
};
const GROUPS:Array<{label:keyof Texts;ids:string[]}>= [
 {label:'overview',ids:['C01']},
 {label:'opportunities',ids:['C02','C03','C10']},
 {label:'journey',ids:['C04','C08','C09']},
 {label:'identity',ids:['C06','C07','C12']},
 {label:'account',ids:['C11','C13','C14']}
];
const ICONS:Record<string,typeof Home>={C01:Home,C02:Compass,C03:Bookmark,C04:BriefcaseBusiness,C05:FileText,C06:UserRoundCheck,C07:FileText,C08:CalendarCheck2,C09:MessageCircle,C10:Bell,C11:ShieldCheck,C12:ChartColumnIncreasing,C13:Settings2,C14:CircleHelp};
const RELATED:Record<string,string[]>={C01:['C02','C04','C06','C08'],C02:['C03','C10','C06','C04'],C03:['C02','C10','C04'],C04:['C02','C05','C08','C09'],C05:['C04','C08','C09','C07'],C06:['C07','C11','C12','C02'],C07:['C06','C04','C12'],C08:['C04','C09','C01'],C09:['C04','C08','C10'],C10:['C02','C03','C09'],C11:['C06','C13','C14'],C12:['C06','C07','C02'],C13:['C11','C14','C06'],C14:['C13','C11','C01']};
const PURPOSE:Record<string,{en:string;fr:string;es:string}>={
 C01:{en:'Track genuine applications, upcoming interviews and your next career moves.',fr:'Suivez candidatures, entretiens et prochaines étapes de votre parcours.',es:'Sigue tus solicitudes, entrevistas y próximos pasos.'},
 C02:{en:'Research global opportunities with real filters and save what matters.',fr:'Explorez les offres internationales avec des filtres et recherches enregistrées.',es:'Explora empleos internacionales y guarda lo importante.'},
 C03:{en:'Organize saved vacancies and resources into useful collections.',fr:'Organisez les offres et ressources que vous avez conservées.',es:'Organiza tus empleos y recursos guardados.'},
 C04:{en:'Follow every application from submission through the recorded next stage.',fr:'Suivez vos candidatures et les changements de statut enregistrés.',es:'Sigue el estado de cada candidatura.'},
 C05:{en:'Inspect your submitted evidence, messages, interviews, offers and timeline.',fr:'Retrouvez vos pièces, messages, entretiens, offres et historique.',es:'Consulta documentos, mensajes, entrevistas y ofertas.'},
 C06:{en:'Build your professional identity and keep your profile under your control.',fr:'Construisez votre identité professionnelle et maîtrisez votre profil.',es:'Construye y controla tu identidad profesional.'},
 C07:{en:'Securely manage your CVs, supporting files and document history.',fr:'Gérez vos CV et documents professionnels en toute sécurité.',es:'Gestiona CV y documentos profesionales de forma segura.'},
 C08:{en:'Prepare for interviews, review confirmed details and respond securely.',fr:'Préparez vos entretiens et répondez aux invitations.',es:'Prepara entrevistas y responde a invitaciones.'},
 C09:{en:'Keep recruitment conversations and notifications in one place.',fr:'Retrouvez vos échanges de recrutement et notifications.',es:'Consulta tus conversaciones y notificaciones.'},
 C10:{en:'Manage saved searches and opportunity alerts.',fr:'Gérez les recherches enregistrées et les alertes.',es:'Gestiona búsquedas guardadas y alertas.'},
 C11:{en:'Control profile visibility and access to your candidate information.',fr:'Contrôlez la visibilité et l’accès à vos données.',es:'Controla la visibilidad y privacidad de tus datos.'},
 C12:{en:'Review your declared career evidence and explore relevant opportunities.',fr:'Passez en revue vos compétences déclarées et des pistes professionnelles.',es:'Revisa tu experiencia declarada y posibles oportunidades.'},
 C13:{en:'Manage sign-in preferences, notifications and account security.',fr:'Gérez les préférences, notifications et la sécurité du compte.',es:'Gestiona preferencias, avisos y seguridad.'},
 C14:{en:'Get support and follow your submitted cases and responses.',fr:'Obtenez de l’aide et suivez vos dossiers et réponses.',es:'Solicita ayuda y consulta tus casos.'}
};
function linkFor(locale:Locale,id:string){const found=SCREENS.find(s=>s.id===id);return href(locale,found&& !found.path.includes(':')?found.path:'career/applications');}
export function CandidateShell({locale,screenId,title,children}:Props){
 const l=WORDS[locale]||WORDS.en,active=screenId==='C05'?'C04':screenId,Icon=ICONS[screenId]||UserRound;
 const nav=(compact:boolean)=><nav className={compact?pm.mobileNav:pm.nav} aria-label={l.menu}>{GROUPS.map(g=><div className={pm.navGroup} key={g.label}><span className={pm.groupHeading}>{l[g.label]}</span>{g.ids.map(id=>{const I=ICONS[id];return <Link key={id} href={linkFor(locale,id)} className={active===id?pm.activeLink:pm.navLink} aria-current={active===id?'page':undefined}><I size={17} aria-hidden="true"/><span>{screenName(id,locale)}</span>{active===id?<span className={pm.activeDot}/>:null}</Link>})}</div>)}</nav>;
 const related=(RELATED[screenId]||RELATED.C01).filter(id=>id!=='C05'||screenId==='C05');
 return <div className={pm.frame} data-jobkix-candidate-pm5 data-candidate-screen={screenId}>
  <aside className={pm.sidebar} aria-label={l.menu}>
   <div className={pm.brand}><Link href={href(locale,'career')} aria-label="JOBKIX Global Careers Platform"><img src="/jobkix/brand/jobkix-logo-white.png" alt="JOBKIX · Global Careers Platform"/></Link><small>{l.platform}</small></div>
   <div className={pm.userBlock}><span className={pm.userSymbol}><UserRound size={22}/></span><div><strong>{l.workspace}</strong><small>{l.privacy}</small></div></div>
   {nav(false)}
   <div className={pm.sidebarBottom}><Link href={href(locale,'career/help')}><HeartHandshake size={19}/>{l.support}<ArrowUpRight size={14}/></Link><p><LockKeyhole size={14}/>{l.rights}</p></div>
  </aside>
  <div className={pm.workArea}>
   <header className={pm.topbar}>
    <details className={pm.mobileMenu}><summary><Menu size={20}/>{l.menu}</summary>{nav(true)}</details>
    <form className={pm.search} role="search" method="get" action={href(locale,'career/discovery')}><Search size={18}/><label className={pm.srOnly} htmlFor="jobkix-candidate-pm5-search">{l.search}</label><input id="jobkix-candidate-pm5-search" type="search" name="q" maxLength={300} placeholder={l.search}/><button type="submit">{l.searchButton}</button></form>
    <div className={pm.topActions}><span className={pm.locale}><Globe2 size={16}/>{locale.toUpperCase()}</span><Link aria-label={l.notifications} title={l.notifications} href={href(locale,'career/inbox',new URLSearchParams({tab:'notifications'}))}><Bell size={19}/></Link><Link aria-label={l.profile} title={l.profile} href={href(locale,'career/passport')}><UserRound size={19}/></Link><span className={pm.signOut}><SignOut locale={locale}/></span></div>
   </header>
   <div className={pm.main} role="region" aria-label={title}>
    <div className={pm.crumbs}><Link href={href(locale,'career')}>JOBKIX</Link><ChevronRight size={14}/><span>{l.workspace}</span><ChevronRight size={14}/><strong>{title}</strong></div>
    <div className={pm.titleBar}><div className={pm.titleCopy}><div className={pm.kicker}><Icon size={15}/><span>{screenId}</span><span className={pm.kickerDot}/><span>{l.active}</span></div><h1>{title}</h1><p>{PURPOSE[screenId]?.[locale==='fr'?'fr':locale==='es'?'es':'en']||PURPOSE.C01.en}</p></div><Link className={pm.primaryAction} href={href(locale,'career/discovery')}><Compass size={17}/>{l.explore}</Link></div>
    <nav className={pm.related} aria-label={l.related}><span className={pm.relatedHead}><Sparkles size={15}/>{l.related}</span>{related.map(id=>{const I=ICONS[id];return <Link href={linkFor(locale,id)} key={id}><I size={15}/><span>{screenName(id,locale)}</span><ChevronRight size={13}/></Link>})}</nav>
    <div className={pm.content} data-candidate-content={screenId}>{children}</div>
    <footer className={pm.footer}><Link href={href(locale)} aria-label="JOBKIX"><img src="/jobkix/brand/jobkix-logo-color.png" width={99} height={40} alt="JOBKIX"/></Link><span><ShieldCheck size={16}/>{l.privacy}</span><div><Link href={href(locale,'trust')}>{t(locale,'trust')}</Link><Link href={href(locale,'career/help')}>{l.support}</Link><Link href={href(locale,'career/settings')}>{l.account}</Link></div></footer>
   </div>
  </div>
 </div>;
}
