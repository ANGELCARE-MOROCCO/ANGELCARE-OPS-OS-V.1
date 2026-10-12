'use client'
import {useEffect,useRef} from 'react'
import type {ReactNode} from 'react'
import {X,ArrowUpRight} from 'lucide-react'
import s from '../population.module.css'
export function Dialog({title,kicker,children,onClose,wide=false}:{title:string;kicker:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const d=ref.current;d?.showModal();return()=>{d?.close();previous?.focus()}},[]);return <dialog ref={ref} className={s.dialog} data-wide={wide} onCancel={e=>{e.preventDefault();onClose()}}><header className={s.dialogHead}><div><span>{kicker}</span><h2>{title}</h2></div><button type="button" className={s.iconButton} onClick={onClose} aria-label="Fermer"><X size={21}/></button></header><div className={s.dialogBody}>{children}</div></dialog>}
export function Empty({title,detail,action}:{title:string;detail:string;action?:ReactNode}){return <section className={s.empty}><span className={s.emptyOrbit}><ArrowUpRight size={30}/></span><h3>{title}</h3><p>{detail}</p>{action}</section>}
export function Failure({error,retry}:{error:string;retry:()=>void}){return <div role="alert" className={s.failure}><strong>Lecture interrompue — les données ne sont pas présentées comme vides.</strong><p>{error}</p><button type="button" className={s.secondary} onClick={retry}>Réessayer</button></div>}
