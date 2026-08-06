import { CATEGORY_NATIVE_EXPERIENCE_DESIGN } from '../registry'
import { categoryNativeCopy } from '../content'
import type { AdaptiveExperienceData } from '../types'
import { CategoryNativeCard } from './CategoryNativeCard'
import { ExperienceConfigurator } from './ExperienceConfigurator'
import { ExperienceFamilySections } from './ExperienceFamilySections'
import { ExperienceFieldMatrix } from './ExperienceFieldMatrix'
import { ExperienceHero } from './ExperienceHero'
import { ExperienceTrustPanel } from './ExperienceTrustPanel'
import styles from '../experience.module.css'
import { WalletBenefitTeaser } from '../../customer-commerce/components/WalletBenefitTeaser'
export function AdaptiveExperience({data,focusConfigurator=false}:{data:AdaptiveExperienceData;focusConfigurator?:boolean}){const design=CATEGORY_NATIVE_EXPERIENCE_DESIGN[data.definition.family];const copy=categoryNativeCopy(data.locale);return <main className={styles.experience} dir={data.locale==='ar'?'rtl':'ltr'} data-theme={design.theme} data-family={data.definition.family}>
  <ExperienceHero data={data}/>
  <nav className={styles.anchorNav}><div><a href="#details">{copy.details}</a><a href="#journey">{copy.guidance}</a><a href="#configure">{copy.configuration}</a><a href="#trust">{copy.trust}</a></div></nav>
  <div className={styles.content}>
    <section id="details"><header className={styles.sectionHeader}><span>{design.eyebrowFr}</span><h2>{data.locale==='fr'?'Les informations qui comptent vraiment':data.locale==='ar'?'المعلومات المهمة فعلاً':'The information that truly matters'}</h2><p>{data.schema.description_fr}</p></header><ExperienceFieldMatrix values={data.fieldValues}/></section>
    <ExperienceFamilySections data={data}/>
    <ExperienceTrustPanel data={data}/>
  </div>
  <section className={styles.configuratorSection} id="configure" data-focus={focusConfigurator}><header className={styles.configuratorHeader}><div><span>SELF-SERVICE CONFIGURATION</span><h2>{design.titleFr}</h2><p>{data.locale==='fr'?'Renseignez les informations utiles une seule fois. Elles seront validées, revérifiées puis transmises à l’autorité opérationnelle correcte.':data.locale==='ar'?'أدخل المعلومات المفيدة مرة واحدة. سيتم التحقق منها ثم نقلها إلى السلطة التشغيلية المناسبة.':'Enter useful information once. It will be validated, revalidated and handed to the correct operational authority.'}</p></div></header><ExperienceConfigurator data={data}/></section>
  {data.recommendations.length?<section className={styles.recommendations}><header className={styles.sectionHeader}><span>CONNECTED DISCOVERY</span><h2>{copy.recommendations}</h2></header><div className={styles.recommendationGrid}>{data.recommendations.map((item)=><CategoryNativeCard key={item.id} item={item} locale={data.locale}/>)}</div></section>:null}
<WalletBenefitTeaser locale={data.locale} normalPrice={Number(data.price?.amount||0)} itemId={data.item.id} categoryKey={data.item.category_key||null} schemaKey={data.schema.schema_key} territoryId={data.item.territory_id||null}/></main>}
