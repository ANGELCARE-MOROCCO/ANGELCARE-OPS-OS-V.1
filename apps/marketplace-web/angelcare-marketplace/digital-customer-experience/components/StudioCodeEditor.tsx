'use client';
import {useEffect,useMemo,useRef,useState,type KeyboardEvent} from 'react';
import st from './studio-ultimate.module.css';
type Props={path:string;value:string;original:string;onChange:(value:string)=>void;onSave:()=>void;disabled?:boolean;locale:string};
function lex(text:string){
  // A lightweight, dependency-free lexical highlighter; not a language parser.
  const regex=/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[^]*?-->|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:function|const|let|var|return|import|export|default|async|await|class|extends|new|if|else|switch|case|for|while|try|catch|throw|interface|type|public|private|true|false|null|undefined)\b|#[0-9a-f]{3,8}\b|\b\d+(?:\.\d+)?\b)/gi;
  const output:{text:string;kind:string}[]=[];let last=0,match:RegExpExecArray|null;
  while((match=regex.exec(text))!==null){
    if(match.index>last)output.push({text:text.slice(last,match.index),kind:'plain'});
    const part=match[0],kind=part.startsWith('//')||part.startsWith('/*')||part.startsWith('<!--')?'comment':/^["'`]/.test(part)?'string':/^\d|^#/.test(part)?'number':'keyword';
    output.push({text:part,kind});last=match.index+part.length;
  }
  if(last<text.length)output.push({text:text.slice(last),kind:'plain'});
  return output;
}
export function StudioCodeEditor({path,value,original,onChange,onSave,disabled=false,locale}:Props){
 const input=useRef<HTMLTextAreaElement>(null),overlay=useRef<HTMLPreElement>(null),gutter=useRef<HTMLDivElement>(null);
 const [query,setQuery]=useState(''),[replacement,setReplacement]=useState(''),[caseSensitive,setCaseSensitive]=useState(false),[findOpen,setFindOpen]=useState(false),[line,setLine]=useState(1),[column,setColumn]=useState(1),[wordWrap,setWordWrap]=useState(false),[goto,setGoto]=useState('');
 const history=useRef<{back:string[];forward:string[];last:string;recorded:number}>({back:[],forward:[],last:'',recorded:0});
 useEffect(()=>{history.current={back:[],forward:[],last:value,recorded:0};setQuery('');setFindOpen(false);setLine(1);setColumn(1)},[path]);
 const T=(en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
 const dirty=value!==original;
 const tokens=useMemo(()=>lex(value),[value]);
 const lines=value.split('\n').length;
 const matches=useMemo(()=>{if(!query)return[];const text=caseSensitive?value:value.toLowerCase(),term=caseSensitive?query:query.toLowerCase();const found:number[]=[];let pos=0;while(term&&((pos=text.indexOf(term,pos))>=0)&&found.length<2000){found.push(pos);pos+=Math.max(1,term.length)}return found},[query,value,caseSensitive]);
 const diagnostic=useMemo(()=>{if(!path.endsWith('.json'))return'';try{JSON.parse(value);return''}catch(e){return (e as Error).message}},[path,value]);
 function modify(next:string,selection?:[number,number]){
  const now=Date.now(),h=history.current;
  if(next!==value){if(now-h.recorded>650||!h.back.length){h.back.push(value);if(h.back.length>75)h.back.shift();h.recorded=now}h.forward=[];onChange(next)}
  if(selection){requestAnimationFrame(()=>{const t=input.current;if(t){t.focus();t.setSelectionRange(selection[0],selection[1])}})}
 }
 function undo(){const h=history.current;if(!h.back.length)return;h.forward.push(value);onChange(h.back.pop()!);}
 function redo(){const h=history.current;if(!h.forward.length)return;h.back.push(value);onChange(h.forward.pop()!);}
 function selectionInfo(){const t=input.current;if(!t)return;const before=value.slice(0,t.selectionStart).split('\n');setLine(before.length);setColumn(before[before.length-1].length+1)}
 function keydown(e:KeyboardEvent<HTMLTextAreaElement>){
  const t=e.currentTarget,key=e.key.toLowerCase(),mod=e.metaKey||e.ctrlKey;
  if(mod&&key==='s'){e.preventDefault();if(dirty&&!disabled&&!diagnostic)onSave();return}
  if(mod&&key==='f'){e.preventDefault();setFindOpen(true);return}
  if(mod&&key==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return}
  if(mod&&key==='y'){e.preventDefault();redo();return}
  if(mod&&key==='/'){e.preventDefault();const pos=t.selectionStart,begin=value.lastIndexOf('\n',Math.max(0,pos-1))+1;const prefix=value.slice(begin).match(/^\s*/)?.[0]||'';const comment=path.endsWith('.html')?'<!-- ':'// ';modify(value.slice(0,begin+prefix.length)+comment+value.slice(begin+prefix.length),[pos+comment.length,pos+comment.length]);return}
  if(e.key==='Tab'){e.preventDefault();const a=t.selectionStart,b=t.selectionEnd;modify(value.slice(0,a)+'  '+value.slice(b),[a+2,a+2])}
 }
 function findNext(){if(!matches.length)return;const t=input.current;const here=t?.selectionEnd??0;const next=matches.find(x=>x>here)??matches[0];t?.focus();t?.setSelectionRange(next,next+query.length);selectionInfo()}
 function replaceOne(){const t=input.current;if(!t||!query)return;const start=t.selectionStart,selected=value.slice(start,t.selectionEnd);if((caseSensitive?selected:selected.toLowerCase())!==(caseSensitive?query:query.toLowerCase())){findNext();return}modify(value.slice(0,start)+replacement+value.slice(t.selectionEnd),[start,start+replacement.length])}
 function replaceAll(){if(!query||!matches.length)return;let next=value;for(let i=matches.length-1;i>=0;i--){const at=matches[i];next=next.slice(0,at)+replacement+next.slice(at+query.length)}modify(next)}
 function go(){const n=Number(goto);if(!Number.isInteger(n)||n<1)return;const rows=value.split('\n'),lineN=Math.min(rows.length,n);let off=0;for(let i=0;i<lineN-1;i++)off+=rows[i].length+1;const t=input.current;t?.focus();t?.setSelectionRange(off,off);setLine(lineN);setColumn(1)}
 return <div className={st.codeRoot}>
   <div className={st.codeToolbar}>
     <strong>{T('Source workspace','Atelier du code','محرر المصدر')}</strong>
     <span className={dirty?st.dirty:st.clean}>{dirty?T('Unsaved changes','Modifications non enregistrées','تغييرات غير محفوظة'):T('Saved source','Source enregistrée','المصدر محفوظ')}</span>
     <button type="button" onClick={undo} disabled={!history.current.back.length||disabled} title="Undo">↶</button>
     <button type="button" onClick={redo} disabled={!history.current.forward.length||disabled} title="Redo">↷</button>
     <button type="button" onClick={()=>setFindOpen(v=>!v)}>{T('Find / replace','Rechercher / remplacer','بحث / استبدال')}</button>
     <button type="button" onClick={()=>setWordWrap(v=>!v)} aria-pressed={wordWrap}>{T('Wrap','Retour ligne','التفاف')}</button>
   </div>
   {findOpen&&<div className={st.findRow}>
    <input aria-label={T('Find text','Rechercher','ابحث')} value={query} onChange={e=>setQuery(e.target.value)} placeholder={T('Find…','Rechercher…','بحث…')}/>
    <input aria-label={T('Replacement text','Remplacement','استبدال')} value={replacement} onChange={e=>setReplacement(e.target.value)} placeholder={T('Replace with…','Remplacer par…','استبدل بـ…')}/>
    <label><input type="checkbox" checked={caseSensitive} onChange={e=>setCaseSensitive(e.target.checked)}/> Aa</label>
    <button type="button" onClick={findNext} disabled={!matches.length}>{T('Next','Suivant','التالي')} ({matches.length})</button>
    <button type="button" onClick={replaceOne} disabled={disabled||!matches.length}>{T('Replace','Remplacer','استبدال')}</button>
    <button type="button" onClick={replaceAll} disabled={disabled||!matches.length}>{T('Replace all','Tout remplacer','استبدال الكل')}</button>
   </div>}
   <div className={st.codeSurface}>
    <div ref={gutter} aria-hidden="true" className={st.codeGutter}>{Array.from({length:Math.min(lines,5000)},(_,i)=><div key={i}>{i+1}</div>)}</div>
    <div className={st.codeContent}>
     <pre ref={overlay} aria-hidden="true" className={st.codeHighlight} style={{whiteSpace:wordWrap?'pre-wrap':'pre'}}>{tokens.map((token,i)=><span key={i} data-token={token.kind}>{token.text}</span>)}{'\n'}</pre>
     <textarea ref={input} aria-label={`Edit ${path}`} className={st.codeInput} value={value} onChange={e=>modify(e.target.value)} onKeyDown={keydown} onClick={selectionInfo} onKeyUp={selectionInfo} onScroll={e=>{if(overlay.current){overlay.current.scrollTop=e.currentTarget.scrollTop;overlay.current.scrollLeft=e.currentTarget.scrollLeft}if(gutter.current)gutter.current.scrollTop=e.currentTarget.scrollTop}} disabled={disabled} spellCheck={false} wrap={wordWrap?'soft':'off'}/>
    </div>
   </div>
   <div className={st.codeFooter}><span>{path.split('.').pop()?.toUpperCase()||'TEXT'} · {lines} {T('lines','lignes','أسطر')} · Ln {line}, Col {column}</span><label>{T('Go to','Ligne','السطر')} <input inputMode="numeric" aria-label="Go to line" value={goto} onChange={e=>setGoto(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')go()}}/><button type="button" onClick={go}>↵</button></label><span>{T('⌘/Ctrl+S save · ⌘/Ctrl+F find','⌘/Ctrl+S enregistrer · ⌘/Ctrl+F chercher','اختصارات الحفظ والبحث')}</span></div>
   {diagnostic&&<p role="alert" className={st.error}><strong>JSON:</strong> {diagnostic}</p>}
   <div className={st.codeActions}><button type="button" disabled={!dirty||disabled||!!diagnostic} onClick={onSave}>{T('Save as new validated revision','Enregistrer une nouvelle révision vérifiée','حفظ إصدار جديد تم التحقق منه')}</button><small>{T('Nothing is published automatically. Source revisions remain immutable.','Aucune publication automatique. Les anciennes révisions restent intactes.','لا يتم النشر تلقائيًا؛ تبقى الإصدارات السابقة دون تغيير.')}</small></div>
 </div>
}
