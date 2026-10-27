'use client';
import {useState} from 'react';
import s from '../vacancy-pm7.module.css';
export function VacancySectorImage({setting,description}:{setting:string;description:string}){
 const preschool=['nurseries','preschool','primary-schools','international-schools'].includes(setting);
 const src=preschool?'/jobkix/vacancy-pm7/early-years-editorial.jpg':setting?`/jobkix/editorial/setting-${encodeURIComponent(setting)}.webp`:'';
 const [failed,setFailed]=useState(false);
 return <div className={s.editorialPhoto}>
  {src&&!failed?<img src={src} alt={description} width={850} height={630} loading="eager" onError={()=>setFailed(true)}/>:<div className={s.imageFallback} aria-label={description}><span>JOBKIX</span></div>}
  <div className={s.photoShade}/><div className={s.photoCaption}><span>JOBKIX / SECTOR EDITORIAL</span><small>{description}</small></div>
 </div>;
}
