"use client"
import {KidFlixMarketplaceEntry} from '../../kidflix/MarketplaceEntry'

import Image from 'next/image'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { ArrowUp, ChevronDown, ExternalLink, Mail, ShieldCheck, Sparkles, Award, Globe2, Heart } from 'lucide-react'
import styles from '../footer-studio.module.css'
import type { FooterContactDesk, FooterLocale, FooterRuntimeExperience } from '../types'

import { badges, colour, footerWorlds, localText, presentation, quickDestinations, record, resolveOfficialLogo } from '../personalization'

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
  const appearance=presentation(profile),tokens=appearance.tokens
  const footerRef=useRef<HTMLElement>(null),brandId=useId(),intent=useRef(new Set<string>())
  const [footerWidth,setFooterWidth]=useState(1440)
  useEffect(()=>{const el=footerRef.current;if(!el)return;const measure=()=>setFooterWidth(el.clientWidth);measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect()},[])
  const mobile=footerWidth<=680
  const desktopColumns=Math.max(1,Math.min(6,Number(profile.settings.desktop_columns)||4))
  const tabletColumns=Math.max(1,Math.min(6,Number(profile.settings.tablet_columns)||3))
  const columns=footerWidth<=900?Math.min(2,tabletColumns):footerWidth<=1250?tabletColumns:desktopColumns
  const vars={
    '--footer-bg':tokens.background,'--footer-bg-alt':tokens.background_alt,'--footer-surface':tokens.surface,'--footer-surface-alt':tokens.surface_alt,
    '--footer-text':tokens.text,'--footer-muted':tokens.muted,'--footer-accent':tokens.accent,'--footer-accent-alt':tokens.accent_alt,
    '--footer-line':tokens.line,'--footer-glow':tokens.glow,'--footer-authority':tokens.authority,'--footer-radius':`${tokens.radius}px`,'--footer-shadow':tokens.shadow,
  } as CSSProperties
  for(const [key,value] of Object.entries(appearance.n)){
    const unit=key==='brand_share'?'%':['body_line_height','title_weight'].includes(key)?'':'px'
    ;(vars as Record<string,string>)[`--footer-${key.replaceAll('_','-')}`]=`${value}${unit}`
  }
  ;(vars as Record<string,string>)['--footer-columns']=String(desktopColumns)
  ;(vars as Record<string,string>)['--footer-tablet-columns']=String(tabletColumns)
  ;(vars as Record<string,string>)['--footer-small-columns']=String(Math.min(2,tabletColumns))
  if(appearance.choices.shadow==='none')(vars as Record<string,string>)['--footer-shadow']='none'
  if(appearance.choices.shadow==='soft')(vars as Record<string,string>)['--footer-shadow']='0 12px 40px rgba(0,0,0,.12)'
  const brand=profile.brand as Record<string,unknown>
  const badgeIcons={shield:ShieldCheck,sparkles:Sparkles,award:Award,globe:Globe2,heart:Heart}
  const worldLinks=footerWorlds(locale).filter(w=>record(profile.settings.world_links)[w.key]===true)
  const desks=useMemo(()=>new Map(experience.contact_desks.map((desk)=>[desk.desk_key,desk])),[experience.contact_desks])
  const sections=profile.sections.filter((section)=>section.status==='active').sort((a,b)=>a.sort_order-b.sort_order)
  const quick=quickDestinations(locale).filter(item=>record(record(profile.settings.quick_links)[item.key]).visible!==false).map(item=>({...item,label:localText(record(record(profile.settings.quick_links)[item.key]).label,locale,item.label)}))
  const click=(eventType:string,key:string)=>(event:MouseEvent<HTMLElement>)=>{if(preview||experience.preview){event.preventDefault();return}sendEvent(eventType,key,experience)}
  return <footer ref={footerRef} data-footer-personalization="r2" data-alignment={appearance.choices.alignment} data-surface={appearance.choices.surface} data-motion={appearance.choices.motion} data-grid-alignment={appearance.choices.grid_alignment} data-logo-variant={appearance.choices.logo_variant} className={styles.publicFooter} data-layout={profile.theme.layout_key} data-marketplace={marketplace?'true':'false'} dir={locale==='ar'?'rtl':'ltr'} style={vars}>
    <div className={styles.ambient} aria-hidden="true"><span/><span/><span/></div>
    {(preview||experience.preview)?<div className={styles.previewRibbon}><Sparkles size={15}/>{t.preview}<strong>{localized(profile.name,locale)}</strong></div>:null}
    <div className={styles.publicShell}>
      <section className={styles.brandAuthority} aria-labelledby={profile.settings.show_brand_title!==false?brandId:undefined} aria-label={profile.settings.show_brand_title===false?"ANGELCARE":undefined}>
        <Link href={`/angelcare-marketplace/${locale}`} className={styles.whiteLogo} aria-label="ANGELCARE Global Marketplace" onClick={click('link_click','brand-logo')}>
          <Image src={resolveOfficialLogo(profile)} alt="ANGELCARE" width={720} height={240}/>
        </Link>
        <div data-kidflix-marketplace-entry="footer"><KidFlixMarketplaceEntry placement="footer"/></div>
        {profile.settings.show_brand_eyebrow!==false?<span className={styles.brandEyebrow}>{localized(brand.eyebrow,locale,'ANGELCARE GLOBAL MARKETPLACE')}</span>:null}
        <h2 id={brandId} hidden={profile.settings.show_brand_title===false}>{localized(brand.title,locale)}</h2>
        {profile.settings.show_brand_description!==false?<><p>{localized(brand.description,locale)}</p>{localText(brand.description_secondary,locale)?<p className={styles.brandSecondaryCopy}>{localText(brand.description_secondary,locale)}</p>:null}</>:null}
        {profile.settings.show_badges!==false?<div className={styles.trustSignals}>{badges(brand).filter(b=>b.enabled&&localText(b.label,locale)).map(b=>{const Icon=badgeIcons[b.icon as keyof typeof badgeIcons]||ShieldCheck;return <span key={b.id}><Icon size={16}/>{localText(b.label,locale)}</span>})}</div>:null}
        {profile.settings.show_quick_links!==false&&quick.length?<><div className={styles.quickTitle}>{localText(brand.quick_title,locale,t.quick)}</div>
        <nav className={styles.quickLinks} aria-label={t.quick}>{quick.map((item)=><Link href={item.href} key={item.key} onClick={click('link_click',`quick:${item.key}`)}>{item.label}<ExternalLink size={13}/></Link>)}</nav></>:null}
        {worldLinks.length?<><div className={styles.quickTitle}>{localText(brand.worlds_title,locale,{fr:"Explorer nos univers",en:"Explore our worlds",ar:"استكشف عوالمنا"}[locale])}</div><nav className={styles.quickLinks} aria-label={localText(brand.worlds_title,locale,"ANGELCARE")}>{worldLinks.map(w=><Link href={w.href} key={w.key} onClick={click("link_click",`world:${w.key}`)}>{w.label}<ExternalLink size={13}/></Link>)}</nav></>:null}
      </section>
      <section className={styles.directory} aria-label={t.directory}>
        <header className={styles.directoryHeader}><span>{localText(brand.directory_eyebrow,locale,"ANGELCARE SERVICE DIRECTORY")}</span><strong>{localText(brand.directory_title,locale,t.directory)}</strong><small>{sections.length} sections · {experience.contact_desks.filter((desk)=>desk.status==='active').length} desks</small></header>
        <div className={styles.sectionGrid} >
          {sections.map((section,index)=>{
            const sectionDesks=section.contact_desk_keys.map((key)=>desks.get(key)).filter((desk):desk is FooterContactDesk=>Boolean(desk)&&desk?.status==='active')
            return <details className={styles.footerSection} key={section.id} open={!mobile&&appearance.choices.desktop_open==='all'?true:!mobile&&appearance.choices.desktop_open==='closed'?false:section.mobile_default_open} style={{'--section-span':String(Math.min(columns,Math.max(1,Math.min(2,section.column_span||1)))),...(colour(section.settings.accent)?{'--footer-accent':colour(section.settings.accent)}:{})} as CSSProperties} onToggle={(event)=>{const el=event.currentTarget;if(el.open&&mobile&&profile.settings.mobile_accordion==='single')footerRef.current?.querySelectorAll('details[open]').forEach(other=>{if(other!==el)(other as HTMLDetailsElement).open=false});if(el.open&&intent.current.has(section.id)){if(!preview)sendEvent('accordion_open',section.section_key,experience)}intent.current.delete(section.id)}}>
              <summary onClick={()=>intent.current.add(section.id)}><span className={styles.sectionIndex}>{String(index+1).padStart(2,'0')}</span><span className={styles.sectionHeading}><strong>{localized(section.title,locale)}</strong>{section.settings.show_descriptions!==false?<small>{localized(section.description,locale)}</small>:null}</span><ChevronDown className={styles.chevron} aria-hidden="true"/></summary>
              <div className={styles.sectionPanel}>
                {section.links.filter((link)=>link.status==='active').map((link)=><Link key={link.id} href={localeHref(link.href,locale)} target={link.open_new_tab?'_blank':undefined} rel={link.rel.join(' ')||undefined} onClick={click('link_click',link.analytics_key||link.link_key)}>{localized(link.label,locale)}{link.open_new_tab?<ExternalLink size={12}/>:null}</Link>)}
                {sectionDesks.map((desk)=><article className={styles.contactDesk} key={desk.id}><div><strong>{localized(desk.label,locale)}</strong><p>{localized(desk.description,locale)}</p>{desk.response_commitment?<small>{localized(desk.response_commitment,locale)}</small>:null}</div><a href={`mailto:${desk.email}`} onClick={click('email_click',desk.desk_key)}><Mail size={14}/>{desk.email}</a></article>)}
              </div>
            </details>
          })}
        </div>
      </section>
    </div>
    {profile.settings.show_service_bar!==false?<div className={styles.serviceBar}><span><strong>{experience.contact_desks.filter((desk)=>desk.status==='active').length}</strong>{localText(brand.service_desks_label,locale,t.serviceDesks)}</span><span><strong>360°</strong>{localText(brand.service_coverage_label,locale,t.coverage)}</span><span><strong>3</strong>{localText(brand.service_languages_label,locale,t.languages)}</span><nav>{(['fr','en','ar'] as const).map((code)=><Link href={`/angelcare-marketplace/${code}`} data-active={locale===code} key={code} onClick={click('locale_click',code)}>{localeNames[code]}</Link>)}</nav></div>:null}
    <div className={styles.authorityWrap}><a href="#angelcare-marketplace-top" className={styles.authority} onClick={click('authority_click','back-to-top')}><span>{profile.authority_statement}</span><strong aria-hidden="true"><ArrowUp size={17}/></strong></a></div>
  </footer>
}
