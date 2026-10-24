"use client";
import Link from "next/link";
import { BASE, tr, type Tri } from "../types";
import { MODULES } from "../registry";
import { useState } from "react";
import { useUI, T } from "./ui";
import p from "./production.module.css";
export function ProductionLaunchpad({ module }: { module: string }) {
  const { locale } = useUI(),
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
                "Create, prepare, review and publish through the native authorities. Your dossiers, imports, media and language editions stay connected.",
                "Créez, préparez, révisez et publiez avec les autorités natives. Dossiers, imports, médias et éditions linguistiques restent connectés.",
                "أنشئ وحضّر وراجع وانشر عبر الجهات الأصلية. تبقى الملفات والاستيراد والوسائط والنسخ اللغوية متصلة.",
              ]}
            />
          </p>
        </div>
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
