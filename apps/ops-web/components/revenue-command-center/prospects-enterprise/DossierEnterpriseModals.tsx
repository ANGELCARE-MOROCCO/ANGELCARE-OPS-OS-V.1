"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ContactRound,
  FilePenLine,
  Loader2,
  X,
} from "lucide-react"
import styles from "./ProspectEnterprise.module.css"
import { mutateRevenueEndpoint } from "./useProspectEnterpriseData"
import { useEnterpriseDialog } from "./useEnterpriseDialog"

export type DossierEnterpriseModalKind =
  | "prospect"
  | "account"
  | "contact"
  | "opportunity-transition"
  | null

type Props = {
  kind: DossierEnterpriseModalKind
  dossier: any
  selectedContact?: any | null
  selectedOpportunity?: any | null
  onClose: () => void
  onSaved: () => void
}

function asLocalDateTime(value: unknown) {
  if (!value) return ""
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return ""
  const offset = parsed.getTimezoneOffset() * 60_000
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16)
}

export default function DossierEnterpriseModals({
  kind,
  dossier,
  selectedContact,
  selectedOpportunity,
  onClose,
  onSaved,
}: Props) {
  const prospect = dossier?.prospect || {}
  const account = dossier?.account || {}
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<Record<string, string>>({})
  const dialogRef = useEnterpriseDialog(Boolean(kind), onClose)

  useEffect(() => {
    if (!kind) return
    if (kind === "prospect") {
      setForm({
        name: prospect.name || "",
        company: prospect.company || "",
        city: prospect.city || "",
        owner: prospect.owner || "",
        priority: prospect.priority || "medium",
        stage: prospect.stage || "new_lead",
        valueMad: String(prospect.value_mad || ""),
        probability: String(prospect.probability || ""),
        contactName: prospect.contact_name || "",
        email: prospect.email || "",
        phone: prospect.phone || "",
        nextActionAt: asLocalDateTime(prospect.next_action_at),
      })
    }
    if (kind === "account") {
      setForm({
        accountName: account.account_name || prospect.company || prospect.name || "",
        legalName: account.legal_name || "",
        city: account.city || prospect.city || "",
        segment: account.segment || prospect.segment || "b2b",
        lifecycleStage: account.lifecycle_stage || "prospect",
        priority: account.priority || prospect.priority || "medium",
        ownerName: account.owner_name || prospect.owner || "",
        industry: account.industry || "",
        website: account.website || "",
        domain: account.domain || "",
        phone: account.phone || prospect.phone || "",
        email: account.email || prospect.email || "",
      })
    }
    if (kind === "contact") {
      const contact = selectedContact || {}
      setForm({
        fullName: contact.full_name || "",
        roleTitle: contact.role_title || "",
        department: contact.department || "",
        seniority: contact.seniority || "",
        email: contact.email || "",
        phone: contact.phone || "",
        whatsapp: contact.whatsapp || "",
        influenceLevel: contact.influence_level || "unknown",
        decisionRole: contact.decision_role || "contact",
        preferredChannel: contact.preferred_channel || "phone",
        consentStatus: contact.consent_status || "unknown",
      })
    }
    if (kind === "opportunity-transition") {
      const opportunity = selectedOpportunity || {}
      setForm({
        toStage: opportunity.stage || "qualification",
        probability: String(opportunity.probability || 0),
        nextStep: opportunity.next_step || "",
        nextStepAt: asLocalDateTime(opportunity.next_step_at),
        reason: "",
      })
    }
    setError("")
  }, [kind, prospect, account, selectedContact, selectedOpportunity])

  if (!kind) return null

  const definitions = {
    prospect: {
      icon: <FilePenLine size={18} />,
      title: "Mettre à jour le dossier prospect",
      description: "Corriger l’identité opérationnelle, la priorité, la valeur et la prochaine action sans rompre les liens existants.",
    },
    account: {
      icon: <Building2 size={18} />,
      title: account.id ? "Mettre à jour le compte" : "Structurer le compte canonique",
      description: "Consolider l’identité de l’organisation, son secteur, son territoire et son propriétaire commercial.",
    },
    contact: {
      icon: <ContactRound size={18} />,
      title: selectedContact?.id ? "Mettre à jour le contact" : "Ajouter un contact au compte",
      description: "Enregistrer une personne réelle, ses coordonnées, son influence et sa place dans la décision.",
    },
    "opportunity-transition": {
      icon: <ArrowRightLeft size={18} />,
      title: "Contrôler la progression de l’opportunité",
      description: "Modifier l’étape, la probabilité et la prochaine action avec une justification auditée.",
    },
  }[kind]

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError("")
    try {
      if (kind === "prospect") {
        await mutateRevenueEndpoint(
          `/api/revenue-command-center/prospects/${encodeURIComponent(prospect.id)}`,
          "PATCH",
          {
            name: form.name,
            company: form.company,
            city: form.city,
            owner: form.owner,
            priority: form.priority,
            stage: form.stage,
            valueMad: Number(form.valueMad || 0),
            probability: Number(form.probability || 0),
            contactName: form.contactName,
            email: form.email,
            phone: form.phone,
            nextActionAt: form.nextActionAt || null,
          },
        )
      }

      if (kind === "account") {
        const payload = {
          accountName: form.accountName,
          legalName: form.legalName,
          city: form.city,
          segment: form.segment,
          lifecycleStage: form.lifecycleStage,
          priority: form.priority,
          ownerName: form.ownerName,
          industry: form.industry,
          website: form.website,
          domain: form.domain,
          phone: form.phone,
          email: form.email,
        }
        if (account.id) {
          await mutateRevenueEndpoint("/api/revenue-command-center/accounts", "PATCH", {
            id: account.id,
            ...payload,
          })
        } else {
          const created = await mutateRevenueEndpoint("/api/revenue-command-center/accounts", "POST", payload)
          const accountId = created?.account?.id
          if (!accountId) throw new Error("Le compte a été créé sans identifiant exploitable.")
          await mutateRevenueEndpoint(
            `/api/revenue-command-center/prospects/${encodeURIComponent(prospect.id)}`,
            "PATCH",
            { accountId },
          )
        }
      }

      if (kind === "contact") {
        const payload = {
          id: selectedContact?.id,
          accountId: account.id || prospect.account_id || null,
          prospectId: prospect.id,
          fullName: form.fullName,
          roleTitle: form.roleTitle,
          department: form.department,
          seniority: form.seniority,
          email: form.email,
          phone: form.phone,
          whatsapp: form.whatsapp,
          influenceLevel: form.influenceLevel,
          decisionRole: form.decisionRole,
          preferredChannel: form.preferredChannel,
          consentStatus: form.consentStatus,
          isPrimary: !selectedContact?.id && !(dossier?.contacts || []).length,
        }
        if (selectedContact?.id) {
          await mutateRevenueEndpoint("/api/revenue-command-center/contacts", "PATCH", payload)
        } else {
          const created = await mutateRevenueEndpoint("/api/revenue-command-center/contacts", "POST", payload)
          const contactId = created?.contact?.id
          if (contactId && !prospect.contact_id) {
            await mutateRevenueEndpoint(
              `/api/revenue-command-center/prospects/${encodeURIComponent(prospect.id)}`,
              "PATCH",
              { contactId, contactName: form.fullName, email: form.email, phone: form.phone },
            )
          }
        }
      }

      if (kind === "opportunity-transition") {
        if (!selectedOpportunity?.id) throw new Error("Sélectionnez une opportunité à faire progresser.")
        await mutateRevenueEndpoint("/api/revenue-command-center/opportunities/transition", "POST", {
          opportunityId: selectedOpportunity.id,
          toStage: form.toStage,
          probability: Number(form.probability || 0),
          nextStep: form.nextStep,
          nextStepAt: form.nextStepAt || null,
          reason: form.reason,
        })
      }

      onSaved()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "L’opération n’a pas pu être enregistrée.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <section ref={dialogRef} tabIndex={-1} className={`${styles.modal} ${styles.modalWide}`} role="dialog" aria-modal="true" aria-labelledby="dossier-enterprise-modal-title">
        <header className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>{definitions.icon}</span>
            <div>
              <h2 id="dossier-enterprise-modal-title">{definitions.title}</h2>
              <p>{definitions.description}</p>
            </div>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            {kind === "prospect" ? (
              <>
                <div className={styles.field}><label>Nom du prospect</label><input value={form.name || ""} onChange={(event) => update("name", event.target.value)} /></div>
                <div className={styles.field}><label>Organisation</label><input value={form.company || ""} onChange={(event) => update("company", event.target.value)} /></div>
                <div className={styles.field}><label>Ville</label><input value={form.city || ""} onChange={(event) => update("city", event.target.value)} /></div>
                <div className={styles.field}><label>Responsable</label><input value={form.owner || ""} onChange={(event) => update("owner", event.target.value)} /></div>
                <div className={styles.field}><label>Priorité</label><select value={form.priority || "medium"} onChange={(event) => update("priority", event.target.value)}><option value="low">Faible</option><option value="medium">Modérée</option><option value="high">Élevée</option><option value="critical">Critique</option></select></div>
                <div className={styles.field}><label>Étape</label><select value={form.stage || "new_lead"} onChange={(event) => update("stage", event.target.value)}><option value="new_lead">Nouveau</option><option value="discovery">Découverte</option><option value="qualification">Qualification</option><option value="decision_map">Décision</option><option value="appointment_ready">Rendez-vous</option><option value="proposal">Proposition</option><option value="negotiation">Négociation</option><option value="contracting">Contractualisation</option><option value="recovery">Récupération</option></select></div>
                <div className={styles.field}><label>Valeur estimée (Dh)</label><input type="number" value={form.valueMad || ""} onChange={(event) => update("valueMad", event.target.value)} /></div>
                <div className={styles.field}><label>Probabilité</label><input type="number" min="0" max="100" value={form.probability || ""} onChange={(event) => update("probability", event.target.value)} /></div>
                <div className={styles.field}><label>Contact affiché</label><input value={form.contactName || ""} onChange={(event) => update("contactName", event.target.value)} /></div>
                <div className={styles.field}><label>Téléphone</label><input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /></div>
                <div className={styles.field}><label>E-mail</label><input type="email" value={form.email || ""} onChange={(event) => update("email", event.target.value)} /></div>
                <div className={styles.field}><label>Prochaine action</label><input type="datetime-local" value={form.nextActionAt || ""} onChange={(event) => update("nextActionAt", event.target.value)} /></div>
              </>
            ) : null}

            {kind === "account" ? (
              <>
                <div className={styles.field}><label>Nom commercial</label><input value={form.accountName || ""} onChange={(event) => update("accountName", event.target.value)} /></div>
                <div className={styles.field}><label>Dénomination légale</label><input value={form.legalName || ""} onChange={(event) => update("legalName", event.target.value)} /></div>
                <div className={styles.field}><label>Ville</label><input value={form.city || ""} onChange={(event) => update("city", event.target.value)} /></div>
                <div className={styles.field}><label>Segment</label><input value={form.segment || ""} onChange={(event) => update("segment", event.target.value)} /></div>
                <div className={styles.field}><label>Cycle de vie</label><select value={form.lifecycleStage || "prospect"} onChange={(event) => update("lifecycleStage", event.target.value)}><option value="prospect">Prospect</option><option value="qualified">Qualifié</option><option value="customer">Client</option><option value="partner">Partenaire</option><option value="inactive">Inactif</option></select></div>
                <div className={styles.field}><label>Priorité</label><select value={form.priority || "medium"} onChange={(event) => update("priority", event.target.value)}><option value="low">Faible</option><option value="medium">Modérée</option><option value="high">Élevée</option><option value="critical">Critique</option></select></div>
                <div className={styles.field}><label>Responsable du compte</label><input value={form.ownerName || ""} onChange={(event) => update("ownerName", event.target.value)} /></div>
                <div className={styles.field}><label>Secteur</label><input value={form.industry || ""} onChange={(event) => update("industry", event.target.value)} /></div>
                <div className={styles.field}><label>Site web</label><input value={form.website || ""} onChange={(event) => update("website", event.target.value)} /></div>
                <div className={styles.field}><label>Domaine</label><input value={form.domain || ""} onChange={(event) => update("domain", event.target.value)} /></div>
                <div className={styles.field}><label>Téléphone</label><input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /></div>
                <div className={styles.field}><label>E-mail</label><input type="email" value={form.email || ""} onChange={(event) => update("email", event.target.value)} /></div>
              </>
            ) : null}

            {kind === "contact" ? (
              <>
                <div className={styles.field}><label>Nom complet</label><input value={form.fullName || ""} onChange={(event) => update("fullName", event.target.value)} /></div>
                <div className={styles.field}><label>Fonction</label><input value={form.roleTitle || ""} onChange={(event) => update("roleTitle", event.target.value)} /></div>
                <div className={styles.field}><label>Département</label><input value={form.department || ""} onChange={(event) => update("department", event.target.value)} /></div>
                <div className={styles.field}><label>Séniorité</label><input value={form.seniority || ""} onChange={(event) => update("seniority", event.target.value)} /></div>
                <div className={styles.field}><label>E-mail</label><input type="email" value={form.email || ""} onChange={(event) => update("email", event.target.value)} /></div>
                <div className={styles.field}><label>Téléphone</label><input value={form.phone || ""} onChange={(event) => update("phone", event.target.value)} /></div>
                <div className={styles.field}><label>WhatsApp</label><input value={form.whatsapp || ""} onChange={(event) => update("whatsapp", event.target.value)} /></div>
                <div className={styles.field}><label>Canal préféré</label><select value={form.preferredChannel || "phone"} onChange={(event) => update("preferredChannel", event.target.value)}><option value="phone">Téléphone</option><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="meeting">Rendez-vous</option></select></div>
                <div className={styles.field}><label>Rôle de décision</label><select value={form.decisionRole || "contact"} onChange={(event) => update("decisionRole", event.target.value)}><option value="contact">Contact</option><option value="decision_maker">Décideur</option><option value="economic_buyer">Acheteur économique</option><option value="sponsor">Sponsor</option><option value="influencer">Influenceur</option><option value="user">Utilisateur</option><option value="blocker">Bloqueur</option></select></div>
                <div className={styles.field}><label>Influence</label><select value={form.influenceLevel || "unknown"} onChange={(event) => update("influenceLevel", event.target.value)}><option value="unknown">Inconnue</option><option value="low">Faible</option><option value="medium">Modérée</option><option value="high">Élevée</option><option value="critical">Décisive</option></select></div>
                <div className={styles.field}><label>Consentement</label><select value={form.consentStatus || "unknown"} onChange={(event) => update("consentStatus", event.target.value)}><option value="unknown">À confirmer</option><option value="granted">Accordé</option><option value="restricted">Restreint</option><option value="revoked">Révoqué</option></select></div>
              </>
            ) : null}

            {kind === "opportunity-transition" ? (
              <>
                <div className={styles.field}><label>Nouvelle étape</label><select value={form.toStage || "qualification"} onChange={(event) => update("toStage", event.target.value)}><option value="qualification">Qualification</option><option value="discovery">Découverte</option><option value="decision_map">Décision</option><option value="appointment_ready">Rendez-vous</option><option value="proposal">Proposition</option><option value="negotiation">Négociation</option><option value="contracting">Contractualisation</option><option value="closed_won">Gagnée</option><option value="closed_lost">Perdue</option><option value="recovery">Récupération</option></select></div>
                <div className={styles.field}><label>Probabilité</label><input type="number" min="0" max="100" value={form.probability || ""} onChange={(event) => update("probability", event.target.value)} /></div>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Prochaine étape concrète</label><input value={form.nextStep || ""} onChange={(event) => update("nextStep", event.target.value)} /></div>
                <div className={styles.field}><label>Échéance</label><input type="datetime-local" value={form.nextStepAt || ""} onChange={(event) => update("nextStepAt", event.target.value)} /></div>
                <div className={`${styles.field} ${styles.fieldFull}`}><label>Motif et preuve de transition</label><textarea value={form.reason || ""} onChange={(event) => update("reason", event.target.value)} placeholder="Décision, engagement, objection résolue ou raison de retour en arrière." /></div>
              </>
            ) : null}
          </div>

          {error ? <div className={styles.schemaNotice} style={{ marginTop: 14 }}><AlertTriangle size={18} /><div><strong>Enregistrement impossible</strong><p>{error}</p></div></div> : null}
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.ghostButton} onClick={onClose}>Annuler</button>
          <button type="button" className={styles.primaryButton} onClick={submit} disabled={saving}>
            {saving ? <Loader2 size={15} className={styles.loadingSpin} /> : <CheckCircle2 size={15} />} Enregistrer
          </button>
        </footer>
      </section>
    </div>
  )
}
