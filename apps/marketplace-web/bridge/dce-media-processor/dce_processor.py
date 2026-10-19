#!/usr/bin/env python3
"""AngelCare DCE media processor. Explicit activation; no services/configuration are installed.
Uses signed existing Marketplace storage. Originals are never written to. Python 3.10+.
"""
from __future__ import annotations
import argparse, hashlib, importlib.util, json, os, pathlib, shutil, signal, subprocess, sys, tempfile, threading, time, urllib.request, urllib.error, urllib.parse, uuid
VERSION='ANGELCARE_DCE_PROCESSOR_R4.1'
LANG={'fr':'fra','en':'eng','ar':'ara','fra':'fra','eng':'eng','ara':'ara'}
class ProcessingError(Exception): pass
class Cancelled(ProcessingError): pass

def digest(path):
 h=hashlib.sha256()
 with open(path,'rb')as f:
  for data in iter(lambda:f.read(1024*1024),b''): h.update(data)
 return h.hexdigest()

def tools_available(model_dir):
 tools=[];versions={}
 for name in ['ffmpeg','ffprobe','pdftoppm','pdftotext','pdfinfo','pdfseparate','pdfunite','tesseract','libreoffice']:
  executable=shutil.which(name)or(shutil.which('soffice')if name=='libreoffice'else None)
  if not executable:continue
  try:
   command=[executable,'-version'if name in('ffmpeg','ffprobe')else'--version'if name in('tesseract','libreoffice')else'-v']
   done=subprocess.run(command,capture_output=True,timeout=15,text=True)
   version=(done.stdout or done.stderr).splitlines()[0][:120]
   tools.append(name);versions[name]=version
   if name=='tesseract':
    langs=subprocess.run([executable,'--list-langs'],capture_output=True,timeout=15,text=True).stdout.splitlines()[1:]
    for language in ('fra','eng','ara'):
     if language in langs:tools.append('tesseract:'+language)
  except (OSError,subprocess.SubprocessError):pass
 model=pathlib.Path(model_dir)/'small.pt'
 if importlib.util.find_spec('whisper')and model.is_file():
  # Whisper verifies the official SHA-256 before loading; network download is never automatic here.
  try:
   import whisper
   expected=whisper._MODELS['small'].split('/')[-2]
   if digest(model)==expected:tools.append('whisper');versions['whisper']='small model verified · '+getattr(whisper,'__version__','installed')
  except Exception:pass
 return tools,versions

class Client:
 def __init__(self,origin,token,worker):
  parsed=urllib.parse.urlparse(origin)
  if parsed.scheme not in('https','http')or parsed.username or parsed.password or(parsed.scheme=='http'and parsed.hostname not in('127.0.0.1','localhost')):raise ProcessingError('Use HTTPS for the Marketplace endpoint.')
  self.url=origin.rstrip('/')+'/api/angelcare-marketplace/admin/digital-customer-experience/processor';self.token=token;self.worker=worker
 def call(self,action,**body):
  data=json.dumps(dict(action=action,worker=self.worker,**body),ensure_ascii=False).encode()
  req=urllib.request.Request(self.url,data=data,headers={'Content-Type':'application/json','Authorization':'Bearer '+self.token})
  try:
   with urllib.request.urlopen(req,timeout=45)as response:out=json.load(response)
  except urllib.error.HTTPError as e:
   # Do not print response bodies that could contain signed delivery URLs.
   raise ProcessingError('API_HTTP_'+str(e.code))from None
  if 'data'not in out:raise ProcessingError('API_RESPONSE_INVALID')
  return out['data']

