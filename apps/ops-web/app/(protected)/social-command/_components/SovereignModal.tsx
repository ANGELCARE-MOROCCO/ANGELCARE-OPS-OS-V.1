"use client"
import { X } from "lucide-react"
import styles from "./SocialCommand.module.css"

export default function SovereignModal({open,title,kicker,onClose,children,wide=true}:{open:boolean;title:string;kicker?:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){
  if(!open)return null
  return <div className={styles.sovereignBackdrop} role="dialog" aria-modal="true">
    <section className={`${styles.sovereignModal} ${wide?styles.sovereignWide:""}`}>
      <header className={styles.sovereignHeader}>
        <div><span>{kicker||"SOCIAL COMMAND · OPERATING ROOM"}</span><h2>{title}</h2></div>
        <button onClick={onClose} className={styles.sovereignClose}><X size={20}/></button>
      </header>
      <div className={styles.sovereignBody}>{children}</div>
    </section>
  </div>
}
