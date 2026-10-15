import {ContactCentre} from './ContactCentre'
import {contactDesks,safeMedia} from './data'
import type {PublicPageExperience} from '../public-universe/types'
import type {Locale} from './content'
export async function ContactEntry({experience,locale}:{experience:PublicPageExperience;locale:Locale}){const channels=await contactDesks(locale);const hero=experience.blocks.find(b=>['hero','split_hero','video_hero'].includes(b.block_type)&&!['hidden','archived'].includes(b.status));const c=hero?.content||{};const text=(v:unknown)=>typeof v==='string'?v:'';const legacy=/La bonne conversation|besoin clairement enregistré|right conversation|clearly recorded|بوضوح/.test(text(c.title));const intro={title:legacy?undefined:text(c.title)||undefined,lead:legacy?undefined:text(c.lead)||undefined,image:safeMedia(c.mediaUrl)||undefined};return <ContactCentre locale={locale} desks={channels.desks} channelsState={channels.state} intro={intro}/>}
