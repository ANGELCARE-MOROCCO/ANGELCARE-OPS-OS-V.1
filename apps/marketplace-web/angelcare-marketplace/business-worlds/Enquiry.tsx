"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import type { CatalogLocale } from "../catalog-discovery/types";
import { B, WORLDS, tr, type BusinessKey } from "./content";
import {
  EMPTY_ENQUIRY,
  appendBrief,
  enquiryEndpoint,
  enquiryPayload,
  publicEvent,
  responseReference,
  routeFor,
  validEnquiry,
  type EnquiryValues,
} from "./contract";
import s from "./business.module.css";
export function Enquiry({
  world,
  locale,
  brief = "",
  sourceRoute,
}: {
  world: BusinessKey;
  locale: CatalogLocale;
  brief?: string;
  sourceRoute?: string;
}) {
  const [v, setV] = useState<EnquiryValues>({ ...EMPTY_ENQUIRY }),
    [state, setState] = useState<"idle" | "sending" | "error" | "success">(
      "idle",
    ),
    [reference, setReference] = useState(""),
    [invalid, setInvalid] = useState(false);
  const lock = useRef(false),
    controller = useRef<AbortController | null>(null),
    started = useRef(false),
    p = WORLDS[world],
    max = p.vertical ? 2980 : 4000;
  useEffect(() => () => controller.current?.abort(), []);
  const change = (key: keyof EnquiryValues, value: string | boolean) => {
    setV((previous) => ({ ...previous, [key]: value }));
    if (!started.current) {
      started.current = true;
      void publicEvent(world, locale, "enquiry_started");
    }
    if (state === "error") setState("idle");
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || state === "success") return;
    if (!validEnquiry(world, v)) {
      setInvalid(true);
      return;
    }
    lock.current = true;
    setState("sending");
    setInvalid(false);
    controller.current = new AbortController();
    const timeout = window.setTimeout(() => controller.current?.abort(), 25000);
    try {
      const response = await fetch(enquiryEndpoint(world), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          enquiryPayload(
            world,
            locale,
            v,
            sourceRoute || routeFor(locale, world),
          ),
        ),
        signal: controller.current.signal,
      });
      const payload: unknown = await response.json(),
        ref = responseReference(payload);
      if (!response.ok || !ref) throw Error("Unconfirmed enquiry");
      setReference(ref);
      setState("success");
      void publicEvent(world, locale, "enquiry_success");
    } catch {
      setState("error");
      void publicEvent(world, locale, "enquiry_failure");
    } finally {
      window.clearTimeout(timeout);
      lock.current = false;
    }
  }
  const field = (
    name: "fullName" | "organization" | "city" | "email" | "phone" | "capacity",
    required = false,
  ) => (
    <label className={s.field} key={name}>
      <span>
        {tr(B[name], locale)}
        {required ? " *" : ""}
      </span>
      <input
        name={name}
        value={v[name]}
        required={required}
        type={
          name === "email" ? "email" : name === "capacity" ? "number" : "text"
        }
        inputMode={name === "phone" ? "tel" : undefined}
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
            fullName: 180,
            organization: p.vertical ? 180 : 240,
            city: p.vertical ? 100 : 120,
            email: p.vertical ? 180 : 250,
            phone: p.vertical ? 40 : 80,
            capacity: 7,
          }[name]
        }
        min={name === "capacity" ? 0 : undefined}
        max={name === "capacity" ? 1000000 : undefined}
        onChange={(e) => change(name, e.target.value)}
      />
    </label>
  );
  return (
    <section
      className={s.enquiry}
      id="world-enquiry"
      data-business-module="enquiry"
    >
      <div className={s.enquiryIntro}>
        <span className={s.kicker}>
          <Send size={16} />
          {tr(p.label, locale)}
        </span>
        <h2>{tr(p.action, locale)}</h2>
        <p>{tr(B.contactLead, locale)}</p>
        <div className={s.assurance}>
          <ShieldCheck />
          <strong>{tr(B.proof, locale)}</strong>
          <p>{tr(B.faqScopeBody, locale)}</p>
        </div>
        {brief ? (
          <div className={s.brief}>
            <small>{tr(B.summary, locale)}</small>
            <p>{brief}</p>
          </div>
        ) : null}
      </div>
      {state === "success" ? (
        <div className={s.confirmation} role="status">
          <CheckCircle2 size={44} />
          <h3>{tr(B.success, locale)}</h3>
          <p>
            {tr(B.reference, locale)} <strong>{reference}</strong>
          </p>
          <p>{tr(B.contactLead, locale)}</p>
        </div>
      ) : (
        <form
          className={s.form}
          onSubmit={submit}
          aria-busy={state === "sending"}
        >
          <fieldset disabled={state === "sending"}>
            <legend className={s.sr}>{tr(B.contact, locale)}</legend>
            <div className={s.fields}>
              {!p.vertical ? field("fullName", true) : null}
              {field("organization", !!p.vertical)}
              {field("city", !!p.vertical)}
              {field("email", !!p.vertical)}
              {field("phone", !!p.vertical)}
              {p.vertical ? field("capacity") : null}
              <label className={s.field}>
                <span>{tr(B.urgency, locale)}</span>
                <select
                  value={v.urgency}
                  onChange={(e) => change("urgency", e.target.value)}
                >
                  {(["exploration", "quarter", "urgent"] as const).map((k) => (
                    <option key={k} value={k}>
                      {tr(B[k], locale)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={s.field}>
              <span>{tr(B.message, locale)} *</span>
              <textarea
                name="message"
                value={v.message}
                required
                minLength={10}
                maxLength={max}
                rows={5}
                onChange={(e) => change("message", e.target.value)}
              />
            </label>
            {brief ? (
              <button
                className={s.textButton}
                type="button"
                onClick={() => {
                  setV((previous) => ({
                    ...previous,
                    message: appendBrief(previous.message, brief, max),
                  }));
                  void publicEvent(world, locale, "brief_prepared");
                }}
              >
                {tr(B.useBrief, locale)}
                <ArrowUpRight size={15} />
              </button>
            ) : null}
            <label className={s.honeypot} aria-hidden="true">
              Website
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={v.website}
                onChange={(e) => change("website", e.target.value)}
              />
            </label>
            <label className={s.consent}>
              <input
                name="consent"
                type="checkbox"
                required
                checked={v.consent}
                onChange={(e) => change("consent", e.target.checked)}
              />
              <span>{tr(B.consent, locale)}</span>
            </label>
            {invalid ? (
              <p className={s.error} role="alert">
                {tr(B.invalid, locale)}
              </p>
            ) : null}
            {state === "error" ? (
              <p className={s.error} role="alert">
                {tr(B.failure, locale)}
              </p>
            ) : null}
            <button className={s.button} type="submit">
              {tr(state === "sending" ? B.sending : B.submit, locale)}
              <ArrowUpRight size={18} />
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
