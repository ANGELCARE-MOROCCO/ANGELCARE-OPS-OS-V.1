"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import {
  EMPTY_ENQUIRY,
  enquiryEndpoint,
  enquiryPayload,
  publicEvent,
  responseReference,
  validEnquiry,
  type EnquiryValues,
} from "../business-worlds/contract";
import { VIEWS, type View } from "./content";
import { enquiryMessage } from "./model";
import s from "./journey.module.css";

/** Keeps contact fields in memory across all three journeys; never stores personal data in browser storage. */
export function ProjectEnquiry({
  view,
  brief,
  sourceRoute,
}: {
  view: View;
  brief: string;
  sourceRoute: string;
}) {
  const [values, setValues] = useState<EnquiryValues>({ ...EMPTY_ENQUIRY });
  const [state, setState] = useState<"idle" | "sending" | "error" | "success">(
    "idle",
  );
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<{
    reference: string;
    brief: string;
    view: View;
  } | null>(null);
  const lock = useRef(false),
    started = useRef(false),
    controller = useRef<AbortController | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const max = 2980;
  const combined = enquiryMessage(values.message, brief);
  const remaining = max - combined.length;
  useEffect(
    () => () => {
      controller.current?.abort();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function change(key: keyof EnquiryValues, value: string | boolean) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setError("");
    if (state === "error") setState("idle");
    if (!started.current) {
      started.current = true;
      void publicEvent("establishments", "fr", "enquiry_started");
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || state === "success") return;
    if (values.website) return;
    if (!validEnquiry("establishments", values)) {
      setError(
        "Complétez les coordonnées, un message de dix caractères minimum et votre accord de contact.",
      );
      return;
    }
    if (remaining < 0) {
      setError(
        "Le message et votre sélection dépassent la capacité de la demande. Raccourcissez le message ou retirez un élément : aucune référence ne sera supprimée automatiquement.",
      );
      return;
    }
    const snapshot = {
      view,
      brief,
      sourceRoute,
      values: { ...values, message: combined },
    };
    lock.current = true;
    setState("sending");
    setError("");
    controller.current = new AbortController();
    timer.current = setTimeout(() => controller.current?.abort(), 25000);
    try {
      const response = await fetch(enquiryEndpoint("establishments"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.current.signal,
        body: JSON.stringify(
          enquiryPayload(
            "establishments",
            "fr",
            snapshot.values,
            snapshot.sourceRoute,
          ),
        ),
      });
      const payload: unknown = await response.json();
      const reference = responseReference(payload);
      if (!response.ok || !reference) throw Error("Unconfirmed enquiry");
      setConfirmed({ reference, brief: snapshot.brief, view: snapshot.view });
      setState("success");
      void publicEvent("establishments", "fr", "enquiry_success");
    } catch {
      setState("error");
      setError(
        "L’enregistrement n’a pas pu être confirmé. Vos informations sont conservées dans cette page. Réessayez ; aucune réussite n’est affichée sans référence reçue.",
      );
      void publicEvent("establishments", "fr", "enquiry_failure");
    } finally {
      if (timer.current) clearTimeout(timer.current);
      lock.current = false;
    }
  }
  const field = (
    name: "organization" | "city" | "email" | "phone" | "capacity",
    label: string,
    required = true,
  ) => (
    <label key={name}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        required={required}
        value={values[name]}
        type={
          name === "email"
            ? "email"
            : name === "capacity"
              ? "number"
              : name === "phone"
                ? "tel"
                : "text"
        }
        autoComplete={
          {
            organization: "organization",
            city: "address-level2",
            email: "email",
            phone: "tel",
            capacity: "off",
          }[name]
        }
        maxLength={
          { organization: 180, city: 100, email: 180, phone: 40, capacity: 7 }[
            name
          ]
        }
        min={name === "capacity" ? 0 : undefined}
        max={name === "capacity" ? 1000000 : undefined}
        onChange={(event) => change(name, event.target.value)}
      />
    </label>
  );
  return (
    <section
      id="world-enquiry"
      className={s.projectEnquiry}
      aria-labelledby="ew-enquiry-title"
    >
      <div className={s.enquiryIntro}>
        <span className={s.eyebrow}>Votre prochaine étape</span>
        <h2 id="ew-enquiry-title">
          {view === "partner-os"
            ? "Préparons votre année gratuite."
            : view === "produits"
              ? "Transformons votre sélection en projet."
              : "Donnons une direction à votre différence."}
        </h2>
        <p>
          {view === "partner-os"
            ? "Présentez votre établissement pour préciser le périmètre du plan gratuit pendant douze mois et les conditions de mise en route."
            : "Vos besoins, votre contexte, vos priorités : une demande structurée pour préparer une proposition adaptée."}
        </p>
        <div>
          <FileCheck2 size={22} />
          <span>
            Votre sélection est jointe intégralement, avec les références des
            offres publiées.
          </span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>
            Le périmètre et les conditions sont précisés avant tout engagement.
          </span>
        </div>
        <details className={s.briefPanel}>
          <summary>Voir la préparation jointe</summary>
          <pre>{brief}</pre>
        </details>
      </div>
      {state === "success" && confirmed ? (
        <div className={s.confirmed} role="status">
          <CheckCircle2 size={42} />
          <span className={s.eyebrow}>Demande confirmée</span>
          <h3>Votre projet a bien été enregistré.</h3>
          <p>
            Référence <strong>{confirmed.reference}</strong>
          </p>
          <p>{VIEWS.find((item) => item.key === confirmed.view)?.label}</p>
          <details>
            <summary>Voir la sélection transmise</summary>
            <pre>{confirmed.brief}</pre>
          </details>
          <button
            className={s.primary}
            onClick={() => {
              setState("idle");
              setConfirmed(null);
              setValues((previous) => ({
                ...previous,
                message: "",
                consent: false,
              }));
            }}
          >
            Préparer une nouvelle demande
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          aria-busy={state === "sending"}
          className={s.projectForm}
        >
          <fieldset disabled={state === "sending"}>
            <legend>Parlons de votre établissement</legend>
            <div className={s.formGrid}>
              {field("organization", "Établissement")}
              {field("city", "Ville")}
              {field("email", "Email professionnel")}
              {field("phone", "Téléphone")}
              {field("capacity", "Capacité concernée", false)}
              <label>
                <span>Votre horizon</span>
                <select
                  value={values.urgency}
                  onChange={(event) => change("urgency", event.target.value)}
                >
                  <option value="exploration">Je me renseigne</option>
                  <option value="quarter">Projet sous trois mois</option>
                  <option value="urgent">Besoin à étudier rapidement</option>
                </select>
              </label>
            </div>
            <label>
              <span>Votre contexte et vos besoins *</span>
              <textarea
                required
                minLength={10}
                maxLength={max}
                name="message"
                rows={5}
                value={values.message}
                onChange={(event) => change("message", event.target.value)}
                aria-describedby="ew-message-budget"
                placeholder="Présentez votre priorité, votre établissement et le résultat recherché…"
              />
            </label>
            <p
              id="ew-message-budget"
              className={remaining < 0 ? s.error : s.formHint}
              aria-live="polite"
            >
              {remaining < 0
                ? `${-remaining} caractères à retirer`
                : `${remaining} caractères disponibles`}{" "}
              · message et sélection réunis
            </p>
            <label className={s.honeypot} aria-hidden="true">
              Website
              <input
                name="website"
                value={values.website}
                tabIndex={-1}
                autoComplete="off"
                onChange={(event) => change("website", event.target.value)}
              />
            </label>
            <label className={s.formConsent}>
              <input
                type="checkbox"
                name="consent"
                required
                checked={values.consent}
                onChange={(event) => change("consent", event.target.checked)}
              />
              <span>
                J’accepte d’être contacté au sujet de cette demande et le
                traitement de mes informations pour y répondre.
              </span>
            </label>
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending" || remaining < 0}
              className={s.primary}
            >
              {state === "sending"
                ? "Enregistrement…"
                : state === "error"
                  ? "Réessayer ma demande"
                  : "Transmettre mon projet"}
              <ArrowRight size={17} />
            </button>
            <p className={s.formHint}>
              Cette demande prépare un échange. Elle ne vaut ni achat, ni
              activation automatique d’un abonnement.
            </p>
          </fieldset>
        </form>
      )}
    </section>
  );
}
