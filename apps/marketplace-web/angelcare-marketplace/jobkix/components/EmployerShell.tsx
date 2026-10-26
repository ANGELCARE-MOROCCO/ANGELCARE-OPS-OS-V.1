import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight,BarChart3,Bell,BriefcaseBusiness,CalendarDays,ChevronRight,CircleHelp,FileCheck2,FilePlus2,Globe2,LayoutDashboard,LockKeyhole,Menu,MessagesSquare,Search,Settings2,ShieldCheck,SlidersHorizontal,UsersRound,UserRoundSearch,Workflow,Building2,Layers3} from 'lucide-react';
import type {Locale} from '../contracts';
import {SCREENS,href} from '../routes';
import {screenName} from '../screen-copy';
import {SignOut} from '../client/SignOut';
import {t} from '../i18n';
import pm from './employer-pro-max5.module.css';

type Props={locale:Locale;screenId:string;title:string;children:ReactNode;context?:ReactNode;organizationId?:string};
type Icon=typeof LayoutDashboard;
type L10n={command:string,search:string,overview:string,recruitment:string,talent:string,decisions:string,organization:string,control:string,workspace:string,newVacancy:string,quick:string,open:string,support:string,account:string,security:string,related:string,scope:string,privacy:string,searchButton:string,notifications:string,menu:string,work:string,go:string,home:string};
const WORDS:Record<Locale,L10n>={
 en:{command:'RECRUITMENT COMMAND CENTER',search:'Search applications and candidates',overview:'Command center',recruitment:'Jobs & recruitment',talent:'Talent & engagement',decisions:'Hiring decisions',organization:'Organization',control:'Control center',workspace:'Employer workspace',newVacancy:'Create vacancy',quick:'Quick access',open:'Open workspace',support:'Help & support',account:'Account',security:'Secure employer environment',related:'Related workspaces',scope:'Organization context',privacy:'Access is governed by your organization permissions',searchButton:'Search',notifications:'Notifications',menu:'Workspaces',work:'Recruitment operations',go:'Open',home:'Home'},
 fr:{command:'CENTRE DE COMMANDEMENT RECRUTEMENT',search:'Rechercher candidats et candidatures',overview:'Centre de commande',recruitment:'Offres et recrutement',talent:'Talents et échanges',decisions:'Décisions de recrutement',organization:'Organisation',control:'Centre de contrôle',workspace:'Espace recruteur',newVacancy:'Créer une offre',quick:'Accès rapide',open:'Ouvrir cet espace',support:'Aide et assistance',account:'Compte',security:'Environnement recruteur sécurisé',related:'Espaces associés',scope:'Contexte organisation',privacy:'Accès selon les permissions de votre organisation',searchButton:'Rechercher',notifications:'Notifications',menu:'Espaces de travail',work:'Opérations de recrutement',go:'Ouvrir',home:'Accueil'},
 es:{command:'CENTRO DE OPERACIONES DE CONTRATACIÓN',search:'Buscar candidatos y solicitudes',overview:'Centro de control',recruitment:'Vacantes y contratación',talent:'Talento y comunicación',decisions:'Decisiones de contratación',organization:'Organización',control:'Centro de control',workspace:'Portal del empleador',newVacancy:'Crear vacante',quick:'Acceso rápido',open:'Abrir espacio',support:'Ayuda y asistencia',account:'Cuenta',security:'Entorno seguro para empleadores',related:'Espacios relacionados',scope:'Contexto organizativo',privacy:'Acceso según permisos de tu organización',searchButton:'Buscar',notifications:'Notificaciones',menu:'Espacios de trabajo',work:'Operaciones de contratación',go:'Abrir',home:'Inicio'},
 hi:{command:'भर्ती संचालन केंद्र',search:'आवेदन और उम्मीदवार खोजें',overview:'नियंत्रण केंद्र',recruitment:'नौकरियां और भर्ती',talent:'प्रतिभा और संवाद',decisions:'भर्ती निर्णय',organization:'संगठन',control:'नियंत्रण',workspace:'नियोक्ता कार्यक्षेत्र',newVacancy:'नई रिक्ति बनाएं',quick:'त्वरित पहुंच',open:'कार्यक्षेत्र खोलें',support:'सहायता',account:'खाता',security:'सुरक्षित नियोक्ता वातावरण',related:'संबंधित कार्यक्षेत्र',scope:'संगठन संदर्भ',privacy:'पहुँच संगठन की अनुमति के अनुसार है',searchButton:'खोजें',notifications:'सूचनाएं',menu:'कार्यक्षेत्र',work:'भर्ती संचालन',go:'खोलें',home:'होम'},
 tl:{command:'SENTRO NG OPERASYON SA PAG-HIRE',search:'Maghanap ng aplikasyon at kandidato',overview:'Command center',recruitment:'Trabaho at recruitment',talent:'Talento at ugnayan',decisions:'Mga desisyon sa pag-hire',organization:'Organisasyon',control:'Control center',workspace:'Employer workspace',newVacancy:'Gumawa ng vacancy',quick:'Mabilis na access',open:'Buksan ang workspace',support:'Tulong at suporta',account:'Account',security:'Ligtas na employer environment',related:'Kaugnay na workspace',scope:'Konteksto ng organisasyon',privacy:'Batay sa pahintulot ng organisasyon ang access',searchButton:'Maghanap',notifications:'Mga abiso',menu:'Mga workspace',work:'Recruitment operations',go:'Buksan',home:'Home'},
 id:{command:'PUSAT OPERASI REKRUTMEN',search:'Cari lamaran dan kandidat',overview:'Pusat kendali',recruitment:'Lowongan dan rekrutmen',talent:'Talenta dan komunikasi',decisions:'Keputusan perekrutan',organization:'Organisasi',control:'Pusat kontrol',workspace:'Ruang kerja pemberi kerja',newVacancy:'Buat lowongan',quick:'Akses cepat',open:'Buka ruang kerja',support:'Bantuan dan dukungan',account:'Akun',security:'Lingkungan pemberi kerja aman',related:'Ruang kerja terkait',scope:'Konteks organisasi',privacy:'Akses sesuai izin organisasi Anda',searchButton:'Cari',notifications:'Notifikasi',menu:'Ruang kerja',work:'Operasi rekrutmen',go:'Buka',home:'Beranda'},
 ar:{command:'مركز عمليات التوظيف',search:'البحث عن الطلبات والمرشحين',overview:'مركز القيادة',recruitment:'الوظائف والتوظيف',talent:'المواهب والتواصل',decisions:'قرارات التوظيف',organization:'المؤسسة',control:'مركز التحكم',workspace:'مساحة صاحب العمل',newVacancy:'إنشاء وظيفة',quick:'وصول سريع',open:'فتح المساحة',support:'المساعدة والدعم',account:'الحساب',security:'بيئة آمنة لأصحاب العمل',related:'مساحات مرتبطة',scope:'سياق المؤسسة',privacy:'تخضع إمكانية الوصول لصلاحيات مؤسستك',searchButton:'بحث',notifications:'الإشعارات',menu:'مساحات العمل',work:'عمليات التوظيف',go:'فتح',home:'الرئيسية'}
};
const ICONS:Record<string,Icon>={H01:LayoutDashboard,H02:BriefcaseBusiness,H03:FilePlus2,H04:Layers3,H05:FileCheck2,H06:Workflow,H07:UserRoundSearch,H08:UsersRound,H09:CalendarDays,H10:FileCheck2,H11:MessagesSquare,H12:UsersRound,H13:Building2,H14:ShieldCheck,H15:BarChart3,H16:Settings2};
const GROUPS:Array<{label:keyof L10n;ids:string[]}>= [
 {label:'overview',ids:['H01','H15']},
 {label:'recruitment',ids:['H02','H03','H05','H06']},
 {label:'talent',ids:['H07','H08','H11']},
 {label:'decisions',ids:['H09','H10']},
 {label:'organization',ids:['H12','H13','H14']},
 {label:'control',ids:['H16']}
];
const RELATED:Record<string,string[]>={H01:['H02','H05','H09','H15'],H02:['H03','H05','H06','H15'],H03:['H02','H13','H14'],H04:['H02','H05','H06','H09'],H05:['H06','H09','H11'],H06:['H05','H09','H10'],H07:['H08','H05','H11'],H08:['H07','H11','H05'],H09:['H05','H10','H11'],H10:['H09','H05','H11'],H11:['H05','H06','H09'],H12:['H13','H14','H16'],H13:['H12','H14','H02'],H14:['H13','H12','H16'],H15:['H01','H02','H05'],H16:['H12','H13','H14']};
const PURPOSES:Record<string,Partial<Record<Locale,string>>>= {
 H01:{en:'Your daily hiring agenda, recruitment health and next decisions.',fr:'Vos priorités de recrutement, performances et prochaines décisions.',es:'Tus prioridades, resultados y próximas decisiones de contratación.'},
 H02:{en:'Manage all active, drafted and reviewed job opportunities.',fr:'Pilotez toutes les offres, publications et révisions.',es:'Gestiona todas las vacantes y sus publicaciones.'},
 H03:{en:'Prepare the position, conditions and screening before publication.',fr:'Préparez le poste, les conditions et la sélection avant publication.',es:'Prepara el puesto, las condiciones y los filtros antes de publicar.'},
 H04:{en:'A complete operational view of this vacancy and its history.',fr:'Vue opérationnelle complète de cette offre et son historique.',es:'Control integral de esta vacante y su historial.'},
 H05:{en:'Review application evidence and make authorized stage decisions.',fr:'Étudiez les candidatures et prenez des décisions autorisées.',es:'Revisa las candidaturas y toma decisiones autorizadas.'},
 H06:{en:'Move applicants through verified stages and compare evidence.',fr:'Suivez les étapes du recrutement et comparez les profils.',es:'Gestiona las etapas y compara los perfiles.'},
 H07:{en:'Discover professionals who opted into employer visibility.',fr:'Découvrez les professionnels ayant consenti à être visibles.',es:'Descubre profesionales con consentimiento de visibilidad.'},
 H08:{en:'Organize and maintain consent-scoped candidate pools.',fr:'Organisez vos viviers de talents selon les consentements.',es:'Organiza grupos de talento respetando el consentimiento.'},
 H09:{en:'Coordinate interviews, panel participation and evaluations.',fr:'Coordonnez entretiens, jurys et évaluations.',es:'Coordina entrevistas, paneles y evaluaciones.'},
 H10:{en:'Manage offers, terms, decisions and response deadlines.',fr:'Gérez offres, conditions, décisions et échéances.',es:'Gestiona ofertas, condiciones, decisiones y plazos.'},
 H11:{en:'Communicate within secure, application-linked conversations.',fr:'Échangez dans des conversations sécurisées liées aux candidatures.',es:'Comunícate en conversaciones vinculadas a las candidaturas.'},
 H12:{en:'Coordinate hiring teammates, invitations and scoped permissions.',fr:'Gérez vos équipes, invitations et autorisations.',es:'Gestiona equipos, invitaciones y permisos.'},
 H13:{en:'Maintain your employer identity, locations and organization record.',fr:'Pilotez identité employeur, établissements et organisation.',es:'Administra identidad del empleador, sedes y organización.'},
 H14:{en:'Manage identity verification, documents and supported review.',fr:'Suivez vérification, documents et contrôles.',es:'Gestiona verificación, documentos y revisiones.'},
 H15:{en:'Inspect verified recruitment activity and measurable outcomes.',fr:'Analysez l’activité de recrutement et les résultats mesurables.',es:'Analiza la actividad y los resultados verificables.'},
 H16:{en:'Manage account preferences, security and trusted controls.',fr:'Gérez les préférences, la sécurité et les contrôles du compte.',es:'Gestiona preferencias, seguridad y controles de la cuenta.'}
};
function linkFor(locale:Locale,id:string,params:URLSearchParams|undefined){const item=SCREENS.find(screen=>screen.id===id);if(!item)return href(locale,'hiring');return href(locale,item.path.includes(':')?'hiring/vacancies':item.path,params);}
export function EmployerShell({locale,screenId,title,children,context,organizationId}:Props){
 const v=WORDS[locale]||WORDS.en, navParams=organizationId?new URLSearchParams({organization:organizationId}):undefined,active=screenId==='H04'?'H02':screenId;
 const Nav=({compact=false}:{compact?:boolean})=><nav className={compact?pm.compactNav:pm.sideNav} aria-label={v.menu}>
  {GROUPS.map(group=><div className={pm.navGroup} key={group.label}><span className={pm.groupTitle}>{v[group.label]}</span>{group.ids.map(id=>{const Icon=ICONS[id],isCurrent=id===active;return <Link key={id} href={linkFor(locale,id,navParams)} className={isCurrent?pm.navCurrent:pm.navLink} aria-current={isCurrent?'page':undefined}><Icon size={17} aria-hidden="true"/><span>{screenName(id,locale)}</span>{isCurrent?<span className={pm.activeMark}/>:null}</Link>;})}</div>)}
 </nav>;
 const related=(RELATED[screenId]||RELATED.H01).filter(id=>id!==screenId);
 const PrimaryIcon=ICONS[screenId]||BriefcaseBusiness;
 return <div className={pm.root} data-jobkix-employer-pm5 data-employer-screen={screenId}>
  <aside className={pm.sidebar} aria-label={v.menu}>
   <div className={pm.sideBrand}><Link href={href(locale,'hiring')} aria-label="JOBKIX employer workspace"><img src="/jobkix/brand/jobkix-logo-white.png" alt="JOBKIX · Global Careers Platform"/></Link><small>{v.command}</small></div>
   <div className={pm.sidebarContext}><Globe2 size={19} aria-hidden="true"/><div><strong>{v.workspace}</strong><span>{v.scope}</span></div><ChevronRight size={16}/></div>
   <Nav/>
   <div className={pm.sidebarFoot}><Link href={href(locale,'help')}><CircleHelp size={18}/><span>{v.support}</span><ArrowRight size={14}/></Link><small><LockKeyhole size={13}/>{v.security}</small></div>
  </aside>
  <div className={pm.workplace}>
   <header className={pm.topbar}>
    <details className={pm.mobileNavigation}><summary><Menu size={19}/><span>{v.menu}</span></summary><Nav compact/></details>
    <form className={pm.search} role="search" method="get" action={href(locale,'hiring/applications')}><Search size={18} aria-hidden="true"/><label className={pm.srOnly} htmlFor="jobkix-employer-search">{v.search}</label><input id="jobkix-employer-search" type="search" name="q" maxLength={300} placeholder={v.search}/>{organizationId?<input type="hidden" name="organization" value={organizationId}/>:null}<button type="submit">{v.searchButton}</button></form>
    <div className={pm.topControls}><span className={pm.localeCode}><Globe2 size={15} aria-hidden="true"/>{locale.toUpperCase()}</span><Link href={href(locale,'hiring/inbox',new URLSearchParams({...(organizationId?{organization:organizationId}:{}),tab:'notifications'}))} title={v.notifications} aria-label={v.notifications}><Bell size={19}/></Link><Link href={linkFor(locale,'H16',navParams)} title={v.account} aria-label={v.account}><Settings2 size={19}/></Link><div className={pm.logout}><SignOut locale={locale}/></div></div>
   </header>
   <div className={pm.content} id="jobkix-employer-workspace" role="region" aria-label={title} tabIndex={-1}>
    <div className={pm.breadcrumb}><Link href={href(locale,'hiring')}>JOBKIX</Link><ChevronRight size={13}/><span>{v.work}</span><ChevronRight size={13}/><b>{title}</b></div>
    <div className={pm.pageHeader}><div className={pm.pageTitle}><div className={pm.kicker}><PrimaryIcon size={15}/><span>{screenId}</span><span className={pm.kickerDot}/><span>{v.workspace}</span></div><h1>{title}</h1><p>{PURPOSES[screenId]?.[locale]||PURPOSES[screenId]?.en||v.privacy}</p></div><div className={pm.pageActions}>{context}<Link className={pm.primaryAction} href={href(locale,'hiring/vacancies/new',navParams)}><FilePlus2 size={17}/>{v.newVacancy}</Link></div></div>
    <div className={pm.contextTabs} aria-label={v.related}><div className={pm.tabLead}><SlidersHorizontal size={15}/><span>{v.related}</span></div>{related.map(id=>{const Icon=ICONS[id];return <Link key={id} href={linkFor(locale,id,navParams)}><Icon size={15}/>{screenName(id,locale)}<ChevronRight size={13}/></Link>;})}</div>
    <div className={pm.workspaceBody} data-jobkix-active-workspace={screenId}>{children}</div>
    <footer className={pm.workspaceFoot}><Link className={pm.footerBrand} href={href(locale)} aria-label="JOBKIX"><img src="/jobkix/brand/jobkix-logo-color.png" width={92} height={36} alt="JOBKIX"/></Link><span><ShieldCheck size={16}/>{v.privacy}</span><div><Link href={href(locale,'trust')}>{t(locale,'trust')}</Link><span>·</span><Link href={href(locale,'help')}>{v.support}</Link><span>·</span><span>JOBKIX Employer OS</span></div></footer>
   </div>
  </div>
 </div>;
}
