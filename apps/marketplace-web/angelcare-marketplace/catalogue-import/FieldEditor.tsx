'use client'
import { useState } from 'react'
import { Plus,Trash2,ChevronDown } from 'lucide-react'
import type { ImportField,ImportProfile,ImportTarget } from './contract'
import { collectionContracts } from './collections'
import { text,type Row } from '../catalogue-population/model'
import s from './import.module.css'
export function FieldEditor({field,value,onChange,profile,target}:{field:ImportField;value:unknown;onChange:(v:unknown)=>void;profile:ImportProfile;target:ImportTarget}){
 const [expert,setExpert]=useState(false),encoded=typeof value==='object'&&value!==null?JSON.stringify(value):String(value??'')
 const structured=['json','time_ranges','component_list'].includes(field.field_type),collection=collectionContracts(profile,target).find(c=>c.field===field.field_key)
 let decoded:unknown=value,invalid=false;if(structured&&typeof value==='string'&&value.trim()){try{decoded=JSON.parse(value)}catch{invalid=true}}
 const array=Array.isArray(decoded)?decoded:[],columns=(collection?.headers||[]).filter(k=>!['item_key','payload_json'].includes(k))
 const visual=structured&&collection?.shape==='array'&&columns.length>1
 return <div className={s.field}><label htmlFor={'field-'+field.field_key}><span>{field.label_fr}</span><small>{field.draftRequired?'Requis pour le brouillon':field.publishRequired?'Avant publication':'Facultatif'}{field.unit?' · '+field.unit:''}</small></label>
 {visual&&!expert&&!invalid?<div className={s.collection}><div className={s.tableScroll}><table><thead><tr>{columns.map(k=><th key={k}>{k}</th>)}<th>Retirer</th></tr></thead><tbody>{array.map((row:Row,index)=><tr key={index}>{columns.map(k=><td key={k}><input aria-label={field.label_fr+' '+k+' '+(index+1)} value={typeof row[k]==='object'?JSON.stringify(row[k]):String(row[k]??'')} onChange={e=>{const next=array.map((v:Row,i:number)=>i===index?{...v,[k]:['quantity','sort_order','price_delta','price_override','capacity_limit','minimum_price','standard_price','maximum_price'].includes(k)&&e.target.value.trim()&&Number.isFinite(Number(e.target.value))?Number(e.target.value):k==='available'&&['true','false'].includes(e.target.value)?e.target.value==='true':e.target.value}:v);onChange(next)}}/></td>)}<td><button type="button" className={s.icon} aria-label={'Retirer l’entrée '+(index+1)} onClick={()=>onChange(array.filter((_:unknown,i:number)=>i!==index))}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div><button type="button" className={s.secondary} onClick={()=>onChange([...array,{}])}><Plus size={14}/> Ajouter une entrée</button></div>
 :field.field_type==='boolean'?<select id={'field-'+field.field_key} value={encoded} onChange={e=>onChange(e.target.value)}><option value="">Conserver / non renseigné</option><option value="true">Oui</option><option value="false">Non</option></select>
 :field.allowed_values.length&&field.field_type==='select'?<select id={'field-'+field.field_key} value={encoded} onChange={e=>onChange(e.target.value)}><option value="">Conserver / non renseigné</option>{field.allowed_values.map(v=><option key={v}>{v}</option>)}</select>
 :field.allowed_values.length&&['multiselect','list'].includes(field.field_type)?<fieldset className={s.checks}><legend className={s.srOnly}>{field.label_fr}</legend>{field.allowed_values.map(v=>{const list=Array.isArray(value)?value:String(value||'').split('|');return <label key={v}><input type="checkbox" checked={list.includes(v)} onChange={e=>onChange(e.target.checked?[...list.filter(Boolean),v]:list.filter(k=>k!==v))}/>{v}</label>})}</fieldset>
 :['richtext','textarea','json','component_list','time_ranges'].includes(field.field_type)?<textarea id={'field-'+field.field_key} rows={structured?4:5} dir={field.field_key.endsWith('_ar')?'rtl':undefined} value={encoded} onChange={e=>onChange(e.target.value)}/>
 :<input id={'field-'+field.field_key} type={field.field_type==='date'?'date':field.field_type==='time'?'time':'text'} inputMode={['money','integer','number'].includes(field.field_type)?'decimal':undefined} dir={field.field_key.endsWith('_ar')?'rtl':undefined} value={encoded} onChange={e=>onChange(e.target.value)}/>}
 {visual?<button type="button" className={s.textButton} onClick={()=>setExpert(v=>!v)}><ChevronDown size={13}/>{expert?'Revenir à l’éditeur de collection':'JSON avancé'}{invalid?' · JSON à corriger':''}</button>:null}
 <code>{field.field_key}</code><p>{field.help_fr||'Champ natif du profil.'}</p><small>Destination : {field.destination}{field.conditional_rule&&Object.keys(field.conditional_rule).length?' · Condition : '+JSON.stringify(field.conditional_rule):''}</small>
 </div>
}
