'use client'
import { useState } from 'react'
import { CustomerMegaDossierOverlay } from './CustomerMegaDossier'
import styles from '../enterprise-command.module.css'
export function CustomerCommandPage({customerId}:{customerId:string}){const[open,setOpen]=useState(true);return <div className={styles.command}><div className={styles.hero}><div className={styles.eyebrow}>Customer Enterprise Command</div><h1 className={styles.title}>Mega Dossier Client 360</h1><p className={styles.lead}>Une seule surface pour comprendre, opérer, documenter et développer la relation client.</p>{!open?<button className={styles.button} onClick={()=>setOpen(true)}>Ouvrir le Mega Dossier</button>:null}</div>{open?<CustomerMegaDossierOverlay customerId={customerId} onClose={()=>setOpen(false)}/>:null}</div>}
