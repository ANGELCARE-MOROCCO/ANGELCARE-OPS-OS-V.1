"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MODULES } from "../registry";
import { BASE, tr, type DceRecord } from "../types";
import { Badge, Button, Empty, Panel, State, T, useQuery, useUI } from "./ui";
import s from "./workspace.module.css";
export function DossierConnections({
  id,
  beforeNavigate,
}: {
  id: string;
  beforeNavigate?: () => boolean;
}) {
  const { open, preview, boot, locale } = useUI(),
    q = useQuery<any>(
      { op: "connections", id },
      {
        record: null,
        rows: [],
        media: [],
        offers: [],
        translations: {},
        releaseCounts: {},
      },
    );
  const r = q.value.record as DceRecord | undefined;
  return (
    <State {...q} retry={q.reload}>
      {r && (
        <>
          <div className={s.actions}>
            <Button
              icon="Pencil"
              onClick={() => {
                if (!beforeNavigate || beforeNavigate()) open(id);
              }}
            >
              <T v={["Open source", "Ouvrir la source", "فتح المصدر"]} />
            </Button>
            <Button
              icon="Eye"
              onClick={() => {
                if (!beforeNavigate || beforeNavigate()) preview(id);
              }}
            >
              <T
                v={[
                  "Preview exact dossier",
                  "Prévisualiser ce dossier",
                  "معاينة هذا الملف",
                ]}
              />
            </Button>
          </div>
          <div className={s.metricGrid} style={{ marginTop: 16 }}>
            {Object.entries(q.value.translations).map(
              ([l, v]: [string, any]) => (
                <Panel key={l}>
                  <Badge tone={v.complete ? "green" : "orange"}>
                    {l.toUpperCase()} · {v.filled}/{v.total}
                  </Badge>
                  <p>{v.missing.length ? v.missing.join(" · ") : "✓"}</p>
                </Panel>
              ),
            )}
          </div>
          <div className={s.helpList}>
            {q.value.rows.map((v: any) => (
              <div className={s.rowCard} key={v.id + v.relation}>
                <Badge>{v.relation}</Badge>
                <Button
                  onClick={() => {
                    if (!beforeNavigate || beforeNavigate()) open(v.id);
                  }}
                >
                  {v.title}
                </Button>
                <small>
                  {v.kind} · r{v.revision} · {v.lifecycle}
                </small>
              </div>
            ))}
          </div>
          {!q.value.rows.length && (
            <Empty
              title={
                <T
                  v={[
                    "No linked dossiers yet",
                    "Aucun dossier lié",
                    "لا توجد ملفات مرتبطة بعد",
                  ]}
                />
              }
            />
          )}
          <div className={s.modePills}>
            <Badge>
              {q.value.media.length}{" "}
              <T
                v={[
                  "native media bindings",
                  "liens média natifs",
                  "روابط وسائط أصلية",
                ]}
              />
            </Badge>
            <Badge>
              {q.value.offers.length}{" "}
              <T v={["native offers", "offres natives", "عروض أصلية"]} />
            </Badge>
            {Object.entries(q.value.releaseCounts).map(([state, n]) => (
              <Badge key={state}>
                {state}: {Number(n)}
              </Badge>
            ))}
          </div>
          <h3>
            <T
              v={[
                "Continue with this dossier",
                "Continuer avec ce dossier",
                "المتابعة مع هذا الملف",
              ]}
            />
          </h3>
          <div className={s.actions}>
            {[
              ["media", "production", ["Production", "Production", "الإنتاج"]],
              [
                "publication",
                "team",
                ["Team review", "Revue d’équipe", "مراجعة الفريق"],
              ],
              [
                "performance",
                "strategy",
                ["Analyse journey", "Analyser le parcours", "تحليل المسار"],
              ],
            ].map(([module, workspace, label]) => (
              <Link
                key={String(workspace)}
                className={s.button}
                href={
                  BASE +
                  "/" +
                  module +
                  "?context=" +
                  id +
                  "&workspace=" +
                  workspace
                }
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (beforeNavigate && !beforeNavigate()) e.preventDefault();
                }}
              >
                {tr(label as any, locale)}
              </Link>
            ))}
            {[
              "experiences",
              "content",
              "media",
              "templates",
              "journeys",
              "publication",
              "access",
              "performance",
              "reports",
              "imports",
              "logs",
              ...(boot.actor.rights.moderate ? ["messages"] : []),
              ...(boot.actor.rights.monetize ? ["adsense"] : []),
            ].map((module) => (
              <Link
                className={s.button}
                key={module}
                href={BASE + "/" + module + "?context=" + id}
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  if (beforeNavigate && !beforeNavigate()) e.preventDefault();
                }}
              >
                {MODULES.find((m) => m.key === module)
                  ? tr(MODULES.find((m) => m.key === module)!.label, locale)
                  : module}
              </Link>
            ))}
          </div>
        </>
      )}
    </State>
  );
}
export function WorkspaceDossierContext() {
  const id = useSearchParams()?.get("context") || "",
    { open } = useUI(),
    q = useQuery<DceRecord | null>({ op: "record", id }, null);
  return (
    <Panel
      title={<T v={["Working dossier", "Dossier en cours", "ملف العمل"]} />}
    >
      <State {...q} retry={q.reload}>
        {q.value && (
          <div className={s.actions}>
            <strong>{q.value.title}</strong>
            <Badge>r{q.value.revision}</Badge>
            <Button icon="GitBranch" onClick={() => open(id, "connections")}>
              <T
                v={["Open connections", "Ouvrir les connexions", "فتح الروابط"]}
              />
            </Button>
            <Link className={s.button} href={BASE + "/experiences"}>
              <T
                v={[
                  "Clear dossier context",
                  "Quitter ce contexte",
                  "مسح سياق الملف",
                ]}
              />
            </Link>
          </div>
        )}
      </State>
    </Panel>
  );
}
