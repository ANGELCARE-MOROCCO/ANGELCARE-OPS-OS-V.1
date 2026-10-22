'use client';
import { useState,type FormEvent,type ReactNode } from 'react';
import type { Locale } from '../contracts';
import { h } from '../hiring-copy';
import s from '../jobkix.module.css';
/** Native GET navigation; the server separately rechecks count, unique IDs and every object's RLS. */
export function ComparisonForm({locale,action,children}:{locale:Locale;action:string;children:ReactNode}){
 const [invalid,setInvalid]=useState(false);
 function submit(event:FormEvent<HTMLFormElement>){const ids=new FormData(event.currentTarget).getAll('compare');if(ids.length>3){event.preventDefault();setInvalid(true);}else setInvalid(false);}
 return <form action={action} method="get" onSubmit={submit}>{children}{invalid?<p className={s.notice} role="alert">{h(locale,'compareHelp')}</p>:null}</form>;
}
