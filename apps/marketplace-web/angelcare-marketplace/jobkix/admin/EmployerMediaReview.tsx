'use client';
import { CommandForm } from '../client/CommandForm';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import type { DataRow } from '../server/repository';
import type { EditorialMedia } from '../editorial-media';
import { object } from '../validation';
import { str,number } from '../components/Public';
import { a,type AdminLocale } from '../admin-copy';
import { t,errorText } from '../i18n';
import { useCommand } from '../client/commands';
import { EditorialImagePicker } from './EditorialImagePicker';
export function EmployerMediaReview({locale,organization,evidenceId}:{locale:AdminLocale;organization:DataRow;evidenceId:string}){
 const command=useCommand('/api/jobkix/admin/commands'),router=useRouter(),[image,setImage]=useState<EditorialMedia|null>(null),[note,setNote]=useState(''),[saved,setSaved]=useState(false),approvals=Array.isArray(organization.mediaApprovals)?organization.mediaApprovals.map(object):[];
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!image||image.source!=='native'||!evidenceId)return;const result=await command.run('organization.media_review',{id:organization.id,mediaId:image.id,evidenceId,note},number(organization,'version')||0);if(result){setSaved(true);router.refresh();}}
 async function revoke(id:string){if(note.trim().length<20)return;if(await command.run('organization.media_revoke',{id:organization.id,mediaId:id,note},number(organization,'version')||0)){setSaved(true);router.refresh();}}
 return <section className={ui.stack}><h3>{a(locale,'mediaApprovalTitle')}</h3><p>{a(locale,'mediaApprovalHelp')}</p><CommandForm locale={locale} onSubmit={submit} className={ui.stack}><EditorialImagePicker locale={locale} value={image} onChange={setImage} nativeOnly/><p>{a(locale,'evidence')}: <bdi>{evidenceId||t(locale,'notDeclared')}</bdi></p><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'note')}</span><textarea className={ui.textArea} value={note} onChange={event=>setNote(event.target.value)} minLength={20} maxLength={4000} required/></label><Button type="submit" disabled={command.pending||!image||image.source!=='native'||!evidenceId}>{command.pending?t(locale,'saving'):a(locale,'approveMedia')}</Button></CommandForm><ul>{approvals.map(row=><li key={str(row,'id')}><bdi>{str(row,'id')}</bdi>{!row.revokedAt?<Button type="button" variant="secondary" onClick={()=>revoke(str(row,'id'))} disabled={command.pending||note.trim().length<20}>{a(locale,'revokeMedia')}</Button>:<span>{a(locale,'suspend')}</span>}</li>)}</ul>{saved?<p role="status">{t(locale,'saved')}</p>:null}{command.error?<p role="alert">{errorText(locale,command.error.code)}</p>:null}</section>;
}
