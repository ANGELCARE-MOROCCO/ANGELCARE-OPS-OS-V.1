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
import { NativeMediaVaultChooser } from "./NativeMediaVaultChooser";
import type { NativeMediaAsset } from "./native-media-vault-contract";

export type NativePickerSelection = Pick<NativeMediaAsset, "id" | "url" | "title">;
export function NativeImagePicker({
  onSelect, onSelectMany, max = 12, excludeIds = [], disabled = false,
}: {
  onSelect: (asset: NativePickerSelection) => void;
  onSelectMany?: (assets: NativePickerSelection[]) => void;
  max?: number;
  excludeIds?: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Button icon="Images" disabled={disabled} onClick={() => setOpen(true)}>
      <T v={["Choose from Media Library", "Choisir dans la médiathèque", "اختر من مكتبة الوسائط"]} />
    </Button>
    {open ? <NativeMediaVaultChooser
      max={onSelectMany ? Math.max(1, Math.min(12, max)) : 1}
      excludeIds={excludeIds}
      onClose={() => setOpen(false)}
      onConfirm={assets => {
        const values = assets.map(({id,url,title}) => ({id,url,title}));
        if (onSelectMany) onSelectMany(values);
        else if (values[0]) onSelect(values[0]);
        setOpen(false);
      }}
    /> : null}
  </>;
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
