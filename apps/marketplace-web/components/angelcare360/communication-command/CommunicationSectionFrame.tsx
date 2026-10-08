import type { ReactNode } from 'react'
import Link from 'next/link'
import { MessageSquareText, RadioTower, Megaphone, Send, UsersRound, PanelsTopLeft, ShieldAlert, Route, SlidersHorizontal, History } from 'lucide-react'
import styles from './CommunicationCommand.module.css'

const links=[
 ['/angelcare-360-command-center/messagerie','Atrium',RadioTower],
 ['/angelcare-360-command-center/messagerie/conversations','Conversations',MessageSquareText],
 ['/angelcare-360-command-center/messagerie/annonces','Annonces',Megaphone],
 ['/angelcare-360-command-center/messagerie/campagnes','Campagnes',Send],
 ['/angelcare-360-command-center/messagerie/audiences','Audiences',UsersRound],
 ['/angelcare-360-command-center/messagerie/modeles','Modèles',PanelsTopLeft],
 ['/angelcare-360-command-center/messagerie/surveillance','Surveillance',ShieldAlert],
 ['/angelcare-360-command-center/messagerie/livraison','Livraison',Route],
 ['/angelcare-360-command-center/messagerie/preferences','Préférences',SlidersHorizontal],
 ['/angelcare-360-command-center/messagerie/audit','Audit',History],
] as const
export default function CommunicationSectionFrame({active,title,description,actions,children}:{active:string;title:string;description:string;actions?:ReactNode;children:ReactNode}){return <div className={styles.page}><nav className={styles.nav}>{links.map(([href,label,Icon])=><Link key={href} href={href} className={styles.navLink} data-active={active===href?'true':'false'}><Icon/>{label}</Link>)}</nav><main className={styles.sectionPage}><header className={styles.sectionHero}><div><p className={styles.eyebrow}>SANILA · Communication Command</p><h1>{title}</h1><p>{description}</p></div>{actions?<div className={styles.actions}>{actions}</div>:null}</header>{children}</main></div>}
