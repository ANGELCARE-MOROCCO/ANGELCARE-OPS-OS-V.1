"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Minus,
  Plus,
  Scan,
  RotateCcw,
  Maximize2,
  GripVertical,
  ArrowUpRight,
} from "lucide-react";
import { tr, type Locale } from "../types";
import { LANGUAGES, type Metrics, type Selection } from "./model";
import s from "./inventory.module.css";
export type MapNode = {
  id: string;
  parent?: string;
  label: string;
  subtitle: string;
  color: string;
  selection: Selection;
  metrics: Metrics;
  x: number;
  y: number;
  family: boolean;
};
type Point = { x: number; y: number };
const labels = {
  empty: ["Empty", "Vide", "فارغ"],
  pipeline: ["Authoring only", "Rédaction seule", "تحرير فقط"],
  thin: ["Below target", "Sous l’objectif", "دون الهدف"],
  healthy: ["Targets met", "Objectifs atteints", "الأهداف محققة"],
  populated: ["Published", "Publié", "منشور"],
} as const;
export function Status({
  value,
  locale,
}: {
  value: Metrics["status"];
  locale: Locale;
}) {
  return (
    <span className={s.status} data-status={value}>
      {tr(labels[value], locale)}
    </span>
  );
}
export function InventoryCanvas({
  nodes,
  selected,
  onSelect,
  locale,
  storageKey,
}: {
  nodes: MapNode[];
  selected: string;
  onSelect: (value: Selection) => void;
  locale: Locale;
  storageKey: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    wrapper = useRef<HTMLDivElement>(null),
    drag = useRef<{
      id?: string;
      start: Point;
      origin: Point;
      scale: number;
      moving: boolean;
    } | null>(null);
  const [positions, setPositions] = useState<Record<string, Point>>({}),
    [view, setView] = useState({ x: 22, y: 20, scale: 0.78 }),
    [size, setSize] = useState({ width: 850, height: 650 }),
    [notice, setNotice] = useState("");
  const L = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale);
  const point = (n: MapNode) => positions[n.id] || { x: n.x, y: n.y };
  const bounds = {
    width: Math.max(1100, ...nodes.map((n) => point(n).x + 310)),
    height: Math.max(600, ...nodes.map((n) => point(n).y + 210)),
  };
  useEffect(() => {
    setPositions({});
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (
        raw?.version === 1 &&
        raw.positions &&
        typeof raw.positions === "object"
      ) {
        const next: Record<string, Point> = {};
        for (const [key, v] of Object.entries(raw.positions) as [
          string,
          any,
        ][]) {
          if (
            Number.isFinite(v.x) &&
            Number.isFinite(v.y) &&
            Math.abs(v.x) < 50000 &&
            Math.abs(v.y) < 50000
          )
            next[key] = { x: v.x, y: v.y };
        }
        setPositions(next);
      }
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    if (!host.current) return;
    const ro = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height }),
    );
    ro.observe(host.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = node.getBoundingClientRect(),
        x = e.clientX - rect.left,
        y = e.clientY - rect.top,
        factor = Math.exp(-e.deltaY * 0.002);
      setView((v) => {
        const scale = Math.max(0.12, Math.min(1.8, v.scale * factor)),
          ratio = scale / v.scale;
        return { scale, x: x - (x - v.x) * ratio, y: y - (y - v.y) * ratio };
      });
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, []);
  const save = (next: Record<string, Point>) => {
    setPositions(next);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 1, positions: next }),
      );
    } catch {
      setNotice(
        L(
          "Layout recovery is unavailable in this browser.",
          "La reprise de disposition est indisponible.",
          "استعادة التخطيط غير متاحة في هذا المتصفح.",
        ),
      );
    }
  };
  const fit = useCallback(() => {
    if (!nodes.length) return;
    const pts = nodes.map((n) => ({ ...n, ...(positions[n.id] || {}) })),
      left = Math.min(...pts.map((n) => n.x)),
      top = Math.min(...pts.map((n) => n.y)),
      width = Math.max(...pts.map((n) => n.x + 294)) - left,
      height = Math.max(...pts.map((n) => n.y + 190)) - top;
    const scale = Math.max(
      0.12,
      Math.min(1, (size.width - 48) / width, (size.height - 48) / height),
    );
    setView({
      x: (size.width - width * scale) / 2 - left * scale,
      y: (size.height - height * scale) / 2 - top * scale,
      scale,
    });
  }, [nodes, positions, size]);
  useEffect(() => {
    setView({ x: 22, y: 20, scale: nodes.length > 10 ? 0.58 : 0.7 });
  }, [nodes.map((n) => n.id).join("|")]);
  function zoom(
    factor: number,
    center: Point = { x: size.width / 2, y: size.height / 2 },
  ) {
    setView((v) => {
      const scale = Math.max(0.12, Math.min(1.8, v.scale * factor)),
        ratio = scale / v.scale;
      return {
        scale,
        x: center.x - (center.x - v.x) * ratio,
        y: center.y - (center.y - v.y) * ratio,
      };
    });
  }
  function start(e: React.PointerEvent, id?: string) {
    if (
      e.button !== 0 ||
      (!id && (e.target as HTMLElement).closest("button,a,input,select"))
    )
      return;
    const n = nodes.find((n) => n.id === id);
    drag.current = {
      id,
      start: { x: e.clientX, y: e.clientY },
      origin: n ? point(n) : { x: view.x, y: view.y },
      scale: view.scale,
      moving: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.start.x,
      dy = e.clientY - d.start.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moving = true;
    if (d.id)
      setPositions((p) => ({
        ...p,
        [d.id!]: {
          x: Math.max(0, d.origin.x + dx / d.scale),
          y: Math.max(0, d.origin.y + dy / d.scale),
        },
      }));
    else setView((v) => ({ ...v, x: d.origin.x + dx, y: d.origin.y + dy }));
  }
  function end() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.id) save(positions);
  }
  const graphid = nodes.map((n) => n.id).join("|");
  return (
    <section
      className={s.map}
      ref={wrapper}
      aria-label={L(
        "Interactive inventory map",
        "Carte interactive des stocks",
        "خريطة المخزون التفاعلية",
      )}
    >
      <div className={s.mapTools}>
        <div>
          <strong>
            {L("Inventory landscape", "Carte des ressources", "خريطة الموارد")}
          </strong>
          <small>
            {nodes.length} {L("visible nodes", "nœuds visibles", "عقد ظاهرة")}
          </small>
        </div>
        <div>
          <button
            type="button"
            aria-label={L("Zoom out", "Réduire", "تصغير")}
            onClick={() => zoom(1 / 1.2)}
          >
            <Minus size={16} />
          </button>
          <output>{Math.round(view.scale * 100)}%</output>
          <button
            type="button"
            aria-label={L("Zoom in", "Agrandir", "تكبير")}
            onClick={() => zoom(1.2)}
          >
            <Plus size={16} />
          </button>
          <button type="button" onClick={fit}>
            <Scan size={15} />
            {L("Fit", "Ajuster", "ملاءمة")}
          </button>
          <button
            type="button"
            aria-label={L(
              "Reset personal layout",
              "Réinitialiser la disposition",
              "إعادة ضبط التخطيط",
            )}
            onClick={() => {
              save({});
              setView({ x: 22, y: 20, scale: 0.7 });
            }}
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            aria-label={L("Full screen map", "Carte plein écran", "ملء الشاشة")}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void wrapper.current
                  ?.requestFullscreen()
                  .catch(() =>
                    setNotice(
                      L(
                        "Full screen is unavailable.",
                        "Plein écran indisponible.",
                        "ملء الشاشة غير متاح.",
                      ),
                    ),
                  );
            }}
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>
      <div
        ref={host}
        className={s.viewport}
        tabIndex={0}
        role="region"
        aria-label={L(
          "Pan the map; use controls to zoom",
          "Déplacer la carte ; utiliser les commandes de zoom",
          "تحريك الخريطة واستخدام أزرار التكبير",
        )}
        onPointerDown={(e) => start(e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
          ) {
            e.preventDefault();
            setView((v) => ({
              ...v,
              x:
                v.x +
                (e.key === "ArrowLeft" ? 45 : e.key === "ArrowRight" ? -45 : 0),
              y:
                v.y +
                (e.key === "ArrowUp" ? 45 : e.key === "ArrowDown" ? -45 : 0),
            }));
          }
          if (e.key === "+" || e.key === "=") zoom(1.2);
          if (e.key === "-") zoom(1 / 1.2);
          if (e.key === "0") fit();
        }}
      >
        <div
          className={s.world}
          data-graph={graphid}
          style={{
            width: bounds.width,
            height: bounds.height,
            transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
          }}
        >
          <svg
            width={bounds.width}
            height={bounds.height}
            className={s.edges}
            aria-hidden="true"
          >
            {nodes.map((n) => {
              const parent = nodes.find((p) => p.id === n.parent);
              if (!parent) return null;
              const a = point(parent),
                b = point(n),
                x = a.x + 294,
                y = a.y + 86;
              return (
                <path
                  key={n.id}
                  d={`M${x},${y} C${x + 75},${y} ${b.x - 75},${b.y + 86} ${b.x},${b.y + 86}`}
                />
              );
            })}
          </svg>
          {nodes.map((n) => (
            <article
              key={n.id}
              data-node={n.id}
              className={s.mapCard}
              data-selected={selected === n.id || undefined}
              data-family={n.family || undefined}
              style={
                {
                  left: point(n).x,
                  top: point(n).y,
                  "--node-color": n.color,
                } as CSSProperties
              }
            >
              <div className={s.cardTop}>
                <span>{n.subtitle}</span>
                <button
                  type="button"
                  className={s.drag}
                  aria-label={L(
                    "Move " + n.label,
                    "Déplacer " + n.label,
                    "تحريك " + n.label,
                  )}
                  title={L(
                    "Drag, or use arrow keys",
                    "Glisser ou utiliser les flèches",
                    "اسحب أو استخدم الأسهم",
                  )}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    start(e, n.id);
                  }}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  onKeyDown={(e) => {
                    if (
                      ![
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(e.key)
                    )
                      return;
                    e.preventDefault();
                    e.stopPropagation();
                    const p = point(n),
                      step = e.shiftKey ? 32 : 8;
                    save({
                      ...positions,
                      [n.id]: {
                        x: Math.max(
                          0,
                          p.x +
                            (e.key === "ArrowRight"
                              ? step
                              : e.key === "ArrowLeft"
                                ? -step
                                : 0),
                        ),
                        y: Math.max(
                          0,
                          p.y +
                            (e.key === "ArrowDown"
                              ? step
                              : e.key === "ArrowUp"
                                ? -step
                                : 0),
                        ),
                      },
                    });
                  }}
                >
                  <GripVertical size={17} />
                </button>
              </div>
              <button
                type="button"
                className={s.nodeOpen}
                onClick={() => onSelect(n.selection)}
              >
                <strong>{n.label}</strong>
                <ArrowUpRight size={17} />
              </button>
              <Status value={n.metrics.status} locale={locale} />
              <div className={s.nodeCounts}>
                <div>
                  <b>{n.metrics.authored}</b>
                  <small>{L("dossiers", "dossiers", "ملفات")}</small>
                </div>
                <div>
                  <b>{n.metrics.published}</b>
                  <small>{L("published", "publiés", "منشور")}</small>
                </div>
                <div>
                  <b>{n.metrics.drafts}</b>
                  <small>
                    {L("in authoring", "en rédaction", "قيد التحرير")}
                  </small>
                </div>
              </div>
              <div className={s.nodeLanguages}>
                {LANGUAGES.map((l) => (
                  <span
                    key={l}
                    data-covered={
                      n.metrics.languages[l].published > 0 || undefined
                    }
                  >
                    {l.toUpperCase()}
                    <b>{n.metrics.languages[l].published}</b>
                  </span>
                ))}
                {n.metrics.gap > 0 ? <em>−{n.metrics.gap}</em> : null}
              </div>
            </article>
          ))}
        </div>
        <div className={s.minimap} aria-hidden="true">
          <svg viewBox={`0 0 ${bounds.width} ${bounds.height}`}>
            {nodes.map((n) => (
              <rect
                key={n.id}
                x={point(n).x}
                y={point(n).y}
                width="294"
                height="180"
                fill={n.id === selected ? "#0b7285" : n.color}
                opacity=".65"
              />
            ))}
            <rect
              x={-view.x / view.scale}
              y={-view.y / view.scale}
              width={size.width / view.scale}
              height={size.height / view.scale}
              fill="none"
              stroke="#172b4d"
              strokeWidth="14"
            />
          </svg>
        </div>
      </div>
      <div className={s.mapFoot}>
        <span>
          {L(
            "Drag canvas to pan · move cards with their handles · Ctrl/⌘ + wheel to zoom",
            "Glisser le fond pour déplacer · poignées pour les cartes · Ctrl/⌘ + molette pour zoomer",
            "اسحب الخلفية للتحريك والمقابض لنقل البطاقات · Ctrl/⌘ مع العجلة للتكبير",
          )}
        </span>
        <small>
          {L(
            "Personal arrangement on this browser",
            "Disposition personnelle sur ce navigateur",
            "ترتيب شخصي في هذا المتصفح",
          )}
        </small>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
    </section>
  );
}
