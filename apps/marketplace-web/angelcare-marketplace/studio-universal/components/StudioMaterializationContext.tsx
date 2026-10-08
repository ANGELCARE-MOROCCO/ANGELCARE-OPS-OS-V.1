'use client'

import {createContext,useContext,useMemo,type ReactNode} from 'react'
import type {ComponentData,Data} from '@puckeditor/core'

export interface StudioMaterializationState{
  data:Data|null
  report:{sourceCount:number;resolvedCount:number;emptyCount:number;blockerCount:number;blocksTouched:number;entries:Array<{blockId:string;blockType:string;sourceId:string;strategy:string;status:string;count:number;authority:string|null;note:string}>}|null
  loading:boolean
  error:string
  refreshedAt:string|null
}

const EMPTY:StudioMaterializationState={data:null,report:null,loading:false,error:'',refreshedAt:null}
const Context=createContext<StudioMaterializationState>(EMPTY)

const walk=(components:ComponentData[],out:Map<string,Record<string,unknown>>)=>{for(const component of components){const props=(component.props||{}) as Record<string,unknown>,id=typeof props.id==='string'?props.id:'';if(id)out.set(id,props);const nested=Array.isArray(props.content)?props.content as ComponentData[]:[];walk(nested,out)}}

export function StudioMaterializationProvider({state,children}:{state:StudioMaterializationState;children:ReactNode}){return <Context.Provider value={state}>{children}</Context.Provider>}
export function useStudioMaterialization(){return useContext(Context)}
export function useStudioMaterializedProps<T extends Record<string,unknown>>(props:T):T{
 const state=useStudioMaterialization()
 return useMemo(()=>{const id=typeof props.id==='string'?props.id:'';if(!id||!state.data)return props;const map=new Map<string,Record<string,unknown>>();walk(Array.isArray(state.data.content)?state.data.content:[],map);const materialized=map.get(id);if(!materialized)return props;const patch:Record<string,unknown>={};if(Array.isArray(materialized.items))patch.items=materialized.items;if(materialized.__studioResolvedPrimaryAction)patch.__studioResolvedPrimaryAction=materialized.__studioResolvedPrimaryAction;if(materialized.__studioResolvedSecondaryAction)patch.__studioResolvedSecondaryAction=materialized.__studioResolvedSecondaryAction;return{...props,...patch} as T},[props,state.data])
}
