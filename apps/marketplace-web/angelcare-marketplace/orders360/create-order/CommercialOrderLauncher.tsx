"use client";
import {useState} from "react";
import {ShoppingCart} from "lucide-react";
import type {AssistedOrderOptions} from "../../total-commerce-control/types";
import {CommercialOrderStudio} from "./CommercialOrderStudio";
import styles from "../../customer-commerce/customer-commerce.module.css";

/** Orders 360 only. Shared legacy AssistedOrderComposer remains untouched. */
export function CommercialOrderLauncher({options,onCreated,initialQuery}:{
 options:AssistedOrderOptions;
 onCreated?:()=>void;
 initialQuery?:Record<string,string|undefined>;
}){
 const [open,setOpen]=useState(Boolean(initialQuery?.customer||initialQuery?.inquiry||
  initialQuery?.guestName||initialQuery?.familyRequest));
 return <>
  <button className={styles.primaryButton} type="button" onClick={()=>setOpen(true)}>
   <ShoppingCart size={16}/> Créer une commande
  </button>
  {open?<CommercialOrderStudio options={options} onCreated={onCreated}
   initialQuery={initialQuery} onClose={()=>setOpen(false)}/>:null}
 </>;
}
