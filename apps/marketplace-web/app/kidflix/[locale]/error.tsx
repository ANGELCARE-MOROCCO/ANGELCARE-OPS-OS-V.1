"use client";
import {useEffect}from "react";
import {failKidFlixNavigation}from "@/angelcare-marketplace/kidflix/navigation-events";
import { useParams } from "next/navigation";
import { isLocale } from "@/angelcare-marketplace/kidflix/catalogue";
import { copy } from "@/angelcare-marketplace/kidflix/copy";
import s from "@/angelcare-marketplace/kidflix/kidflix.module.css";
export default function ErrorPage({ reset }: { reset: () => void }) {
  useEffect(()=>failKidFlixNavigation(),[]);
  const p = useParams(),
    locale =
      typeof p.locale === "string" && isLocale(p.locale) ? p.locale : "en";
  return (
    <div className={s.routeFeedback} role="alert">
      <strong>KidFlix</strong>
      <h1>{copy("error", locale)}</h1>
      <button className={s.primary} onClick={reset}>
        {copy("retry", locale)}
      </button>
    </div>
  );
}
