"use client"

import * as React from "react"
import { ArrowRight, Building2, CheckCircle2, FileText, Image, Layers3, Plus, Printer, ShieldCheck, Sparkles, WandSparkles } from "lucide-react"
import { Badge, Field, Modal, PageStatus, SectionHeader } from "./primitives"
import { CONTENT_FAMILIES, headquartersAction, useHeadquartersSnapshot } from "./client"
import styles from "./content-command-headquarters.module.css"

type FormState = { title:string; family:string; category:string; subcategory:string; serviceKey:string; serviceLabel:string; audience:string; city:string; language:string; channel:string; journeyStage:string; objective:string; messagePillar:string; offer:string; cta:string; ownerName:string; reviewerName:string; dueAt:string; campaignLabel:string; requiredOutput:string; constraints:string }
const initial: FormState = { title:"", family:"digital", category:"Photos produits ou service", subcategory:"A.A ANGELCARE ACADEMY", serviceKey:"academy", serviceLabel:"ANGELCARE Academy", audience:"", city:"Rabat", language:"fr", channel:"Instagram", journeyStage:"awareness", objective:"", messagePillar:"", offer:"", cta:"", ownerName:"", reviewerName:"", dueAt:"", campaignLabel:"", requiredOutput:"", constraints:"" }

export default function StudioWorkspace() {
  const { snapshot, loading, error, refresh } = useHeadquartersSnapshot()
  const [family, setFamily] = React.useState(initial.family)
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [form, setForm] = React.useState(initial)
  const familyData = CONTENT_FAMILIES.find((item) => item.id === family) || CONTENT_FAMILIES[0]

  function choose(next: string) {
    const selected = CONTENT_FAMILIES.find((item) => item.id === next) || CONTENT_FAMILIES[0]
    setFamily(next); setForm({ ...initial, family: next, category: selected.categories[0], subcategory: selected.subcategories[0], channel: next === "digital" ? "Instagram" : next === "print_offline" ? "Print Shop" : "Internal Workspace" }); setOpen(true)
  }

  async function create() {
    setBusy(true)
    try {
      await headquartersAction("create_dossier", { ...form, scopeConstitution: { requiredOutput: form.requiredOutput, constraints: form.constraints, checkpoints: ["brief", "first_draft", "near_final", "final_submission"] }, brief: { objective: form.objective, audience: form.audience, message: form.messagePillar, offer: form.offer, cta: form.cta } })
      setOpen(false); setForm(initial); await refresh()
    } finally { setBusy(false) }
  }

  return <main className={styles.canvas}>
    <PageStatus loading={loading} error={error} migrationReady={snapshot?.migrationReady} refresh={refresh}/>
    <section className={styles.studioHero}><div><span className={styles.eyebrow}><WandSparkles/> ADAPTIVE CREATION STUDIOS</span><h1>Trois familles. Trois disciplines. Trois expériences de création réellement différentes.</h1><p>La taxonomie, les champs, les preuves et le parcours d’approbation se reconfigurent selon le contenu à produire.</p></div><aside><strong>{snapshot?.dossiers.length || 0}</strong><span>dossiers institutionnels</span><Badge tone="success">Taxonomie préservée</Badge></aside></section>

    <section className={styles.studioPortals}>
      <button onClick={() => choose("digital")} className={styles.digitalPortal}><span><Image/></span><small>STUDIO 01</small><h2>Contenu digital</h2><p>Social, photo, Reel, Story, vidéo, web et publicité.</p><ul><li><CheckCircle2/>Service / produit ANGELCARE</li><li><CheckCircle2/>Audience, objectif, channel</li><li><CheckCircle2/>Copy, format, variations</li></ul><b>Entrer dans le studio <ArrowRight/></b></button>
      <button onClick={() => choose("print_offline")} className={styles.printPortal}><span><Printer/></span><small>STUDIO 02</small><h2>Print & Offline</h2><p>Brochure, flyer, prospectus, packaging, terrain et événements.</p><ul><li><CheckCircle2/>Format, taille, quantité</li><li><CheckCircle2/>Finition et fournisseur</li><li><CheckCircle2/>Distribution et preuve</li></ul><b>Entrer dans le studio <ArrowRight/></b></button>
      <button onClick={() => choose("corporate_document")} className={styles.corporatePortal}><span><Building2/></span><small>STUDIO 03</small><h2>Document corporate</h2><p>Policy, SOP, gouvernance, guide, accord et présentation.</p><ul><li><CheckCircle2/>Owner, version, confidentialité</li><li><CheckCircle2/>Approval matrix</li><li><CheckCircle2/>Effective / review dates</li></ul><b>Entrer dans le studio <ArrowRight/></b></button>
    </section>

    <section className={styles.studioDoctrine}><SectionHeader eyebrow="CRÉATION GOUVERNÉE" title="Un dossier permanent naît avant le premier pixel" description="Le code unique, le brief, la constitution de scope, les checkpoints et l’AI supervisor existent dès l’ouverture."/><div>{["Code content unique", "Brief stratégique", "Scope constitution", "Mission et tâches", "Preuves obligatoires", "AI quality loop", "Validation humaine", "Source canonique Bridge"].map((item,index) => <span key={item}><b>{String(index+1).padStart(2,"0")}</b><strong>{item}</strong></span>)}</div></section>

    <Modal open={open} title={`Créer · ${familyData.label}`} onClose={() => setOpen(false)} footer={<><button className={styles.modalSecondary} onClick={() => setOpen(false)}>Fermer</button><button className={styles.modalPrimary} disabled={busy || !form.title || !form.objective || !form.audience} onClick={() => void create()}><Plus/> Créer le dossier 360</button></>}>
      <div className={`${styles.creationForm} ${styles[`creation_${family}`]}`}>
        <section><h3><Layers3/> Identité & classification</h3><div className={styles.formGrid}>
          <Field label="Titre" wide><input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})}/></Field>
          <Field label="Catégorie"><select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}>{familyData.categories.map((item)=><option key={item}>{item}</option>)}</select></Field>
          <Field label="Sous-catégorie"><select value={form.subcategory} onChange={(e)=>setForm({...form,subcategory:e.target.value})}>{familyData.subcategories.map((item)=><option key={item}>{item}</option>)}</select></Field>
          <Field label="Service"><input value={form.serviceLabel} onChange={(e)=>setForm({...form,serviceLabel:e.target.value,serviceKey:e.target.value.toLowerCase().replace(/\W+/g,"_")})}/></Field>
          <Field label="Campagne"><input value={form.campaignLabel} onChange={(e)=>setForm({...form,campaignLabel:e.target.value})}/></Field>
        </div></section>
        <section><h3><Sparkles/> Architecture stratégique</h3><div className={styles.formGrid}>
          <Field label="Audience"><input value={form.audience} onChange={(e)=>setForm({...form,audience:e.target.value})}/></Field><Field label="Ville"><input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></Field>
          <Field label="Channel"><input value={form.channel} onChange={(e)=>setForm({...form,channel:e.target.value})}/></Field><Field label="Journey stage"><select value={form.journeyStage} onChange={(e)=>setForm({...form,journeyStage:e.target.value})}><option value="awareness">Awareness</option><option value="consideration">Consideration</option><option value="conversion">Conversion</option><option value="retention">Retention</option><option value="authority">Authority</option></select></Field>
          <Field label="Objectif" wide><textarea value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></Field><Field label="Pilier de message" wide><textarea value={form.messagePillar} onChange={(e)=>setForm({...form,messagePillar:e.target.value})}/></Field>
          <Field label="Offre"><input value={form.offer} onChange={(e)=>setForm({...form,offer:e.target.value})}/></Field><Field label="CTA"><input value={form.cta} onChange={(e)=>setForm({...form,cta:e.target.value})}/></Field>
        </div></section>
        <section><h3><ShieldCheck/> Scope & responsabilité</h3><div className={styles.formGrid}>
          <Field label="Sortie exacte requise" wide><textarea value={form.requiredOutput} onChange={(e)=>setForm({...form,requiredOutput:e.target.value})}/></Field><Field label="Contraintes / interdit" wide><textarea value={form.constraints} onChange={(e)=>setForm({...form,constraints:e.target.value})}/></Field>
          <Field label="Owner"><input value={form.ownerName} onChange={(e)=>setForm({...form,ownerName:e.target.value})}/></Field><Field label="Reviewer"><input value={form.reviewerName} onChange={(e)=>setForm({...form,reviewerName:e.target.value})}/></Field><Field label="Échéance"><input type="datetime-local" value={form.dueAt} onChange={(e)=>setForm({...form,dueAt:e.target.value})}/></Field>
        </div></section>
        {family === "digital" ? <div className={styles.familySpecific}><Image/><strong>Digital controls</strong><span>Dimensions · duration · script · caption · variations · privacy · CTA</span></div> : null}
        {family === "print_offline" ? <div className={styles.familySpecific}><Printer/><strong>Print controls</strong><span>Size · bleed · colour mode · paper stock · finishing · quantity · distribution</span></div> : null}
        {family === "corporate_document" ? <div className={styles.familySpecific}><FileText/><strong>Document controls</strong><span>Version · confidentiality · approvers · effective date · review date · superseded record</span></div> : null}
      </div>
    </Modal>
  </main>
}
