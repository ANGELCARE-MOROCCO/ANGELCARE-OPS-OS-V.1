'use client'
import {createContext,useContext} from 'react'
import type {PublicExperience360} from '../public-experience-authority/types'
import type {AtomicLocale} from './model'
export type ExperienceContext = { data:PublicExperience360;locale:AtomicLocale;selection:Record<string,unknown>;setChoice:(key:string,value:unknown)=>void;quantity:number;setQuantity:(value:number)=>void;busy:boolean;message:string;act:(mode?:'checkout')=>Promise<void>;basketId:string|null;previewOnly:boolean }
export const Context=createContext<ExperienceContext|null>(null)
export const useExperience=()=>useContext(Context)
