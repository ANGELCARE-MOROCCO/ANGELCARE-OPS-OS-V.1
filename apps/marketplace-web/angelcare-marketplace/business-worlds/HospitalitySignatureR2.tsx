"use client";
import type {ReactNode} from "react";
import {ArrowUpRight,CheckCircle2,Sparkles} from "lucide-react";
import {ManagedImage} from "../marketplace-imagery/ManagedImage";
import {storefrontPhoto} from "../storefront-immersive/editorial-media";
import {useWorld} from "./Shared";
import {H,ht,type HWord} from "./hospitality-r2-content";
import {HospitalityExecutiveR3} from "./HospitalityExecutiveR3";
import s from "./hospitality-r2.module.css";

const image=(key:string)=>storefrontPhoto("hospitality",key);
function Art({name,slot,priority=false}:{name:string;slot:string;priority?:boolean}){
 return <div className={s.art} data-hospitality-image={slot}>
   <ManagedImage slot={"hospitality-r2."+slot} src={image(name)} alt="" loading={priority?"eager":"lazy"} decoding="async"/>
 </div>;
}
function Action({href,children,light=false}:{href:string;children:ReactNode;light?:boolean}){return <a className={light?s.actionLight:s.action} href={href}>{children}<ArrowUpRight size={16}/></a>;}
export function HospitalitySignatureR2({mode="native"}:{mode?:"native"|"published"}){
 const {locale}=useWorld();
 const tr=(v:HWord)=>ht(v,locale);
 return <div className={s.world} data-hospitality-signature="R3" data-hospitality-mode={mode} dir={locale==="ar"?"rtl":"ltr"}>
  {mode==="native"?<>
   <section className={s.hero} id="hospitality-opening" data-hospitality-chapter="01">
    <Art name="hospitality" slot="hero.main" priority/>
    <div className={s.heroOverlay}/>
    <div className={s.heroContent}>
     <span className={s.heroEyebrow}><Sparkles size={16}/>{tr(H.eyebrow)}</span>
     <h1>{tr(H.heroTitle)}</h1><p>{tr(H.heroLead)}</p>
     <div className={s.heroActions}><Action href="#world-enquiry">{tr(H.cta)}</Action><Action href="#world-discover" light>{tr(H.explore)}</Action></div>
     <div className={s.heroTrust}>{H.assurance.map((v,i)=><span key={i}><CheckCircle2 size={16}/>{tr(v)}</span>)}</div>
    </div>
    <div className={s.heroScenes}><div><Art name="games" slot="hero.inset.kids"/><strong>Kids Club</strong></div><div><Art name="family" slot="hero.inset.family"/><strong>Family Stay</strong></div></div>
    <div className={s.heroBand}>ANGELCARE <span>HOTELS & RESORTS</span> <span>{tr(H.presentation)}</span></div>
   </section>
  </>:null}
  <HospitalityExecutiveR3 mode={mode}/>
 </div>;
}
