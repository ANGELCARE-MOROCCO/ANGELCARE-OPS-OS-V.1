"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { Archive, BrainCircuit, FileCheck2, FolderTree, Gauge, Radar, RadioTower, Route, Scale, ScanSearch, Sparkles, Target } from "lucide-react"

export type ContentCommandRoute = { key:string; href:string; label:string; description:string; icon:React.ReactNode; disabled?:boolean; exact?:boolean }

export const contentCommandRoutes: readonly ContentCommandRoute[] = [
  { key:"command", href:"/market-os/content-command-center", label:"Commandement 360", description:"Signaux, anticipation et opérations", icon:<Gauge className="h-4 w-4"/>, exact:true },
  { key:"signals", href:"/market-os/content-command-center/signals", label:"Observatoire", description:"Tendances, preuves et opportunités", icon:<Radar className="h-4 w-4"/> },
  { key:"strategies", href:"/market-os/content-command-center/strategies", label:"Fabrique stratégique", description:"Stratégies et plans d’action", icon:<Target className="h-4 w-4"/> },
  { key:"missions", href:"/market-os/content-command-center/missions", label:"Missions", description:"Assignations, tâches et preuves", icon:<Route className="h-4 w-4"/> },
  { key:"directory", href:"/market-os/content-command-center/directory", label:"Content Atlas", description:"Répertoire méga-classifié", icon:<FolderTree className="h-4 w-4"/> },
  { key:"studio", href:"/market-os/content-command-center/studio", label:"Studios création", description:"Digital, Print et Corporate", icon:<Sparkles className="h-4 w-4"/> },
  { key:"evidence", href:"/market-os/content-command-center/evidence", label:"Evidence Lab", description:"Progression et analyse visuelle AI", icon:<ScanSearch className="h-4 w-4"/> },
  { key:"validation", href:"/market-os/content-command-center/validation", label:"Validation", description:"AI, humain, source et autorité", icon:<Scale className="h-4 w-4"/> },
  { key:"source-vault", href:"/market-os/content-command-center/source-vault", label:"Source Vault", description:"Original unique sur Windows Bridge", icon:<FileCheck2 className="h-4 w-4"/> },
  { key:"distribution", href:"/market-os/content-command-center/distribution", label:"Tour diffusion", description:"Packages, planning et preuves", icon:<RadioTower className="h-4 w-4"/> },
  { key:"ai-foundry", href:"/market-os/content-command-center/ai-foundry", label:"AI Director Foundry", description:"Directeurs, skills, commands et scans", icon:<BrainCircuit className="h-4 w-4"/> },
  { key:"legacy", href:"/market-os/content-command-center/legacy-operations", label:"Opérations existantes", description:"Briefs, tasks, assets et legacy cockpit", icon:<Archive className="h-4 w-4"/> },
] as const

function routeIsActive(pathname:string, route:ContentCommandRoute){
  if(route.disabled) return false
  if(route.exact) return pathname===route.href
  return pathname===route.href || pathname.startsWith(`${route.href}/`)
}

export function ContentCommandNavigation(){
 const pathname=usePathname()
 return <nav className="cc360-workspace-nav" aria-label="Navigation ANGELCARE Content Command Headquarters"><div className="cc360-workspace-nav-scroll">{contentCommandRoutes.map((route)=>{const active=routeIsActive(pathname,route);return <Link key={route.key} href={route.href} className={`cc360-workspace-nav-link${active?" is-active":""}`} aria-current={active?"page":undefined} title={route.description}><span className="cc360-workspace-nav-icon" aria-hidden="true">{route.icon}</span><span className="cc360-workspace-nav-copy"><strong>{route.label}</strong><small>{route.description}</small></span></Link>})}</div></nav>
}
