'use client'
import {useEffect,useId,useRef,useState} from 'react'
import {usePathname} from 'next/navigation'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {Activity,Baby,BellRing,Bookmark,CalendarDays,ChevronDown,ChevronRight,CreditCard,FileText,GraduationCap,House,LayoutGrid,LifeBuoy,Menu,PackageCheck,Repeat2,Settings2,WalletCards,X,ClipboardCheck,Building2} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import type {CatalogLocale} from '../../catalog-discovery/types'
import styles from '../customer-commerce.module.css'
type Item={suffix:string;labels:Record<CatalogLocale,string>;icon:LucideIcon;group:'journeys'|'finance'|'account'}
const ITEMS:Item[]=[
{suffix:'',labels:{fr:'Accueil',en:'Home',ar:'الرئيسية'},icon:House,group:'journeys'},
{suffix:'orders',labels:{fr:'Commandes',en:'Orders',ar:'الطلبات'},icon:PackageCheck,group:'journeys'},
{suffix:'bookings',labels:{fr:'Réservations',en:'Bookings',ar:'الحجوزات'},icon:CalendarDays,group:'journeys'},
{suffix:'family',labels:{fr:'Ma famille',en:'My family',ar:'عائلتي'},icon:Baby,group:'journeys'},
{suffix:'action-center',labels:{fr:'Mes actions',en:'Actions',ar:'إجراءاتي'},icon:Activity,group:'journeys'},
{suffix:'saved',labels:{fr:'Favoris',en:'Saved',ar:'المفضلة'},icon:Bookmark,group:'journeys'},
{suffix:'enrollments',labels:{fr:'Academy',en:'Academy',ar:'الأكاديمية'},icon:GraduationCap,group:'journeys'},
{suffix:'quotations',labels:{fr:'Devis',en:'Quotes',ar:'عروض الأسعار'},icon:Building2,group:'journeys'},
{suffix:'subscriptions',labels:{fr:'Abonnements',en:'Subscriptions',ar:'الاشتراكات'},icon:Repeat2,group:'journeys'},
{suffix:'assessments',labels:{fr:'Quality Check',en:'Quality Check',ar:'فحص الجودة'},icon:ClipboardCheck,group:'journeys'},
{suffix:'wallet',labels:{fr:'Wallet',en:'Wallet',ar:'المحفظة'},icon:WalletCards,group:'finance'},
{suffix:'payments',labels:{fr:'Paiements',en:'Payments',ar:'المدفوعات'},icon:CreditCard,group:'finance'},
{suffix:'documents',labels:{fr:'Documents',en:'Documents',ar:'الوثائق'},icon:FileText,group:'account'},
{suffix:'notifications',labels:{fr:'Notifications',en:'Notifications',ar:'الإشعارات'},icon:BellRing,group:'account'},
{suffix:'support',labels:{fr:'Assistance',en:'Support',ar:'الدعم'},icon:LifeBuoy,group:'account'},
{suffix:'settings',labels:{fr:'Compte et sécurité',en:'Account & security',ar:'الحساب والأمان'},icon:Settings2,group:'account'}]
const dock=['','orders','bookings','wallet'];const primary=new Set(['','orders','bookings','family','wallet','action-center','saved'])
const href=(l:string,s:string)=>'/angelcare-marketplace/'+l+'/account'+(s?'/'+s:'')
const words={fr:{nav:'Navigation du compte',title:'Mon espace',all:'Tous les espaces',close:'Fermer',explore:'Explorer mon compte',more:'Plus',journeys:'Mes expériences',finance:'Mes finances',account:'Mon compte'},en:{nav:'Account navigation',title:'My account',all:'All sections',close:'Close',explore:'Explore my account',more:'More',journeys:'My experiences',finance:'My finances',account:'My account'},ar:{nav:'التنقل في الحساب',title:'حسابي',all:'كل الأقسام',close:'إغلاق',explore:'استكشف حسابي',more:'المزيد',journeys:'تجاربي',finance:'أموالي',account:'حسابي'}} as const
export function CustomerPortalNavigation({locale}:{locale:CatalogLocale}){
const pathname=usePathname(),t=words[locale],id=useId()
const [expanded,setExpanded]=useState(false)
const sheet=useRef<HTMLElement>(null)
const current=(s:string)=>{const x=href(locale,s);return s?pathname===x||pathname.startsWith(x+'/'):pathname===x||pathname===x+'/'}
useEffect(()=>setExpanded(false),[pathname])
useEffect(()=>{if(!expanded)return;const mobile=window.matchMedia('(max-width:780px)').matches;const focus=document.activeElement instanceof HTMLElement?document.activeElement:null;const overflow=document.body.style.overflow;if(mobile){document.body.style.overflow='hidden';sheet.current?.querySelector<HTMLElement>('button')?.focus()}const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setExpanded(false);return}if(!mobile||e.key!=='Tab'||!sheet.current)return;const elements=Array.from(sheet.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href]'));if(!elements.length)return;if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements[elements.length-1].focus()}else if(!e.shiftKey&&document.activeElement===elements[elements.length-1]){e.preventDefault();elements[0].focus()}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(mobile)focus?.focus()}},[expanded])
const groups:Item['group'][]=['journeys','finance','account']
return <><nav className={styles.portalPremiumNav} aria-label={t.nav}><div className={styles.portalPremiumNavHead}><span><LayoutGrid size={18}/>{t.title}</span><small>ANGELCARE 360</small></div><div className={styles.portalPremiumNavMain}>{ITEMS.filter(i=>primary.has(i.suffix)).map(i=><Link key={i.suffix||'home'} href={href(locale,i.suffix)} data-current={current(i.suffix)} aria-current={current(i.suffix)?'page':undefined}><i.icon size={18}/><span>{i.labels[locale]}</span></Link>)}</div><button type="button" className={styles.portalNavExpand} onClick={()=>setExpanded(s=>!s)} aria-expanded={expanded} aria-controls={id}><Menu size={18}/>{t.all}<ChevronDown size={15}/></button>{expanded?<div className={styles.portalExpandedDesktop} id={id}>{groups.map(g=><section key={g}><h3>{t[g]}</h3>{ITEMS.filter(i=>i.group===g&&!primary.has(i.suffix)).map(i=><Link key={i.suffix} href={href(locale,i.suffix)} aria-current={current(i.suffix)?'page':undefined}><i.icon size={17}/>{i.labels[locale]}<ChevronRight size={14}/></Link>)}</section>)}</div>:null}</nav><nav className={styles.portalMobileDock} aria-label={t.nav}>{dock.map(s=>{const item=ITEMS.find(i=>i.suffix===s)!;return <Link key={s||'home'} href={href(locale,s)} data-current={current(s)} aria-current={current(s)?'page':undefined}><item.icon size={21}/><span>{item.labels[locale]}</span></Link>})}<button type="button" onClick={()=>setExpanded(true)} aria-controls={id+'-sheet'} aria-expanded={expanded} aria-haspopup="dialog" data-current={!dock.some(current)}><Menu size={21}/><span>{t.more}</span></button></nav>{expanded?<div className={styles.portalSheetBackdrop} onClick={()=>setExpanded(false)}><section ref={sheet} className={styles.portalMobileSheet} id={id+'-sheet'} role="dialog" aria-modal="true" aria-label={t.all} onClick={e=>e.stopPropagation()}><div className={styles.portalSheetHandle}/><header><div><small>MON ANGELCARE</small><h2>{t.explore}</h2></div><button type="button" onClick={()=>setExpanded(false)} aria-label={t.close}><X size={21}/></button></header><div className={styles.portalSheetGroups}>{groups.map(g=><section key={g}><h3>{t[g]}</h3><div>{ITEMS.filter(i=>i.group===g).map(i=><Link key={i.suffix||'home'} href={href(locale,i.suffix)} data-current={current(i.suffix)}><i.icon size={18}/><span>{i.labels[locale]}</span><ChevronRight size={15}/></Link>)}</div></section>)}</div></section></div>:null}</>}
