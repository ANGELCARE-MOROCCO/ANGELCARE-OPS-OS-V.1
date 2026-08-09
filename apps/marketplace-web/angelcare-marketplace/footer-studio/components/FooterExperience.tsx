"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { ArrowUp, ChevronDown, ExternalLink, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import styles from '../footer-studio.module.css'
import type { FooterContactDesk, FooterLocale, FooterRuntimeExperience } from '../types'

type Props = { experience: FooterRuntimeExperience; marketplace?: boolean; preview?: boolean }
const localeNames={fr:'FR',en:'EN',ar:'AR'} as const
const copy={
  fr:{directory:'Répertoire opérationnel ANGELCARE',quick:'Accès essentiels',serviceDesks:'cellules professionnelles',coverage:'Familles · B2B · Partenaires',languages:'langues de service',preview:'Prévisualisation gouvernée',explore:'Explorer le Marketplace',trust:'Trust & Quality',support:'Support',professionals:'Professionnels',account:'Mon ANGELCARE'},
  en:{directory:'ANGELCARE operational directory',quick:'Essential access',serviceDesks:'professional service desks',coverage:'Families · B2B · Partners',languages:'service languages',preview:'Governed preview',explore:'Explore Marketplace',trust:'Trust & Quality',support:'Support',professionals:'Professionals',account:'My ANGELCARE'},
  ar:{directory:'دليل فرق أنجل كير التشغيلية',quick:'الوصول الأساسي',serviceDesks:'خلايا مهنية',coverage:'الأسر · الأعمال · الشركاء',languages:'لغات الخدمة',preview:'معاينة محكومة',explore:'استكشف السوق',trust:'الثقة والجودة',support:'الدعم',professionals:'المهنيون',account:'حسابي في أنجل كير'},
} as const

function localized(value:unknown, locale:FooterLocale, fallback=''):string{
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    const record=value as Record<string,unknown>
    return String(record[locale]||record.fr||record.en||fallback)
  }
  return String(value||fallback)
}
function localeHref(href:string,locale:FooterLocale){return href.replace(/^\/angelcare-marketplace\/(fr|en|ar)(?=\/|$)/,`/angelcare-marketplace/${locale}`)}
function sendEvent(eventType:string, actionKey:string, experience:FooterRuntimeExperience){
  if(experience.preview||typeof window==='undefined') return
  const body=JSON.stringify({eventType,actionKey,profileId:experience.profile.id,locale:experience.locale,pathname:window.location.pathname,deviceClass:window.innerWidth<720?'mobile':window.innerWidth<1100?'tablet':'desktop'})
  const url='/api/angelcare-marketplace/public/footer/events'
  if(navigator.sendBeacon){navigator.sendBeacon(url,new Blob([body],{type:'application/json'}));return}
  void fetch(url,{method:'POST',headers:{'content-type':'application/json'},body,keepalive:true}).catch(()=>undefined)
}

