 'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {useParams} from 'next/navigation'
import {localeFor} from './navigation-contract'
import { CareOrbitCard } from './CareOrbitCard'
import { navigationController, navigationSnapshot, serverSnapshot, subscribeNavigation } from './client-controller'
import styles from './care-orbit.module.css'
export function CareOrbitFallbackSignal() {
  useEffect(() => {const controller = navigationController(), release = controller?.hold(location.href); if (!navigator.onLine) controller?.connection(false); return release}, [])
  return null
}
export function CareOrbitRouteLoading() {
  const state = useSyncExternalStore(subscribeNavigation, navigationSnapshot, serverSnapshot)
  const [mounted, setMounted] = useState(false), params = useParams<{locale?: string}>()
  useEffect(() => {setMounted(true)}, [])
  return <><CareOrbitFallbackSignal/><div className={styles.scaffold} aria-hidden="true"><div/><div/><div/><div/></div>{!mounted ? <div className={styles.stage}><CareOrbitCard locale={params.locale ? localeFor('/angelcare-marketplace/'+params.locale) : state.locale}/></div> : null}</>
}
