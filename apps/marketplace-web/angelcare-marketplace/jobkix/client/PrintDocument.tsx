'use client';
import type { Locale } from '../contracts';
import { e } from '../experience-copy';
import s from '../jobkix.module.css';
export function PrintDocument({locale}:{locale:Locale}){return <button className={`${s.button} ${s.secondary}`} onClick={()=>window.print()}>{e(locale,'print')}</button>;}