export function FooterExperience({experience,marketplace=true,preview=false}:Props){
  const {profile,locale}=experience
  const t=copy[locale]
  const tokens=profile.theme.tokens
  const vars={
    '--footer-bg':tokens.background,'--footer-bg-alt':tokens.background_alt,'--footer-surface':tokens.surface,'--footer-surface-alt':tokens.surface_alt,
    '--footer-text':tokens.text,'--footer-muted':tokens.muted,'--footer-accent':tokens.accent,'--footer-accent-alt':tokens.accent_alt,
    '--footer-line':tokens.line,'--footer-glow':tokens.glow,'--footer-authority':tokens.authority,'--footer-radius':`${tokens.radius}px`,'--footer-shadow':tokens.shadow,
  } as CSSProperties
  const brand=profile.brand as Record<string,unknown>
  const desks=useMemo(()=>new Map(experience.contact_desks.map((desk)=>[desk.desk_key,desk])),[experience.contact_desks])
  const sections=profile.sections.filter((section)=>section.status==='active').sort((a,b)=>a.sort_order-b.sort_order)
  const quick=[
    {label:t.explore,href:`/angelcare-marketplace/${locale}/marketplace`,key:'marketplace'},
    {label:t.trust,href:`/angelcare-marketplace/${locale}/trust`,key:'trust'},
    {label:t.support,href:`/angelcare-marketplace/${locale}/contact`,key:'support'},
    {label:t.professionals,href:'/angelcare-marketplace/provider',key:'professionals'},
    {label:t.account,href:`/angelcare-marketplace/${locale}/account`,key:'account'},
  ]
  const click=(eventType:string,key:string)=>(event:MouseEvent<HTMLElement>)=>{if(preview)event.preventDefault();sendEvent(eventType,key,experience)}
  return <footer className={styles.publicFooter} data-layout={profile.theme.layout_key} data-marketplace={marketplace?'true':'false'} dir={locale==='ar'?'rtl':'ltr'} style={vars}>
    <div className={styles.ambient} aria-hidden="true"><span/><span/><span/></div>
    {(preview||experience.preview)?<div className={styles.previewRibbon}><Sparkles size={15}/>{t.preview}<strong>{localized(profile.name,locale)}</strong></div>:null}
    <div className={styles.publicShell}>
      <section className={styles.brandAuthority} aria-labelledby="footer-brand-title">
        <Link href={`/angelcare-marketplace/${locale}`} className={styles.whiteLogo} aria-label="ANGELCARE Global Marketplace" onClick={click('link_click','brand-logo')}>
          <Image src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="ANGELCARE" width={722} height={198}/>
        </Link>
        <span className={styles.brandEyebrow}>{localized(brand.eyebrow,locale,'ANGELCARE GLOBAL MARKETPLACE')}</span>
        <h2 id="footer-brand-title">{localized(brand.title,locale)}</h2>
        <p>{localized(brand.description,locale)}</p>
        <div className={styles.trustSignals}><span><ShieldCheck size={16}/>Commerce gouverné</span><span>Build 360</span><span>FR · EN · AR</span></div>
        <div className={styles.quickTitle}>{t.quick}</div>
        <nav className={styles.quickLinks} aria-label={t.quick}>{quick.map((item)=><Link href={item.href} key={item.key} onClick={click('link_click',`quick:${item.key}`)}>{item.label}<ExternalLink size={13}/></Link>)}</nav>
      </section>
      <section className={styles.directory} aria-label={t.directory}>
        <header className={styles.directoryHeader}><span>ANGELCARE SERVICE DIRECTORY</span><strong>{t.directory}</strong><small>{sections.length} sections · {experience.contact_desks.filter((desk)=>desk.status==='active').length} desks</small></header>
        <div className={styles.sectionGrid} style={{'--footer-columns':String(Number(profile.settings.desktop_columns||4))} as CSSProperties}>
          {sections.map((section,index)=>{
            const sectionDesks=section.contact_desk_keys.map((key)=>desks.get(key)).filter((desk):desk is FooterContactDesk=>Boolean(desk)&&desk?.status==='active')
            return <details className={styles.footerSection} key={section.id} open={preview||section.mobile_default_open} style={{'--section-span':String(section.column_span||1)} as CSSProperties} onToggle={(event)=>{if((event.currentTarget as HTMLDetailsElement).open)sendEvent('accordion_open',section.section_key,experience)}}>
              <summary><span className={styles.sectionIndex}>{String(index+1).padStart(2,'0')}</span><span className={styles.sectionHeading}><strong>{localized(section.title,locale)}</strong><small>{localized(section.description,locale)}</small></span><ChevronDown className={styles.chevron} aria-hidden="true"/></summary>
              <div className={styles.sectionPanel}>
                {section.links.filter((link)=>link.status==='active').map((link)=><Link key={link.id} href={localeHref(link.href,locale)} target={link.open_new_tab?'_blank':undefined} rel={link.rel.join(' ')||undefined} onClick={click('link_click',link.analytics_key||link.link_key)}>{localized(link.label,locale)}{link.open_new_tab?<ExternalLink size={12}/>:null}</Link>)}
                {sectionDesks.map((desk)=><article className={styles.contactDesk} key={desk.id}><div><strong>{localized(desk.label,locale)}</strong><p>{localized(desk.description,locale)}</p>{desk.response_commitment?<small>{localized(desk.response_commitment,locale)}</small>:null}</div><a href={`mailto:${desk.email}`} onClick={click('email_click',desk.desk_key)}><Mail size={14}/>{desk.email}</a></article>)}
              </div>
            </details>
          })}
        </div>
      </section>
    </div>
    {profile.settings.show_service_bar!==false?<div className={styles.serviceBar}><span><strong>{experience.contact_desks.filter((desk)=>desk.status==='active').length}</strong>{t.serviceDesks}</span><span><strong>360°</strong>{t.coverage}</span><span><strong>3</strong>{t.languages}</span><nav>{(['fr','en','ar'] as const).map((code)=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code} onClick={click('locale_click',code)}>{localeNames[code]}</Link>)}</nav></div>:null}
    <div className={styles.authorityWrap}><a href="#angelcare-marketplace-top" className={styles.authority} onClick={click('authority_click','back-to-top')}><span>{profile.authority_statement}</span><strong aria-hidden="true"><ArrowUp size={17}/></strong></a></div>
  </footer>
}
