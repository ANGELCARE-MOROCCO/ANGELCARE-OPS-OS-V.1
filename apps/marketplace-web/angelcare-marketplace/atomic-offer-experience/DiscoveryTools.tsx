'use client'
import {ArrowUpRight,BookOpen,CalendarDays,Check,Layers,Package,Search,ShieldCheck,Users} from 'lucide-react'
import {useState} from 'react'
import {useExperience} from './context'
import {display,present,sectionVisibility,sectionsFrom,type AtomicSectionProps} from './model'
import styles from './atomic.module.css'
import {responsiveDataAttributes} from '../studio-universal/design'
import type {StudioResponsiveState} from '../studio-universal/types'

const guide={
 fr:{b2c_product_digital:{label:'Votre découverte, votre choix',steps:['Explorer le produit','Trouver votre version','Préparer votre commande'],intro:'Du détail qui inspire au choix qui vous ressemble.'},b2c_service_family:{label:'Votre famille, votre rythme',steps:['Comprendre l’accompagnement','Composer votre rythme','Préparer votre demande'],intro:'Explorez le cadre, les possibilités et les modalités pour votre famille.'},academy_admission:{label:'Votre prochain chapitre',steps:['Explorer le programme','Choisir votre parcours','Préparer votre inscription'],intro:'Reliez vos ambitions au contenu, au format et à la session qui vous correspondent.'},b2b_institutional:{label:'De l’ambition au projet',steps:['Examiner la solution','Définir votre périmètre','Préparer votre brief'],intro:'Une lecture pensée pour les décideurs : pertinence, organisation et mise en œuvre.'},search:'Rechercher une information',all:'Toutes les informations',none:'Aucun résultat. Essayez un autre terme.',clear:'Effacer',information:'Les détails qui comptent'},
 en:{b2c_product_digital:{label:'Discover it. Make it yours.',steps:['Explore the product','Find your version','Prepare your order'],intro:'Move from inspiring details to a choice that fits you.'},b2c_service_family:{label:'Your family. Your rhythm.',steps:['Understand the care','Shape your rhythm','Prepare your request'],intro:'Explore the approach, possibilities and practical arrangements for your family.'},academy_admission:{label:'Your next chapter',steps:['Explore the programme','Choose your pathway','Prepare your enrolment'],intro:'Connect your ambitions to the content, format and session that suit you.'},b2b_institutional:{label:'From ambition to project',steps:['Examine the solution','Define your scope','Prepare your brief'],intro:'Designed for decision-makers: relevance, organisation and implementation.'},search:'Find an information',all:'All information',none:'No results. Try a different term.',clear:'Clear',information:'The details that matter'},
 ar:{b2c_product_digital:{label:'اكتشفه واجعله يناسبك',steps:['استكشف المنتج','اختر النسخة المناسبة','حضّر طلبك'],intro:'من التفاصيل الملهمة إلى الاختيار الذي يناسبك.'},b2c_service_family:{label:'عائلتك وإيقاع حياتك',steps:['افهم الرعاية','حدّد الإيقاع المناسب','حضّر طلبك'],intro:'استكشف الإطار والإمكانات والترتيبات المناسبة لعائلتك.'},academy_admission:{label:'فصلك القادم',steps:['استكشف البرنامج','اختر مسارك','حضّر تسجيلك'],intro:'اربط طموحاتك بالمحتوى والصيغة والدورة المناسبة لك.'},b2b_institutional:{label:'من الطموح إلى المشروع',steps:['استكشف الحل','حدّد النطاق','حضّر ملخص المشروع'],intro:'تجربة لصنّاع القرار: الملاءمة والتنظيم والتنفيذ.'},search:'ابحث عن معلومة',all:'كل المعلومات',none:'لا توجد نتائج. جرّب عبارة أخرى.',clear:'مسح',information:'التفاصيل المهمة'}
}
const roles=[['story','benefits','contents','curriculum','facts'],['choices','plans','schedule','cohorts','deployment','providers','trainers'],['decision']] as const
/** Navigation follows the published composition; it never manufactures catalogue content. */
export function DiscoveryGuide({sections}:{sections:AtomicSectionProps[]}){
 const x=useExperience();if(!x)return null
 const domain=x.data.classification.masterDomain
 if(!domain||!(domain in guide[x.locale]))return null
 const c=guide[x.locale][domain],visible=sections.filter(s=>sectionVisibility(x.data,s).visible)
 const icons=domain==='b2c_product_digital'?[Package,Layers,Check]:domain==='b2c_service_family'?[Users,CalendarDays,Check]:domain==='academy_admission'?[BookOpen,Layers,Check]:[ShieldCheck,Layers,Check]
 const targets=roles.map(group=>visible.find(s=>(group as readonly string[]).includes(s.role)))
 const links=targets.map((target,i)=>({target,i})).filter(v=>v.target)
 if(!links.length)return null
 return <aside className={styles.discoveryGuide} aria-label={c.label}><div><span className={styles.guideSpark} aria-hidden="true">✦</span><strong>{c.label}</strong><p>{c.intro}</p></div><div className={styles.guideSteps}>{links.map(({target,i})=>{const Icon=icons[i];return <a key={target!.id} href={`#${target!.id}`} {...responsiveDataAttributes(target!.responsive as StudioResponsiveState|undefined)}><span><Icon size={19}/></span><div><small>{String(i+1).padStart(2,'0')}</small><strong>{c.steps[i]}</strong></div><ArrowUpRight size={16}/></a>})}</div></aside>
}

/** Search only the public-visible field projection; the source order remains unchanged. */
export function OfferInformationExplorer(){
 const x=useExperience(),[query,setQuery]=useState('')
 const fields=x?.data.content.fields||[]
 const populated=fields.filter(f=>present(f.value)),needle=query.trim().toLocaleLowerCase(x?.locale)
 if(!x||populated.length<7)return null
 const c=guide[x.locale],filtered=populated.filter(f=>(!needle||`${f.label} ${display(f.value,x.locale)}`.toLocaleLowerCase(x.locale).includes(needle)))
 return <details className={styles.informationExplorer}><summary><Search size={19}/><strong>{c.information}</strong><span>{populated.length}</span></summary><div className={styles.informationControls}><label><Search size={18}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={c.search} aria-label={c.search}/></label>{query?<button type="button" onClick={()=>setQuery('')}>{c.clear}</button>:null}</div><dl className={styles.informationResults}>{filtered.map(f=><div key={f.key}><dt>{f.label}</dt><dd>{display(f.value,x.locale)}</dd></div>)}</dl>{!filtered.length?<p role="status">{c.none}</p>:null}</details>
}
