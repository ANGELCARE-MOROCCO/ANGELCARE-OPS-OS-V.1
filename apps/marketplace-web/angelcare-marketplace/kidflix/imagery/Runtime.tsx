"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type ImgHTMLAttributes,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Flame,
  Zap,
  Megaphone,
  Gift,
  Tag,
  Percent,
  Star,
  Heart,
  Crown,
  Trophy,
  BadgeCheck,
  Clock,
  Calendar,
  Bookmark,
  BookOpen,
  Download,
} from "lucide-react";
import {
  emptyConfig,
  type Config,
  type Descriptor,
  type Placement,
  type Badge,
} from "./model";
import s from "./imagery.module.css";
const icons: Record<string, any> = {
  flame: Flame,
  lightning: Zap,
  megaphone: Megaphone,
  gift: Gift,
  tag: Tag,
  percent: Percent,
  star: Star,
  heart: Heart,
  crown: Crown,
  trophy: Trophy,
  seal: BadgeCheck,
  clock: Clock,
  calendar: Calendar,
  bookmark: Bookmark,
  book: BookOpen,
  download: Download,
};
export function BadgeIcon({
  name,
  size = 16,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name] || Tag;
  return <Icon size={size} aria-hidden="true" />;
}
const Context = createContext<{
  page: string;
  config: Config;
  shared: Config;
  editing: boolean;
  selected: string;
  previewScene: string;
  register: (d: Descriptor) => void;
}>({
  page: "home",
  config: emptyConfig(),
  shared: emptyConfig(),
  editing: false,
  selected: "",
  previewScene: "",
  register: () => {},
});
export function ImageryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    query = useSearchParams(),
    page = pathname.includes("/explore/")
      ? pathname.split("/explore/")[1].split("/")[0]
      : pathname.match(/^\/kidflix\/(en|fr|ar)\/?$/)
        ? "home"
        : "other",
    preview = query.get("imageryPreview") === "1";
  const [state, setState] = useState({
      page: "",
      config: emptyConfig(),
      shared: emptyConfig(),
    }),
    [editing, setEditing] = useState(false),
    [selected, setSelected] = useState(""),
    [previewScene, setPreviewScene] = useState("");
  const slots = useRef(new Map<string, Descriptor>());
  const previewOverride = useRef(false);
  const register = useCallback(
    (d: Descriptor) => {
      slots.current.set(d.id, d);
      if (preview && window.parent !== window)
        window.parent.postMessage(
          {
            type: "kidflix-imagery-slots",
            page,
            slots: [...slots.current.values()].filter(
              (x) => x.id.startsWith(page + ".") || x.id.startsWith("shared."),
            ),
          },
          location.origin,
        );
    },
    [page, preview],
  );
  useEffect(() => {
    setEditing(false);
    setSelected("");
    const ac = new AbortController();
    fetch("/api/kidflix/imagery?page=" + encodeURIComponent(page), {
      signal: ac.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((v) => {
        if (!ac.signal.aborted && !previewOverride.current)
          setState({
            page,
            config: v.config || emptyConfig(),
            shared: v.shared || emptyConfig(),
          });
      })
      .catch(() => {});
    return () => ac.abort();
  }, [page]);
  useEffect(() => {
    if (!preview || parent === window) return;
    const receive = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== parent) return;
      const v = e.data;
      if (v?.type !== "kidflix-imagery-preview" || v.page !== page) return;
      previewOverride.current = true;
      setState({
        page,
        config: v.config || emptyConfig(),
        shared: v.shared || emptyConfig(),
      });
      setEditing(v.editing === true);
      setSelected(v.selected || "");
      setPreviewScene(v.sceneId || "");
      if (v.selected)
        requestAnimationFrame(() => {
          const target = [
            ...document.querySelectorAll<HTMLElement>("[data-imagery-slot]"),
          ].find((el) => el.dataset.imagerySlot === v.selected);
          target?.scrollIntoView({ block: "center", behavior: "auto" });
        });
    };
    addEventListener("message", receive);
    parent.postMessage(
      { type: "kidflix-imagery-ready", page },
      location.origin,
    );
    return () => removeEventListener("message", receive);
  }, [page, preview]);
  const click = (e: React.MouseEvent) => {
    if (!editing) return;
    const owned = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-imagery-record]",
    );
    if (owned) {
      e.preventDefault();
      e.stopPropagation();
      parent.postMessage(
        { type: "kidflix-imagery-owned", record: owned.dataset.imageryRecord },
        location.origin,
      );
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-imagery-slot]",
    );
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(target.dataset.imagerySlot || "");
    parent.postMessage(
      { type: "kidflix-imagery-select", page, id: target.dataset.imagerySlot },
      location.origin,
    );
  };
  return (
    <Context.Provider
      value={{
        page,
        config: state.page === page ? state.config : emptyConfig(),
        shared: state.page === page ? state.shared : emptyConfig(),
        editing,
        selected,
        previewScene,
        register,
      }}
    >
      <div
        className={s.scope}
        data-imagery-editing={editing || undefined}
        onClickCapture={click}
      >
        {children}
      </div>
    </Context.Provider>
  );
}
export function ImageScope({
  prefix,
  children,
}: {
  prefix: string;
  children: ReactNode;
}) {
  return <Prefix.Provider value={prefix}>{children}</Prefix.Provider>;
}
const Prefix = createContext("");
function BadgeLayer({
  badges,
  enabled,
}: {
  badges: Badge[];
  enabled: boolean;
}) {
  if (!enabled) return null;
  return (
    <span className={s.badges} aria-hidden="true">
      {badges
        .filter((b) => b.enabled)
        .map((b, i) => (
          <span
            key={b.id}
            className={s.badge}
            data-shape={b.shape}
            data-size={b.size}
            data-corner={b.corner}
            data-relative={b.relative || undefined}
            data-motion={b.motion}
            data-mobile-hide={b.hideMobile || undefined}
            style={
              {
                "--badge-color": b.color,
                "--badge-bg": b.background,
                "--badge-x": b.x + "px",
                "--badge-y":
                  b.y +
                  i *
                    (b.size === "medium" ? 38 : b.size === "small" ? 30 : 24) +
                  "px",
                "--badge-rotate": b.rotation + "deg",
                "--badge-speed": b.speed + "ms",
                "--badge-delay": b.delay + "ms",
                "--badge-repeat": b.loop ? "infinite" : "1",
                "--badge-intensity": b.intensity,
                opacity: b.opacity,
                border: b.border ? "1px solid currentColor" : undefined,
                boxShadow: b.shadow ? "0 2px 6px #10243a25" : undefined,
              } as CSSProperties
            }
          >
            {b.display !== "text" ? <BadgeIcon name={b.icon} /> : null}
            {b.display !== "icon" ? <span>{b.text}</span> : null}
          </span>
        ))}
    </span>
  );
}
export type ArtProps = ImgHTMLAttributes<HTMLImageElement> & {
  slot?: string;
  section?: string;
  label?: string;
  condition?: string;
  sequence?: boolean;
  kind?: "image" | "sprite";
  children?: ReactNode;
};
export function Artwork({
  slot,
  section = "Artwork",
  label,
  condition,
  sequence = false,
  kind = "image",
  children,
  ...props
}: ArtProps) {
  const ctx = useContext(Context),
    prefix = useContext(Prefix),
    key = slot?.startsWith("shared.")
      ? slot
      : slot
        ? ctx.page + "." + (prefix ? prefix + "." : "") + slot
        : "",
    config = key.startsWith("shared.") ? ctx.shared : ctx.config,
    setting = config.slots[key],
    configuredImages = (setting?.images || []).filter((i) => i.enabled),
    images =
      setting?.mode === "single"
        ? configuredImages.slice(0, 1)
        : configuredImages,
    [index, setIndex] = useState(0),
    [ready, setReady] = useState(""),
    [prior, setPrior] = useState(""),
    [failed, setFailed] = useState(false),
    [paused, setPaused] = useState(false),
    [hover, setHover] = useState(false),
    [visible, setVisible] = useState(true),
    [foreground, setForeground] = useState(true),
    [reduced, setReduced] = useState(true),
    [mobile, setMobile] = useState(false),
    root = useRef<HTMLSpanElement>(null),
    generation = useRef(0);
  const signature = JSON.stringify(images),
    image = images[index] || images[0],
    source = mobile && image?.mobile ? image.mobile : image?.src;
  useEffect(() => {
    if (key)
      ctx.register({
        id: key,
        section,
        label: label || slot || key,
        condition,
        sequence,
        source: typeof props.src === "string" ? props.src : undefined,
        owner: key.startsWith("shared.") ? "shared" : "editable",
      });
  }, [key, section, label, condition, sequence, props.src, ctx.register]);
  useEffect(() => {
    setIndex(0);
    setReady("");
    setPrior("");
    setFailed(false);
  }, [signature]);
  useEffect(() => {
    if (!key || (!setting && !ctx.editing)) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)"),
      small = matchMedia("(max-width:650px)"),
      sync = () => {
        setReduced(
          motion.matches ||
            document.documentElement.dataset.kidflixMotion === "no",
        );
        setMobile(small.matches);
      },
      fg = () => setForeground(!document.hidden);
    sync();
    fg();
    motion.addEventListener("change", sync);
    small.addEventListener("change", sync);
    document.addEventListener("visibilitychange", fg);
    const pref = new MutationObserver(sync);
    pref.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-kidflix-motion"],
    });
    return () => {
      motion.removeEventListener("change", sync);
      small.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", fg);
      pref.disconnect();
    };
  }, [!!setting, ctx.editing, key]);
  useEffect(() => {
    if (ctx.editing && ctx.selected === key && ctx.previewScene) {
      const target = images.findIndex((i) => i.id === ctx.previewScene);
      if (target >= 0) {
        setIndex(target);
        setPaused(true);
      }
    }
  }, [ctx.previewScene, ctx.selected, key, signature, ctx.editing]);
  useEffect(() => {
    if (!source) return;
    const epoch = ++generation.current,
      img = new Image();
    img.src = source;
    img
      .decode()
      .then(() => {
        if (generation.current !== epoch) return;
        setReady((old) => {
          setPrior(old);
          return source;
        });
        setFailed(false);
      })
      .catch(() => {
        if (generation.current === epoch) setFailed(true);
      });
    return () => {
      ++generation.current;
    };
  }, [source]);
  useEffect(() => {
    if (!setting && !ctx.editing) return;
    if (!root.current) return;
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [!!setting, ctx.editing]);
  useEffect(() => {
    if (
      !setting?.autoplay ||
      !sequence ||
      images.length < 2 ||
      paused ||
      hover ||
      !visible ||
      !foreground ||
      reduced ||
      !ready ||
      failed
    )
      return;
    if (index === images.length - 1 && !setting.loop) return;
    const next = (index + 1) % images.length,
      img = new Image();
    img.src =
      mobile && images[next].mobile ? images[next].mobile : images[next].src;
    const timer = setTimeout(
      () => setIndex(next),
      image?.duration || setting.interval,
    );
    return () => clearTimeout(timer);
  }, [
    setting,
    signature,
    index,
    paused,
    hover,
    visible,
    foreground,
    reduced,
    ready,
    failed,
    mobile,
    sequence,
  ]);
  useEffect(() => {
    if (!prior) return;
    const timer = setTimeout(() => setPrior(""), setting?.speed || 0);
    return () => clearTimeout(timer);
  }, [prior, setting?.speed]);
  const descriptor = {
    "data-imagery-slot": key || undefined,
    "data-imagery-configured": !!setting,

    "data-imagery-owner": key.startsWith("shared.") ? "shared" : "editable",
    "data-imagery-selected": ctx.selected === key || undefined,
  };
  if (!key || (setting === undefined && !ctx.editing)) {
    if (kind === "sprite")
      return (
        <span {...(props as any)} {...descriptor}>
          {children}
        </span>
      );
    return <img {...props} {...descriptor} />;
  }
  const badgeSet = image?.badges ?? setting?.badges ?? [],
    enabled = !!setting?.badgesEnabled;
  const point = image ? (mobile ? image.mobileFocal : image.focal) : null;
  const style = {
    ...props.style,
    "--image-width": props.width ? props.width + "px" : undefined,
    "--image-aspect":
      props.width && props.height
        ? `${props.width}/${props.height}`
        : undefined,
    "--transition-speed": (reduced ? 0 : setting?.speed || 0) + "ms",
  } as CSSProperties;
  return (
    <span
      ref={root}
      {...descriptor}
      aria-hidden={enabled ? undefined : props["aria-hidden"]}
      data-imagery-art
      data-imagery-kind={kind}
      data-transition={setting?.transition || "cut"}
      data-hidden={setting?.hidden || undefined}
      data-slow-zoom={(setting?.slowZoom && !reduced) || undefined}
      className={`${props.className || ""} ${s.art}`}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
    >
      {kind === "sprite" ? (
        <span className={s.originalSprite} style={props.style}>
          {children}
        </span>
      ) : (
        <img
          {...props}
          className={s.original}
          style={undefined}
          alt={props.alt || ""}
          aria-hidden={ready ? true : undefined}
        />
      )}
      {ready ? (
        <>
          {prior && setting?.transition !== "cut" ? (
            <img className={s.layer} src={prior} alt="" aria-hidden="true" />
          ) : null}
          <img
            key={ready}
            className={`${s.layer} ${s.current}`}
            src={ready}
            alt={image?.alt || props.alt || ""}
            style={{
              objectFit: image?.fit || "cover",
              objectPosition: point ? `${point.x}% ${point.y}%` : undefined,
              transform: `scale(${image ? (mobile ? image.mobileZoom : image.zoom) : 1})`,
            }}
          />
        </>
      ) : null}
      <BadgeLayer badges={badgeSet} enabled={enabled} />
      {enabled ? (
        <span className={s.sr}>
          {badgeSet
            .filter((b) => b.enabled)
            .map((b) => b.text || b.icon)
            .join(", ")}
        </span>
      ) : null}
      {setting?.controls && sequence && images.length > 1 ? (
        <span className={s.controls}>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(true);
              setIndex((index + images.length - 1) % images.length);
            }}
          >
            ‹
          </button>
          <span>
            {index + 1}/{images.length}
          </span>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(true);
              setIndex((index + 1) % images.length);
            }}
          >
            ›
          </button>
          <button
            type="button"
            aria-label={paused ? "Play images" : "Pause images"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(!paused);
            }}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        </span>
      ) : null}
      {failed && ctx.editing ? (
        <span className={s.error}>
          Image unavailable; current artwork retained.
        </span>
      ) : null}
      {ctx.editing ? (
        <span className={s.selectionLabel}>{label || slot}</span>
      ) : null}
    </span>
  );
}
export function HeroPlacement({
  children,
  slot = "opening.hero",
  ...props
}: ArtProps) {
  const ctx = useContext(Context),
    key = ctx.page + "." + slot;
  useEffect(() => {
    ctx.register({
      id: key,
      section: "Opening",
      label: "Main hero",
      sequence: true,
      source: typeof props.src === "string" ? props.src : undefined,
    });
  }, [key, ctx.register, props.src]);
  if (!ctx.config.slots[key] && !ctx.editing)
    return (
      <span
        data-imagery-slot={key}
        data-imagery-owner="editable"
        style={{ display: "contents" }}
      >
        {children}
      </span>
    );
  return (
    <Artwork
      {...props}
      slot={slot}
      section="Opening"
      label="Main hero"
      kind="sprite"
      sequence
    >
      {children}
    </Artwork>
  );
}
