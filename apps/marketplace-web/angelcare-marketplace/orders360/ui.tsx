'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { AlertTriangle, ChevronRight, Database, X } from 'lucide-react'
import css from './orders360.module.css'
export function Badge({children,tone='blue'}:{children:ReactNode;tone?:string}) { return <span className={css.badge} data-tone={tone}>{children}</span> }
export function Button({children,onClick,disabled=false,primary=false,title}:{children:ReactNode;onClick?:()=>void;disabled?:boolean;primary?:boolean;title?:string}) { return <button type="button" className={primary?css.primary:css.button} disabled={disabled} onClick={onClick} title={title}>{children}</button> }
export function Panel({title,subtitle,action,children,tone}:{title:ReactNode;subtitle?:string;action?:ReactNode;children:ReactNode;tone?:string}) { return <section className={css.panel}><header className={css.panelHead} data-tone={tone}><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action&&<div className={css.actions}>{action}</div>}</header>{children}</section> }
export function Empty({title='Aucun dossier dans cette vue',detail='Modifiez les filtres ou créez une commande depuis le catalogue.'}:{title?:string;detail?:string}) { return <div className={css.empty}><Database size={25}/><strong>{title}</strong><p>{detail}</p></div> }
export function ErrorBox({message,retry}:{message:string;retry?:()=>void}) { return <div className={css.error} role="alert"><AlertTriangle size={17}/><span>{message}</span>{retry&&<Button onClick={retry}>Réessayer</Button>}</div> }
export function Stat({label,value,detail,tone='blue',icon}:{label:string;value:ReactNode;detail:ReactNode;tone?:string;icon:ReactNode}) { return <div className={css.stat} data-tone={tone}><div><span>{icon}</span><div><strong>{value}</strong><b>{label}</b></div><ChevronRight size={17}/></div><small>{detail}</small></div> }
export function Modal({title,children,onClose,busy=false,wide=false}:{title:string;children:ReactNode;onClose:()=>void;busy?:boolean;wide?:boolean}) {
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close()},[])
 return <dialog className={css.modal} ref={ref} data-wide={wide} aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)onClose()}} onClick={e=>{if(e.target===ref.current&&!busy)onClose()}}><header><div><small>ORDERS 360 · CONTRÔLE CONTEXTUEL</small><h2>{title}</h2></div><button type="button" onClick={onClose} disabled={busy} aria-label="Fermer"><X size={20}/></button></header><div className={css.modalBody}>{children}</div></dialog>
}
