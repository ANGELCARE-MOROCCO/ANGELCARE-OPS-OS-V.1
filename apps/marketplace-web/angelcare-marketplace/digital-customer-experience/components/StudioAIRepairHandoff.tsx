'use client';
import {useMemo,useState} from 'react';
import st from './studio-ultimate.module.css';
type FileMeta={path:string;size:number;mime:string;sha256:string};
export function StudioAIRepairHandoff({locale,family,title,packageId,files,events,previewError,onExportSource}:{locale:string;family:string;title:string;packageId:string;files:FileMeta[];events:string[];previewError:string;onExportSource:()=>Promise<void>}){
 const [notice,setNotice]=useState('');
 const T=(en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
 const brief=useMemo(()=>[
  '# KidFlix — Interactive Experience Repair / Excellence Brief',
  '',
  `Package: ${packageId}`,
  `Atomic family: ${family}`,
  `Selected content locale: ${locale}`,
  `Experience title: ${title}`,
  '',
  '## Required AI-builder contract',
  'You are editing an existing KidFlix interactive experience. Preserve its concept, audience, content rights, atomic category, and original publisher intent.',
  'Deliver a complete revised ZIP with the same canonical KidFlix manifest contract and exactly ONE requested language edition.',
  'Use the authentic official KidFlix logo through the trusted hosting shell. Never invent a logo, watermark or authorization seal.',
  'Repair broken references, interactions and responsive behavior. Preserve all other functioning logic and layouts.',
  'Implement accessible keyboard and touch controls, meaningful states, and smooth desktop/tablet/mobile presentation.',
  'Keep all libraries, fonts, media and dependencies self-contained. Do not inject external trackers or access private user data.',
  'Do not rewrite Content 360 publishing authority. Do not invent IDs, credentials, database schemas, or evidence of deployment.',
  'Perform complete local interaction, visual, code and manifest tests; report all remaining failures rather than masking them.',
  '',
  '## Observed runtime issues',
  previewError||'No runtime issue was recorded in this session.',
  '',
  '## Recent preview events (not proof of production success)',
  ...(events.length?events.slice(-18).map(x=>'- '+x):['- No events recorded']),
  '',
  '## Actual package file inventory',
  ...files.slice(0,250).map(f=>`- ${f.path} (${f.mime}, ${f.size} bytes, SHA256 ${f.sha256.slice(0,16)}…)`),
  '',
  '## Delivery conditions',
  'Return one complete executable and import-compatible package ZIP, not only screenshots, comments, JSON, diagrams or code snippets.',
  'Keep the original package intact as a rollback source. The revised ZIP must be validated and independently previewed before native publication.',
  'When any requirement cannot be proven in the development environment, disclose it explicitly.',
  ''
 ].join('\n'),[locale,family,title,packageId,files,events,previewError]);
 function download(){const blob=new Blob([brief],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='KIDFLIX_AI_REPAIR_BRIEF_'+packageId.slice(0,8)+'.md';anchor.click();URL.revokeObjectURL(url);setNotice(T('Repair brief exported','Consignes exportées','تم تصدير التعليمات'))}
 async function copy(){try{await navigator.clipboard.writeText(brief);setNotice(T('Instructions copied','Instructions copiées','تم نسخ التعليمات'))}catch{download()}}
 return <section className={st.panel}>
   <div className={st.heading}><div><span className={st.eyebrow}>CREATIVE FACTORY · AI REPAIR HANDOFF</span><h4>{T('Give an AI builder the exact problem','Transmettre le problème exact à un agent IA','إرسال المشكلة الدقيقة إلى الذكاء الاصطناعي')}</h4><p>{T('Export the real project separately, then supply this precise repair brief. No platform credentials are included.','Exportez le projet réel séparément et joignez ces consignes ciblées. Aucun identifiant n’est inclus.','صدّر المشروع ثم أرفق تعليمات التصحيح دون بيانات اعتماد.')}</p></div></div>
   <div className={st.codeActions}>
    <button type="button" onClick={()=>void onExportSource()}>{T('Export original source ZIP','Exporter le ZIP source','تصدير ملف المصدر')}</button>
    <button type="button" onClick={download}>{T('Download AI repair brief','Télécharger le brief IA','تنزيل تعليمات التصحيح')}</button>
    <button type="button" onClick={()=>void copy()}>{T('Copy AI instructions','Copier les instructions IA','نسخ التعليمات')}</button>
   </div>
   {notice&&<p className={st.note} role="status">{notice}</p>}
 </section>;
}
