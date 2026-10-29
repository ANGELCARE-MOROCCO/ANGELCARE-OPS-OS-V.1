"use client";
import Link from "next/link";
import { BASE, tr, type Tri } from "../types";
import { MODULES } from "../registry";
import { useState } from "react";
import { useUI, T, Button } from "./ui";
import p from "./production.module.css";
export function ProductionLaunchpad({ module }: { module: string }) {
  const { locale, create, boot } = useUI(),
    [search, setSearch] = useState("");
  return (
    <>
      <section className={p.launchpad}>
        <div>
          <span className={p.eyebrow} style={{ color: "#9bc2ff" }}>
            KIDFLIX · PRODUCTION STUDIO
          </span>
          <h2>
            <T
              v={[
                "From source to published experience",
                "De la source à l’expérience publiée",
                "من المصدر إلى التجربة المنشورة",
              ]}
            />
          </h2>
          <p>
            <T
              v={[
                "Upload, compose and publish in a category-specific workspace. Files, drafts and language editions stay connected automatically.",
                "Ajoutez, composez et publiez dans l’atelier de votre catégorie. Fichiers, brouillons et éditions linguistiques restent reliés automatiquement.",
                "ارفع وألف وانشر في ورشة الفئة. تبقى الملفات والمسودات والنسخ اللغوية مترابطة تلقائياً.",
              ]}
            />
          </p>
        </div>
        <Button kind="primary" icon="Plus" disabled={!boot.actor.rights.manage} onClick={()=>create("experience")}><T v={["Add a resource","Ajouter une ressource","إضافة مورد"]}/></Button>
        <nav
          aria-label={tr(
            [
              "Production workspaces",
              "Espaces de production",
              "مساحات الإنتاج",
            ],
            locale,
          )}
        >
          {[
            ["experiences", ["Library", "Bibliothèque", "المكتبة"]],
            [
              "imports",
              ["Import Studio", "Studio d’import", "استوديو الاستيراد"],
            ],
            ["media", ["Media", "Médias", "الوسائط"]],
            [
              "editions",
              ["Language editions", "Éditions linguistiques", "النسخ اللغوية"],
            ],
            [
              "publication",
              ["Release history", "Historique des publications", "سجل النشر"],
            ],
          ].map(([key, label]) => (
            <Link
              key={key as string}
              aria-current={module === key ? "page" : undefined}
              href={
                BASE +
                "/" +
                (key === "editions" ? "experiences?editionView=editions" : key)
              }
            >
              {tr(label as unknown as Tri, locale)}
            </Link>
          ))}
        </nav>
      </section>
      <details style={{ marginBottom: 20 }}>
        <summary>
          <T
            v={[
              "Find a specialist workspace",
              "Trouver un espace spécialisé",
              "البحث عن مساحة متخصصة",
            ]}
          />
        </summary>
        <input
          aria-label={tr(
            [
              "Search admin capabilities",
              "Rechercher les fonctions admin",
              "البحث عن قدرات الإدارة",
            ],
            locale,
          )}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr(
            [
              "Certificates, advertising, policies, production…",
              "Certificats, publicité, politiques, production…",
              "الشهادات والإعلانات والسياسات والإنتاج…",
            ],
            locale,
          )}
        />
        <div className={p.profileBar}>
          {MODULES.filter(
            (m) =>
              !search ||
              [m.key, ...m.label, ...m.description]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase()),
          ).map((m) => (
            <Link
              key={m.key}
              href={BASE + "/" + m.key}
              title={tr(m.description, locale)}
            >
              {tr(m.label, locale)}
            </Link>
          ))}
        </div>
      </details>
    </>
  );
}
