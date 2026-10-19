"use client";
import { useState } from "react";
import {
  Button,
  Dialog,
  State,
  T,
  useUI,
  useQuery,
} from "../digital-customer-experience/components/ui";
import { tr, type Locale } from "./catalogue";
import s from "../digital-customer-experience/components/workspace.module.css";
export function NativeImagePicker({
  onSelect,
}: {
  onSelect: (asset: { id: string; url: string; title: string }) => void;
}) {
  const { locale } = useUI(),
    [open, setOpen] = useState(false);
  return (
    <>
      <Button icon="Images" onClick={() => setOpen(true)}>
        <T
          v={[
            "Choose from Media Library",
            "Choisir dans la médiathèque",
            "اختر من مكتبة الوسائط",
          ]}
        />
      </Button>
      {open ? (
        <MediaChooser
          onSelect={(a) => {
            onSelect(a);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
function MediaChooser({
  onSelect,
  onClose,
}: {
  onSelect: (a: any) => void;
  onClose: () => void;
}) {
  const { locale } = useUI(),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    q = useQuery<any>(
      {
        op: "native",
        type: "media",
        mime: "image/",
        q: search,
        page,
        pageSize: 24,
      },
      { rows: [], total: 0 },
    );
  return (
    <Dialog
      wide
      title={
        <T
          v={[
            "Native images · existing vault",
            "Images natives · coffre existant",
            "الصور الأصلية · الخزنة الحالية",
          ]}
        />
      }
      onClose={onClose}
    >
      <input
        type="search"
        aria-label={tr(
          ["Search images", "Rechercher des images", "ابحث عن الصور"],
          locale,
        )}
        placeholder={tr(
          ["Search images", "Rechercher des images", "ابحث عن الصور"],
          locale,
        )}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      <State {...q} retry={q.reload}>
        <div className={s.definitionBoard}>
          {q.value.rows.map((a: any) => (
            <button
              type="button"
              className={s.rowCard}
              key={a.id}
              disabled={
                !a.url || (a.expiresAt && Date.parse(a.expiresAt) <= Date.now())
              }
              onClick={() => onSelect(a)}
            >
              <img
                src={a.url}
                alt=""
                style={{ width: "100%", height: 110, objectFit: "contain" }}
              />
              <strong>{a.title}</strong>
            </button>
          ))}
        </div>
        <div className={s.actions}>
          <Button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
            <T v={["Previous", "Précédent", "السابق"]} />
          </Button>
          <span>
            {page} / {Math.max(1, Math.ceil(q.value.total / 24))}
          </span>
          <Button
            disabled={page * 24 >= q.value.total}
            onClick={() => setPage((v) => v + 1)}
          >
            <T v={["Next", "Suivant", "التالي"]} />
          </Button>
        </div>
      </State>
    </Dialog>
  );
}
export function FeaturedResourcePicker({
  language,
  family,
  selected,
  onChange,
}: {
  language: Locale;
  family?:string;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const { locale } = useUI(),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    q = useQuery<any>(
      { op: "depth_discovery", locale: language, family, q: search, page },
      { rows: [], total: 0 },
    );
  return (
    <div>
      <input
        type="search"
        aria-label={tr(
          [
            "Find a published resource",
            "Trouver une ressource publiée",
            "ابحث عن مورد منشور",
          ],
          locale,
        )}
        placeholder={tr(
          [
            "Find a published resource",
            "Trouver une ressource publiée",
            "ابحث عن مورد منشور",
          ],
          locale,
        )}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      {family && selected.length ? <SelectedResources family={family} language={language} selected={selected} onChange={onChange}/> : null}
      <State {...q} retry={q.reload}>
        <div className={s.modePills}>
          {q.value.rows.map((r: any) => (
            <button
              type="button"
              key={r.id}
              aria-pressed={selected.includes(r.key)}
              className={s.button}
              onClick={() =>
                onChange(
                  selected.includes(r.key)
                    ? selected.filter((k) => k !== r.key)
                    : [...selected, r.key],
                )
              }
            >
              {selected.includes(r.key) ? "✓ " : ""}
              {r.title}
            </button>
          ))}
        </div>
        <div className={s.actions}>
          <Button disabled={page === 1} onClick={() => setPage((v) => v - 1)}>
            ←
          </Button>
          <span>
            {selected.length}{" "}
            {tr(["selected", "sélectionnées", "مختارة"], locale)} · {page}/
            {Math.max(1, Math.ceil(q.value.total / 30))}
          </span>
          <Button
            disabled={page * 30 >= q.value.total}
            onClick={() => setPage((v) => v + 1)}
          >
            →
          </Button>
        </div>
      </State>
    </div>
  );
}

function SelectedResources({family,language,selected,onChange}:{family:string;language:Locale;selected:string[];onChange:(keys:string[])=>void}){
 const{locale}=useUI(),q=useQuery<any>({op:'kidflix_storefront_selection',family,locale:language,keys:selected.join(',')},{rows:[]});
 return <State {...q} retry={q.reload}><div className={s.helpList}>{q.value.rows.map((r:any,i:number)=><div className={s.rowCard} key={r.key}><strong>{i+1}. {r.title}</strong>{!r.available?<p className={s.subtitle}>{tr(['Not currently published in this language','Non publié actuellement dans cette langue','غير منشور حالياً بهذه اللغة'],locale)}</p>:null}<div className={s.actions}>{[-1,1].map(delta=><Button key={delta} disabled={i+delta<0||i+delta>=selected.length} icon={delta<0?'ArrowUp':'ArrowDown'} ariaLabel={tr(delta<0?['Move up','Monter','للأعلى']:['Move down','Descendre','للأسفل'],locale)+' · '+r.title} onClick={()=>{const a=[...selected];[a[i],a[i+delta]]=[a[i+delta],a[i]];onChange(a);}}>{null}</Button>)}<Button icon="X" ariaLabel={tr(['Remove','Retirer','أزل'],locale)+' · '+r.title} onClick={()=>onChange(selected.filter(k=>k!==r.key))}>{tr(['Remove','Retirer','أزل'],locale)}</Button></div></div>)}</div></State>;
}
