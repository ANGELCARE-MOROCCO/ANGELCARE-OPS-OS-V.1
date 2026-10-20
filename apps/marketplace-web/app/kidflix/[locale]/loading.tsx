"use client";
import {useParams}from "next/navigation";
import {isLocale,tr}from "@/angelcare-marketplace/kidflix/catalogue";
import s from "@/angelcare-marketplace/kidflix/kidflix.module.css";
export default function Loading(){const p=useParams(),l=typeof p.locale==="string"&&isLocale(p.locale)?p.locale:"en";return <div className={s.routeFeedback} role="status" lang={l} dir={l==="ar"?"rtl":"ltr"}><strong>KidFlix</strong><span className={s.loadingRing} aria-hidden="true"/><p>{tr(["A new world of discovery is opening…","Un nouvel univers de découvertes s’ouvre…","نفتح عالماً جديداً من الاكتشافات…"],l)}</p></div>;}
