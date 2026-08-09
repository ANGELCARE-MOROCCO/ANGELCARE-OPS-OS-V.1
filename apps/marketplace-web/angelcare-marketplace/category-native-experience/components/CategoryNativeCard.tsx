import Link from 'next/link'
import { ArrowUpRight, CalendarDays, GraduationCap, MapPin, Package, Sparkles } from 'lucide-react'
import type { DiscoveryItem } from '../../catalog-discovery/types'
import type { CatalogLocale } from '../../catalog-discovery/types'
import styles from '../experience.module.css'
export function CategoryNativeCard({item,locale,schemaKey}:{item:DiscoveryItem;locale:CatalogLocale;schemaKey?:string}){const Icon=item.kind==='training'?GraduationCap:item.kind==='product'||item.kind==='kit'?Package:item.kind==='service'?CalendarDays:Sparkles;return <Link className={styles.recommendationCard} href={`/angelcare-marketplace/${locale}/marketplace/item/${item.slug}`}><div>{item.media_url?<img src={item.media_url} alt={item.name}/>:<div className={styles.recommendationFallback}><Icon size={30}/></div>}</div><div><span>{schemaKey||item.category_title||item.kind}</span><h3>{item.name}</h3><strong>{item.price_amount===null?'Sur devis':`${item.price_amount} ${item.currency_label}`}</strong><ArrowUpRight size={15}/>{item.territory_id?<MapPin size={13}/>:null}</div></Link>}
