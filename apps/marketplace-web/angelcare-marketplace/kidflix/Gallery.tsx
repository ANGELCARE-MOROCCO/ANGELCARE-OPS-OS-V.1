"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Locale } from "./catalogue";
import type { Scene } from "./gallery-contract";
import s from "./gallery.module.css";
type Display = { scene: Scene; src: string; mobile: boolean; serial: number };
async function decoded(src: string): Promise<string> {
  const image = new Image(); image.decoding = "async"; image.src = src;
  await image.decode();
  if (!image.naturalWidth) throw Error("IMAGE_UNAVAILABLE");
  return src;
}
export function Gallery({ scenes, locale, label = "KidFlix" }: { scenes: Scene[]; locale: Locale; label?: string }) {
  const root = useRef<HTMLDivElement>(null), generation = useRef(0), request = useRef(0), serial = useRef(0), ready = useRef(new Map<string,Promise<string>>());
  const [view,setView]=useState<{current:Display|null;previous:Display|null;index:number}>({current:null,previous:null,index:0});
  const {current,previous,index}=view;
  const [paused,setPaused] = useState(false), [hover,setHover] = useState(false), [focus,setFocus] = useState(false), [visible,setVisible] = useState(false), [foreground,setForeground] = useState(true), [mobile,setMobile] = useState(false), [reduced,setReduced] = useState(true), [failure,setFailure] = useState(false);
  const signature = JSON.stringify(scenes), autoplay = useRef(false);
  useEffect(() => {
    const media = matchMedia("(max-width:650px)"), motion = matchMedia("(prefers-reduced-motion:reduce)");
    const change = () => { setMobile(media.matches); setReduced(motion.matches); };
    const visibility = () => setForeground(!document.hidden);
    change(); visibility(); media.addEventListener("change",change); motion.addEventListener("change",change); document.addEventListener("visibilitychange",visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); media.removeEventListener("change",change); motion.removeEventListener("change",change); document.removeEventListener("visibilitychange",visibility); };
  }, []);
  const load = useCallback(async (scene: Scene) => {
    const loadURL = (url: string) => {
      if (!ready.current.has(url)) ready.current.set(url,decoded(url).catch(error => { ready.current.delete(url); throw error; }));
      return ready.current.get(url)!;
    };
    if (mobile && scene.mobile) {
      try { return { src: await loadURL(scene.mobile), mobile: true }; } catch { /* The desktop scene is the native fallback. */ }
    }
    return { src: await loadURL(scene.desktop), mobile: false };
  }, [mobile]);
  const show = useCallback(async (target: number, automatic = false) => {
    const scene = scenes[target]; if (!scene) return;
    const token = ++request.current, epoch = generation.current;
    try {
      const image = await load(scene);
      if (token !== request.current || epoch !== generation.current || (automatic && !autoplay.current)) return;
      const display = { scene, ...image, serial: ++serial.current };
      setView(old=>({current:display,previous:old.current,index:target})); setFailure(false);
    } catch { if (token === request.current && epoch === generation.current) setFailure(true); }
  }, [signature, load]);
  useEffect(() => {
    ++generation.current; ++request.current;
    void show(0);
    return () => { ++generation.current; ++request.current; };
  }, [show]);
  const active = visible && foreground && !paused && !hover && !focus && !reduced;
  autoplay.current = active;
  useEffect(() => {
    if (!active || !current || scenes.length < 2) return;
    // Preload only this gallery's next image. At the deadline show() waits for decoding.
    const next = (index + 1) % scenes.length;
    void load(scenes[next]).catch(() => {});
    const timer = setTimeout(() => { void show(next, true); }, 3000);
    return () => { clearTimeout(timer); };
  }, [active,current,index,show,load,signature]);
  function manual(target: number) { setPaused(true); void show((target + scenes.length) % scenes.length); }
  function layer(display: Display, old = false) {
    const point = display.mobile ? display.scene.mobileFocal : display.scene.focal;
    return <figure key={display.serial} className={s.scene} aria-hidden={old || undefined} style={old ? { animation: "none", zIndex: 0 } : { zIndex: 1 }} onAnimationEnd={old ? undefined : () => setView(old=>({...old,previous:null}))}><img src={display.src} alt={old ? "" : display.scene.descriptions[locale]} width={1600} height={1000} style={{objectPosition:`${point.x}% ${point.y}%`}} fetchPriority="high" /></figure>;
  }
  return <div ref={root} className={s.gallery} role="region" aria-roledescription={tr(["image gallery","galerie d’images","معرض صور"],locale)} aria-label={label} data-gallery data-gallery-index={index} data-gallery-running={active} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();manual(index+(e.key==="ArrowRight"?1:-1)*(locale==="ar"?-1:1));}}}>
    {previous ? layer(previous,true) : null}{current ? layer(current) : !failure ? <div className={s.loading}>{tr(["Opening a world of wonder…","Un monde s’ouvre…","نفتح عالماً من الدهشة…"],locale)}</div> : null}
    {failure ? <div className={s.error}>{tr(current?["This scene could not load. Your current view is preserved.","Cette image est indisponible. Votre vue actuelle est conservée.","تعذر تحميل هذا المشهد. تم الاحتفاظ بالصورة الحالية."]:["This scene could not load. Choose another scene or retry.","Cette image est indisponible. Choisissez une autre image ou réessayez.","تعذر تحميل هذا المشهد. اختر مشهداً آخر أو حاول مجدداً."],locale)} <button onClick={()=>void show(current?((index+1)%scenes.length):index)}>{tr(["Retry","Réessayer","حاول مجدداً"],locale)}</button></div> : null}
    <div className={s.controls}>
      <button type="button" aria-label={tr(["Previous scene","Image précédente","المشهد السابق"],locale)} onClick={()=>manual(index-1)}>‹</button>
      {scenes.map((scene,i)=><button type="button" className={s.number} key={scene.id} aria-label={tr(["Show scene ","Afficher l’image ","اعرض المشهد "],locale)+(i+1)} aria-current={index===i?"true":undefined} onClick={()=>manual(i)}>{i+1}</button>)}
      <button type="button" aria-label={tr(["Next scene","Image suivante","المشهد التالي"],locale)} onClick={()=>manual(index+1)}>›</button>
      <button type="button" aria-pressed={paused || reduced} aria-label={tr(paused || reduced?["Resume gallery","Reprendre le diaporama","استئناف المعرض"]:["Pause gallery","Mettre en pause","إيقاف المعرض"],locale)} onClick={()=>{setPaused(v=>!v);if(reduced)setReduced(false);}}>{paused||reduced?"▶":"Ⅱ"}</button>
    </div>
  </div>;
}
