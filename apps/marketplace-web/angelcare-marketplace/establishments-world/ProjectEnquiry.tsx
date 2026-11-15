"use client";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
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
import { usePartner, type PartnerLocale } from "./partner/Locale";

/** Keeps contact fields in memory across all three journeys; never stores personal data in browser storage. */
export function ProjectEnquiry({
  view,
  brief,
  sourceRoute,
  values: providedValues,
  onValuesChange,
  requestVersion = 0,
  hasContext = false,
  locale = "fr",
  preparation,
  partner = false,
}: {
  view: View;
  brief: string;
  sourceRoute: string;
  values?: EnquiryValues;
  onValuesChange?: Dispatch<SetStateAction<EnquiryValues>>;
  requestVersion?: number;
  hasContext?: boolean;
  locale?: PartnerLocale;
  preparation?: ReactNode;
  partner?: boolean;
}) {
  const { t } = usePartner();
  const tr = t;
  const [localValues, setLocalValues] = useState<EnquiryValues>({
    ...EMPTY_ENQUIRY,
  });
  const values = providedValues || localValues;
  const setValues = onValuesChange || setLocalValues;
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
  const combined = enquiryMessage(
    [
      values.message,
      partner && values.fullName.trim()
        ? `${t("Nom & fonction")} : ${values.fullName.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    brief,
  );
  const remaining = max - combined.length;
  useEffect(() => {
    // A new contextual request can reuse contact information without showing a prior success.
    if (!lock.current) {
      setState("idle");
      setConfirmed(null);
      setError("");
    }
  }, [requestVersion, view]);
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
      void publicEvent("establishments", locale, "enquiry_started");
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || state === "success") return;
    if (values.website) return;
    if (
      (partner && !values.fullName.trim()) ||
      !validEnquiry("establishments", {
        ...values,
        message: hasContext ? combined : values.message,
      })
    ) {
      setError(
        "Complétez les coordonnées, votre besoin et votre accord de contact. Votre sujet préparé peut servir de contexte.",
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
            locale,
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
      void publicEvent("establishments", locale, "enquiry_success");
    } catch {
      setState("error");
      setError(
        "L’enregistrement n’a pas pu être confirmé. Vos informations sont conservées dans cette page. Réessayez ; aucune réussite n’est affichée sans référence reçue.",
      );
      void publicEvent("establishments", locale, "enquiry_failure");
    } finally {
      if (timer.current) clearTimeout(timer.current);
      lock.current = false;
    }
  }
  const field = (
    name: "organization" | "city" | "email" | "phone" | "capacity" | "fullName",
    label: string,
    required = true,
  ) => (
    <label key={name}>
      <span>
        {tr(label)}
        {tr(required ? " *" : "")}
      </span>
      <input
        name={name}
        dir={
          name === "email" || name === "phone" || name === "capacity"
            ? "ltr"
            : "auto"
        }
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
            fullName: "name",
            organization: "organization",
            city: "address-level2",
            email: "email",
            phone: "tel",
            capacity: "off",
          }[name]
        }
        maxLength={
          {
            organization: 180,
            fullName: 180,
            city: 100,
            email: 180,
            phone: 40,
            capacity: 7,
          }[name]
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
        <span className={s.eyebrow}>{tr("Votre prochaine étape")}</span>
        <h2 id="ew-enquiry-title">
          {tr(
            view === "partner-os"
              ? "Parlons de votre établissement."
              : view === "produits"
                ? "Transformons votre sélection en projet."
                : "Donnons une direction à votre différence.",
          )}
        </h2>
        <p>
          {tr(
            view === "partner-os"
              ? "Vos priorités sont déjà dans le brief. Préparons une démonstration adaptée à vos usages."
              : "Vos besoins, votre contexte, vos priorités : une demande structurée pour préparer une proposition adaptée.",
          )}
        </p>
        <div>
          <FileCheck2 size={22} />
          <span>
            {tr(
              "Votre sélection est jointe intégralement, avec les références des offres publiées.",
            )}
          </span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>
            {tr(
              "Le périmètre et les conditions sont précisés avant tout engagement.",
            )}
          </span>
        </div>
        <details className={s.briefPanel}>
          <summary>{tr("Voir la préparation jointe")}</summary>
          <pre>{tr(brief)}</pre>
        </details>
      </div>
      {state === "success" && confirmed ? (
        <div className={s.confirmed} role="status">
          <CheckCircle2 size={42} />
          <span className={s.eyebrow}>{tr("Demande confirmée")}</span>
          <h3>{tr("Votre projet a bien été enregistré.")}</h3>
          <p>
            {tr("Référence ")}
            <strong>
              <bdi>{confirmed.reference}</bdi>
            </strong>
          </p>
          <p>{tr(VIEWS.find((item) => item.key === confirmed.view)?.label)}</p>
          <details>
            <summary>{tr("Voir la sélection transmise")}</summary>
            <pre>{tr(confirmed.brief)}</pre>
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
            {tr("Préparer une nouvelle demande")}
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
            <legend>{tr("Parlons de votre établissement")}</legend>
            {tr(preparation)}
            <div className={s.formGrid} data-enquiry-contact>
              {tr(field("organization", "Établissement"))}
              {tr(field("city", "Ville"))}
              {tr(partner && field("fullName", "Nom & fonction"))}
              {tr(field("email", "Email professionnel"))}
              {tr(field("phone", "Téléphone"))}
              {tr(field("capacity", "Capacité concernée", false))}
              {!partner && (
                <label>
                  <span>{tr("Votre horizon")}</span>
                  <select
                    value={values.urgency}
                    onChange={(event) => change("urgency", event.target.value)}
                  >
                    <option value="exploration">{tr("Je me renseigne")}</option>
                    <option value="quarter">
                      {tr("Projet sous trois mois")}
                    </option>
                    <option value="urgent">
                      {tr("Besoin à étudier rapidement")}
                    </option>
                  </select>
                </label>
              )}
            </div>
            <label>
              <span>
                {tr(
                  hasContext
                    ? "Précisions complémentaires (facultatif)"
                    : "Votre contexte et vos besoins *",
                )}
              </span>
              <textarea
                required={!hasContext}
                minLength={hasContext ? undefined : 10}
                maxLength={max}
                dir="auto"
                name="message"
                rows={5}
                value={values.message}
                onChange={(event) => change("message", event.target.value)}
                aria-describedby="ew-message-budget"
                placeholder={tr(
                  "Présentez votre priorité, votre établissement et le résultat recherché…",
                )}
              />
            </label>
            <p
              id="ew-message-budget"
              className={remaining < 0 ? s.error : s.formHint}
              aria-live="polite"
            >
              {tr(
                remaining < 0
                  ? `${-remaining} caractères à retirer`
                  : `${remaining} caractères disponibles`,
              )}{" "}
              {tr("· message et sélection réunis")}
            </p>
            <label className={s.honeypot} aria-hidden="true">
              {tr("Website")}
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
                {tr(
                  "J’accepte d’être contacté au sujet de cette demande et le traitement de mes informations pour y répondre.",
                )}
              </span>
            </label>
            {error && (
              <p role="alert" className={s.error}>
                {tr(error)}
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending" || remaining < 0}
              className={s.primary}
            >
              {tr(
                state === "sending"
                  ? "Enregistrement…"
                  : state === "error"
                    ? "Réessayer ma demande"
                    : partner
                      ? "Préparer ma démonstration Partner OS"
                      : "Transmettre mon projet",
              )}
              <ArrowRight size={17} />
            </button>
            <p className={s.formHint}>
              {tr(
                "Cette demande prépare un échange. Elle ne vaut ni achat, ni activation automatique d’un abonnement.",
              )}
            </p>
          </fieldset>
        </form>
      )}
    </section>
  );
}
