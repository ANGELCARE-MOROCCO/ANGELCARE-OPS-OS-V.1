'use client'
import { useEffect, useState } from 'react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type { BrandRuntime } from '@/types/angelcare360/operator/branding'
import styles from './CustomerTenantIdentity.module.css'
export default function CustomerTenantIdentity(){const [runtime,setRuntime]=useState<BrandRuntime|null>(null);useEffect(()=>{let active=true;fetch('/api/angelcare360/branding/current',{cache:'no-store'}).then(async r=>{const b=await r.json();if(active&&r.ok&&b.ok)setRuntime(b.runtime)}).catch(()=>null);return()=>{active=false}},[]);const logo=runtime?.logoUrl||'';const customer=Boolean(logo)&&runtime?.resolvedMode!=='angelcare_only';return <div className={styles.identity}>{customer?<div className={styles.customerLogo}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={logo} alt={`Logo ${runtime?.brandName||'établissement'}`}/></div>:<AngelCareLogo size="sm" priority/>}<div className={styles.copy}><strong>{runtime?.portalTitle||runtime?.brandName||'ANGELCARE 360'}</strong><span>{customer?'Espace institutionnel sécurisé':'SANILA OS · Customer Command Center'}</span></div></div>}
