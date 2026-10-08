'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import styles from './DemoExperienceContextBar.module.css'

export default function DemoExperienceContextBar() {
  const pathname = usePathname() || '/angelcare-360-command-center'
  const onHome = pathname === '/angelcare-360-command-center'
  return (
    <div className={styles.bar} data-sanila-demo-experience-context="true">
      <div><Sparkles size={13}/><span>SANILA Experience</span><i/> <small>École de démonstration</small></div>
      {!onHome ? <Link href="/angelcare-360-command-center"><ArrowLeft size={13}/>Retour au centre de découverte</Link> : <a href="#univers"><Compass size={13}/>Explorer les univers</a>}
    </div>
  )
}