class Processor:
 def __init__(self,client,work_dir,model_dir,timeout=900):
  self.client=client;self.work_dir=pathlib.Path(work_dir);self.model_dir=pathlib.Path(model_dir);self.timeout=timeout;self.cancel=threading.Event();self.stop=threading.Event();self.stage='idle';self.progress=0;self.job=None;self.proc=None
 def command(self,args,cwd):
  if self.cancel.is_set():raise Cancelled('JOB_CANCELLED')
  with tempfile.TemporaryFile()as output:
   self.proc=subprocess.Popen([str(v)for v in args],cwd=cwd,stdout=output,stderr=output,start_new_session=os.name!='nt')
   started=time.monotonic()
   while self.proc.poll()is None:
    if self.cancel.wait(.2)or time.monotonic()-started>self.timeout:
     if os.name!='nt':os.killpg(self.proc.pid,signal.SIGTERM)
     else:self.proc.terminate()
     try:self.proc.wait(timeout=5)
     except subprocess.TimeoutExpired:
      if os.name!='nt':os.killpg(self.proc.pid,signal.SIGKILL)
      else:self.proc.kill()
      self.proc.wait(timeout=5)
     if self.cancel.is_set():raise Cancelled('JOB_CANCELLED')
     raise ProcessingError('PROCESS_TIMEOUT')
   if self.proc.returncode:
    # Detailed untrusted file/tool output remains on the local processing host, not in public logs.
    output.seek(0);(pathlib.Path(cwd)/'processor-error.log').write_bytes(output.read(65536))
    raise ProcessingError('TOOL_FAILED_'+pathlib.Path(str(args[0])).stem.upper())
 def output(self,path,mime,role='rendition',metadata=None):
  path=pathlib.Path(path)
  if not path.is_file()or not path.stat().st_size:raise ProcessingError('OUTPUT_EMPTY')
  if path.stat().st_size>self.job.get('maxOutputBytes',40*1024*1024):raise ProcessingError('OUTPUT_TOO_LARGE_SPLIT_SOURCE')
  return dict(path=path,name=path.name,mime=mime,role=role,bytes=path.stat().st_size,sha256=digest(path),metadata=metadata or{})
 def pages(self,path):
  output=subprocess.run(['pdfinfo',str(path)],capture_output=True,timeout=30,text=True)
  if output.returncode:raise ProcessingError('PDF_INSPECTION_FAILED')
  count=next((int(line.split(':',1)[1])for line in output.stdout.splitlines()if line.startswith('Pages:')),0)
  if count<1 or count>1000:raise ProcessingError('PDF_PAGE_LIMIT')
  return count
 def selected_pages(self,value,count):
  if not value:return list(range(1,min(count,200)+1))if count<=200 else self._raise('SELECT_UP_TO_200_PAGES')
  result=[]
  for part in value.split(','):
   bounds=list(map(int,part.split('-')));result.extend(range(bounds[0],bounds[-1]+1))
  result=list(dict.fromkeys(result))
  if len(result)>200 or any(n<1 or n>count for n in result):raise ProcessingError('PAGE_SELECTION_INVALID')
  return result
 def _raise(self,message):raise ProcessingError(message)
 def pdf(self,source,recipe,directory,slides=False):
  count=self.pages(source);pages=self.selected_pages(recipe.get('pages',''),count);pdfs=[];outputs=[];texts=[]
  for i,page in enumerate(pages):
   self.stage='slide_'+str(page)if slides else'page_'+str(page);self.progress=10+int((i/max(1,len(pages)))*65)
   root=directory/('page-'+str(page).zfill(4));self.command(['pdftoppm','-f',page,'-l',page,'-scale-to',1800,'-png','-singlefile',source,root],directory)
   outputs.append(self.output(str(root)+'.png','image/png','slide'if slides else'poster',{'page':page,'order':i}))
   page_pdf=directory/('sheet-'+str(page).zfill(4)+'.pdf');self.command(['pdfseparate','-f',page,'-l',page,source,str(directory/'split-%d.pdf')],directory);shutil.move(str(directory/('split-'+str(page)+'.pdf')),page_pdf)
   text_file=directory/('page-'+str(page)+'.txt');self.command(['pdftotext','-f',page,'-l',page,'-layout',source,text_file],directory);texts.append(text_file.read_text(errors='replace'));pdfs.append(page_pdf)
  selected=directory/'selected-document.pdf';self.command(['pdfunite',*pdfs,selected],directory);outputs.insert(0,self.output(selected,'application/pdf','document',{'pages':len(pages)}))
  return outputs,{'text':'\n\n'.join(texts)[:100000],'pages':pages,'recognition':'extracted_not_human_reviewed','staticSlides':slides,'pageTexts':[{'page':page,'text':value[:10000]}for page,value in zip(pages,texts)]}
 def process_local(self,source,recipe,directory):
  source=pathlib.Path(source).resolve();directory=pathlib.Path(directory).resolve();directory.mkdir(parents=True,exist_ok=True)
  kind=recipe['recipe'];outputs=[];result={};self.stage=kind;start=float(recipe.get('start',0));end=float(recipe.get('end',0));language=recipe.get('language','fr');limit=['-t',str(end-start)]if end>start else[]
  if kind=='image':
   for width in recipe.get('widths',[480,960,1600]):
    name=directory/('image-'+str(width)+'.jpg');self.command(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-vf','scale=min(iw\\,'+str(int(width))+'):-2','-frames:v','1','-q:v','2','-threads','2',name],directory);outputs.append(self.output(name,'image/jpeg',metadata={'requestedWidth':width,'fit':'contain'}))
   if recipe.get('crop'):
    crop=directory/'focal-crop.jpg';fx=float(recipe.get('focalX',.5));fy=float(recipe.get('focalY',.5));vf=f'crop=w=min(iw\\,ih*4/3):h=min(ih\\,iw*3/4):x=(iw-ow)*{fx}:y=(ih-oh)*{fy},scale=min(iw\\,960):-2'
    self.command(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',source,'-vf',vf,'-frames:v','1','-q:v','2','-threads','2',crop],directory);outputs.append(self.output(crop,'image/jpeg',metadata={'fit':'focal_crop','focalX':fx,'focalY':fy}))
   result={'alt':recipe.get('alt','')}
  elif kind=='document':outputs,result=self.pdf(source,recipe,directory)
  elif kind=='slides':
   office=shutil.which('libreoffice')or shutil.which('soffice')
   if not office:raise ProcessingError('LIBREOFFICE_NOT_INSTALLED')
   profile=directory/'office-profile';(profile/'user').mkdir(parents=True,exist_ok=True)
   (profile/'user'/'registrymodifications.xcu').write_text('<?xml version="1.0" encoding="UTF-8"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item></oor:items>')
   converted=directory/'converted';converted.mkdir(exist_ok=True);self.command([office,'-env:UserInstallation='+profile.as_uri(),'--headless','--norestore','--convert-to','pdf','--outdir',converted,source],directory)
   pdf=converted/(source.stem+'.pdf')
   if not pdf.is_file():raise ProcessingError('PRESENTATION_CONVERSION_EMPTY')
   outputs,result=self.pdf(pdf,recipe,directory,True)
  elif kind=='ocr':
   pages=self.selected_pages(recipe.get('pages',''),self.pages(source))if source.suffix.lower()=='.pdf'else[1];pdfs=[];texts=[]
   for i,page in enumerate(pages):
    self.progress=10+int(i/len(pages)*65);self.stage='ocr_page_'+str(page);root=directory/('ocr-'+str(page).zfill(4));image=source
    if source.suffix.lower()=='.pdf':self.command(['pdftoppm','-f',page,'-l',page,'-r','200','-png','-singlefile',source,root],directory);image=pathlib.Path(str(root)+'.png')
    self.command(['tesseract',image,root,'-l',LANG[language],'pdf','txt'],directory);pdfs.append(pathlib.Path(str(root)+'.pdf'));texts.append(pathlib.Path(str(root)+'.txt').read_text(errors='replace'))
   merged=directory/'searchable-document.pdf';self.command(['pdfunite',*pdfs,merged],directory);outputs=[self.output(merged,'application/pdf','document',{'pages':len(pages),'ocrLanguage':LANG[language]})];result={'text':'\n\n'.join(texts)[:100000],'pages':pages,'recognition':'machine_requires_review','language':language}
  elif kind in('video','audio'):
   out=directory/('prepared.mp4'if kind=='video'else'prepared.mp3');args=['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',source,*limit]
   if kind=='video':args+=['-vf','scale=min(iw\\,1280):-2','-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-b:a','96k','-movflags','+faststart']
   else:args+=['-vn','-c:a','libmp3lame','-b:a','128k']
   if recipe.get('normalize',True):args+=['-af','loudnorm=I=-16:TP=-1.5:LRA=11']
   self.command([*args,'-threads','2',out],directory);outputs.append(self.output(out,'video/mp4'if kind=='video'else'audio/mpeg'))
   if kind=='video':
    poster=directory/'poster.jpg';self.command(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',out,'-frames:v','1','-q:v','2',poster],directory);outputs.append(self.output(poster,'image/jpeg','poster'))
   else:
    wave=directory/'waveform.png';self.command(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',out,'-filter_complex','showwavespic=s=1200x240:colors=0x076bff','-frames:v','1',wave],directory);outputs.append(self.output(wave,'image/png','waveform'))
   probe=subprocess.run(['ffprobe','-v','quiet','-print_format','json','-show_format',str(out)],capture_output=True,timeout=30,text=True)
   if probe.returncode:raise ProcessingError('OUTPUT_METADATA_FAILED')
   duration=float(json.loads(probe.stdout)['format']['duration']);
   if any(float(c['seconds'])-start>=duration for c in recipe.get('chapters',[]))or any(float(c['end'])-start>duration+.1 for c in recipe.get('cues',[])):raise ProcessingError('CUE_OUTSIDE_ACTUAL_SOURCE')
   result={'duration':duration,'chapters':[{**c,'seconds':float(c['seconds'])-start}for c in recipe.get('chapters',[])],'cues':[{**c,'start':float(c['start'])-start,'end':float(c['end'])-start}for c in recipe.get('cues',[])]}
  elif kind=='transcript':
   model=self.model_dir/'small.pt'
   if not model.is_file()or not importlib.util.find_spec('whisper'):raise ProcessingError('WHISPER_MODEL_NOT_ACTIVATED')
   audio=directory/'speech.wav';self.command(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',source,*limit,'-vn','-ar','16000','-ac','1',audio],directory)
   self.command([sys.executable,'-m','whisper',audio,'--model','small','--model_dir',self.model_dir,'--language',{'fra':'fr','eng':'en','ara':'ar'}.get(language,language),'--task','transcribe','--output_format','json','--output_dir',directory,'--fp16','False','--threads','2'],directory)
   speech=json.loads((directory/'speech.json').read_text());result={'text':speech['text'][:100000],'cues':[{'start':s['start'],'end':s['end'],'text':s['text']}for s in speech['segments'][:2000]],'recognition':'machine_requires_review','language':language}
  else:raise ProcessingError('UNSUPPORTED_RECIPE')
  return outputs,result
 def heartbeat(self):
  while not self.stop.wait(20):
   try:
    reply=self.client.call('heartbeat',id=self.job['id'],lease=self.job['data']['lease'],stage=self.stage,progress=self.progress)
    if reply.get('status')in('cancelled','cancel_requested'):self.cancel.set();return
   except Exception:self.cancel.set();return
 def run_once(self):
  tools,versions=tools_available(self.model_dir);self.client.call('capabilities',tools=tools,versions=versions,concurrency=1)
  job=self.client.call('claim',tools=tools,concurrency=1)
  if job.get('state')=='idle':return {'state':'idle'}
  self.job=job;self.stop.clear();self.cancel.clear();thread=threading.Thread(target=self.heartbeat,daemon=True);thread.start();self.work_dir.mkdir(parents=True,exist_ok=True)
  directory=self.work_dir/(job['id']+'-'+job['data']['fingerprint'][:12]);directory.mkdir(exist_ok=True)
  try:
   source_info=job['data']['source'];suffix={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','video/mp4':'.mp4','video/webm':'.webm','audio/mpeg':'.mp3','application/vnd.openxmlformats-officedocument.presentationml.presentation':'.pptx','application/vnd.oasis.opendocument.presentation':'.odp'}.get(source_info['mime'])
   if not suffix:raise ProcessingError('UNSUPPORTED_SOURCE')
   source=directory/('source'+suffix);self.stage='source_verification'
   if not source.is_file()or digest(source)!=source_info['sha256']:
    temp=directory/'source.part'
    with urllib.request.urlopen(job['sourceUrl'],timeout=60)as response,open(temp,'wb')as output:
     received=0
     while True:
      part=response.read(1024*1024)
      if not part:break
      received+=len(part)
      if received>int(source_info['bytes'])or received>40*1024*1024:raise ProcessingError('SOURCE_SIZE_CHANGED')
      output.write(part)
    if temp.stat().st_size!=int(source_info['bytes'])or digest(temp)!=source_info['sha256']:raise ProcessingError('SOURCE_CHECKSUM_CHANGED')
    temp.replace(source)
   outputs,result=self.process_local(source,job['data']['recipe'],directory)
   self.stage='output_verification';self.progress=85
   for out in outputs:
    if self.cancel.is_set():raise Cancelled('JOB_CANCELLED')
    descriptor={k:v for k,v in out.items()if k!='path'};session=self.client.call('output_prepare',id=job['id'],lease=job['data']['lease'],**descriptor)
    if not session.get('verified'):
     with open(out['path'],'rb')as f:
      request=urllib.request.Request(session['uploadUrl'],data=f.read(),method='PUT',headers={'Content-Type':out['mime']})
     with urllib.request.urlopen(request,timeout=90)as response:
      if response.status not in(200,201):raise ProcessingError('OUTPUT_UPLOAD_FAILED')
     self.client.call('output_complete',id=job['id'],lease=job['data']['lease'],outputId=session['receipt']['id'])
   result['toolVersions']=versions;result['processorVersion']=VERSION;reply=self.client.call('finish',id=job['id'],lease=job['data']['lease'],result=result)
   # Only a recorded completion permits automatic cleanup; failed runs remain inspectable for recovery.
   if reply.get('status')=='needs_review':shutil.rmtree(directory)
   return{'state':reply.get('status'),'jobId':job['id']}
  except Exception as error:
   code=str(error)if isinstance(error,ProcessingError)else type(error).__name__.upper();code=code[:120]
   try:self.client.call('fail',id=job['id'],lease=job['data']['lease'],result={'code':code,'stage':self.stage})
   except Exception:pass
   return{'state':'failed','jobId':job['id'],'code':code}
  finally:self.stop.set();thread.join(timeout=2)

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--env-file');parser.add_argument('--capabilities',action='store_true');parser.add_argument('--once',action='store_true');parser.add_argument('--run',action='store_true');parser.add_argument('--work-dir',default='./dce-processing-work');parser.add_argument('--model-dir',default='./models');args=parser.parse_args()
 if args.env_file:
  for line in pathlib.Path(args.env_file).read_text().splitlines():
   if line.strip()and not line.lstrip().startswith('#'):
    key,value=line.split('=',1)
    if key.strip()in('MARKETPLACE_DCE_ORIGIN','MARKETPLACE_DCE_PROCESSOR_TOKEN','MARKETPLACE_DCE_PROCESSOR_ID'):os.environ[key.strip()]=value.strip()
 if args.capabilities:
  tools,versions=tools_available(args.model_dir);print(json.dumps({'version':VERSION,'tools':tools,'versions':versions},ensure_ascii=False,indent=2));return
 token=os.environ.get('MARKETPLACE_DCE_PROCESSOR_TOKEN','')
 if len(token)<32:raise ProcessingError('PROCESSOR_TOKEN_NOT_CONFIGURED')
 client=Client(os.environ.get('MARKETPLACE_DCE_ORIGIN',''),token,os.environ.get('MARKETPLACE_DCE_PROCESSOR_ID','dce-processor-01'));p=Processor(client,args.work_dir,args.model_dir)
 if args.once:print(json.dumps(p.run_once()));return
 if not args.run:parser.error('Choose --capabilities, --once or --run.')
 stopping=threading.Event()
 def stop(*_):stopping.set();p.cancel.set()
 signal.signal(signal.SIGINT,stop);signal.signal(signal.SIGTERM,stop)
 while not stopping.is_set():
  try:print(json.dumps(p.run_once()),flush=True)
  except Exception as error:print(json.dumps({'state':'connection_unavailable','code':type(error).__name__}),flush=True)
  stopping.wait(5)
if __name__=='__main__':
 try:main()
 except ProcessingError as error:print('PROCESSOR_STOPPED='+str(error));raise SystemExit(1)
