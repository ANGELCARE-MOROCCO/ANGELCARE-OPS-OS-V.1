import { Accessibility, Braces, CheckCircle2, Database, LayoutGrid, Link2, ShieldCheck } from 'lucide-react'
import { CMS_BLOCK_REGISTRY, STRUCTURAL_BLOCK_TYPES } from '../block-registry'
import styles from '../experience.module.css'

export function BlockContractRegistry(){
  const categories=[...new Set(CMS_BLOCK_REGISTRY.map(item=>item.category))]
  return <div className={styles.blockContractWorkspace}>
    <section className={styles.registryMetrics}>{<><div><span>Canonical</span><strong>{CMS_BLOCK_REGISTRY.length}</strong><small>types enregistrés</small></div><div><span>Structural</span><strong>{STRUCTURAL_BLOCK_TYPES.size}</strong><small>primitives layout</small></div><div><span>Runtime</span><strong>{CMS_BLOCK_REGISTRY.filter(x=>x.runtimeStatus==='ready').length}/{CMS_BLOCK_REGISTRY.length}</strong><small>ready</small></div><div><span>Editor</span><strong>{CMS_BLOCK_REGISTRY.filter(x=>x.editorStatus==='ready').length}/{CMS_BLOCK_REGISTRY.length}</strong><small>ready</small></div></>}</section>
    <section className={styles.contractCategoryStrip}>{categories.map(category=><span key={category}>{category} · {CMS_BLOCK_REGISTRY.filter(item=>item.category===category).length}</span>)}</section>
    <section className={styles.contractGrid}>{CMS_BLOCK_REGISTRY.map(def=><article key={def.type} data-category={def.category}><header><div className={styles.contractIcon}>{def.category==='structural'?<LayoutGrid size={17}/>:def.category==='commerce'?<Database size={17}/>:<Braces size={17}/>}</div><div><span>{def.category}</span><h2>{def.name}</h2><code>{def.type} · schema v{def.schemaVersion}</code></div><CheckCircle2 size={16}/></header><p>{def.purpose}</p><div className={styles.contractFacts}><div><span>Fields</span><strong>{def.fields.length}</strong></div><div><span>Bindings</span><strong>{def.bindings.length}</strong></div><div><span>Children</span><strong>{def.nesting.canHaveChildren?'YES':'NO'}</strong></div></div><div className={styles.contractTags}>{def.fields.slice(0,8).map(field=><span key={field.key}>{field.key}:{field.kind}{field.required?'*':''}</span>)}</div><footer><span><Accessibility size={12}/>{def.accessibility.length} a11y</span><span><ShieldCheck size={12}/>{def.validation.required.length} requis</span><span><Link2 size={12}/>{def.nesting.allowedParents}</span></footer></article>)}</section>
  </div>
}
