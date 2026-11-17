"use client";
import {Bookmark,Compass,Grid2X2,Layers3,Package} from "lucide-react";
import styles from "./EquipmentMobileR111.module.css";
const COPY={
 fr:["Explorer","Produits","Univers","Mes idées","Mon projet","Navigation mobile des équipements"],
 en:["Explore","Products","Worlds","Saved ideas","My project","Mobile equipment navigation"],
 ar:["استكشف","المنتجات","المجالات","أفكاري","مشروعي","تنقل التجهيزات على الهاتف"]
} as const;
export function EquipmentMobileR111({
 locale,onExplore,onProducts,onWorlds,onIdeas,onProject,count
}:{locale:"fr"|"en"|"ar";onExplore:()=>void;onProducts:()=>void;onWorlds:()=>void;onIdeas:()=>void;onProject:()=>void;count:number}){
 const l=COPY[locale];
 const links=[
  {icon:Compass,text:l[0],action:onExplore},
  {icon:Package,text:l[1],action:onProducts},
  {icon:Grid2X2,text:l[2],action:onWorlds},
  {icon:Bookmark,text:l[3],action:onIdeas},
  {icon:Layers3,text:l[4],action:onProject}
 ];
 return <nav className={styles.mobile} aria-label={l[5]} dir={locale==="ar"?"rtl":"ltr"}>
  {links.map((link,i)=>{const Icon=link.icon;return <button key={i} type="button" onClick={link.action} aria-label={link.text}>
   <span className={styles.icon}><Icon size={20}/>{i===4&&count>0?<b>{count>99?"99+":count}</b>:null}</span>
   <span>{link.text}</span>
  </button>})}
 </nav>;
}
