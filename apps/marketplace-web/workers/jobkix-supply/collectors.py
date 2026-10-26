"""Bounded source adapters for Strategic Supply PM7. No paid services or bypass logic."""
import ipaddress
import json
import re
import socket
import subprocess
import sys
from urllib.parse import urlparse, urlencode, urlunparse, parse_qs
import requests
from xml.etree import ElementTree

MAX_DOCUMENT_BYTES = 2_500_000
UA = 'JOBKIX-StrategicSupply/1.0 (+internal jobs discovery; contact administrator)'


def public_https(url, host=None):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Only public HTTPS sources are permitted')
    if host and parsed.hostname.lower() != host.lower():
        raise ValueError('Redirect/outbound domain is not the configured source domain')
    if parsed.hostname.lower() in ('localhost',) or parsed.hostname.endswith(('.local', '.internal')):
        raise ValueError('Private addresses prohibited')
    for info in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise ValueError('Source resolves to a non-public address')
    return parsed.hostname.lower()


def path(record, dotted):
    if not dotted:
        return record
    for part in dotted.split('.'):
        if isinstance(record, dict):
            record = record.get(part)
        elif isinstance(record, list) and part.isdigit() and int(part)<len(record):
            record = record[int(part)]
        else:
            return None
    return record


def clean(value):
    if value is None: return ''
    if isinstance(value, bool): return 'yes' if value else 'no'
    if isinstance(value, list): return ', '.join(map(str,value))[:2000]
    if isinstance(value, dict): return json.dumps(value,ensure_ascii=False)[:2000]
    return str(value).strip()[:12000]


def api_collect(mission):
    source=mission['source'];c=source['config'];endpoint=source['endpoint'];host=public_https(endpoint)
    session=requests.Session();session.trust_env=False
    headers={'User-Agent':UA,'Accept':'application/json, application/xml, text/xml, application/rss+xml'}
    for k,v in c.get('headers',{}).items():
        if re.fullmatch('[a-zA-Z0-9-]{1,50}',k) and not k.lower().startswith(('authorization','cookie','proxy-')):
            headers[k]=str(v)[:500]
    credential=mission.get('credential')
    if credential:
        h=mission.get('credentialHeader','')
        if not re.fullmatch('[a-zA-Z0-9-]{1,80}',h) or h.lower() in ['host','cookie','connection']:
            raise ValueError('Unsupported credential header')
        headers[h]=credential
    data=[];limit=min(int(c.get('limit',70)),300)
    for page in range(1,min(int(c.get('maxPages',2)),10)+1):
        u=urlparse(endpoint);query=parse_qs(u.query,keep_blank_values=True)
        for key,value in [(c.get('keywordParam'),c.get('query','')),(c.get('countryParam'),mission['country']),(c.get('pageParam'),str(page))]:
            if key and re.fullmatch('[a-zA-Z0-9_-]{1,60}',str(key)) and value:query[key]=[str(value)]
        link=urlunparse(u._replace(query=urlencode(query,doseq=True)))
        public_https(link,host)
        response=session.get(link,headers=headers,timeout=(7,15),allow_redirects=False,stream=True)
        if response.is_redirect:raise ValueError('API redirects are disabled')
        response.raise_for_status()
        response.raw.decode_content=True
        raw=response.raw.read(MAX_DOCUMENT_BYTES+1)
        response.close()
        if len(raw)>MAX_DOCUMENT_BYTES:raise ValueError('API response exceeded configured size')
        if c.get('format')=='rss':
            root=ElementTree.fromstring(raw)
            items=root.findall('.//item') or root.findall('.//{*}entry')
            rows=[]
            for i in items:
                fields={x.tag.split('}')[-1]:clean(x.text) for x in list(i)}
                rows.append({'title':fields.get('title'), 'company':fields.get('author') or fields.get('company'),'city':fields.get('location'), 'description':fields.get('description') or fields.get('summary'),'url':fields.get('link') or fields.get('guid'),'externalId':fields.get('guid') or fields.get('id')})
        else:
            body=json.loads(raw);rows=path(body,c.get('responsePath',''))
            if not isinstance(rows,list):raise ValueError('JSON responsePath did not resolve to an array')
            mapped=[]
            for item in rows:
                m=c.get('mapping') or {};mapped.append({k:clean(path(item,v)) for k,v in m.items()})
            rows=mapped
        if not rows:break
        data.extend(rows[:max(0,limit-len(data))]);
        if len(data)>=limit or not c.get('pageParam'):break
    return data


def subprocess_collect(kind,mission):
    command=[sys.executable, __file__.replace('collectors.py','spider.py' if kind=='scrapy' else 'jobspy_adapter.py')]
    result=subprocess.run(command,input=json.dumps(mission),capture_output=True,text=True,timeout=300,check=False)
    if result.returncode!=0:raise RuntimeError(result.stderr[-1800:] or f'{kind} worker failed')
    rows=[]
    for line in result.stdout.splitlines():
        try:
            row=json.loads(line)
            if isinstance(row,dict):rows.append(row)
        except json.JSONDecodeError:pass
    return rows[:300]


def collect(mission):
    kind=mission['source']['kind']
    if kind=='api':return api_collect(mission)
    if kind in ['scrapy','jobspy']:return subprocess_collect(kind,mission)
    raise ValueError('Unknown collection engine')


def iter_collect(mission):
    """Stream discovered items to caller as they arrive for real worker progress updates."""
    kind=mission['source']['kind']
    if kind=='api':
        yield from api_collect(mission)
        return
    if kind not in ('scrapy','jobspy'):
        raise ValueError('Unsupported source engine')
    import tempfile
    import threading
    command=[sys.executable, __file__.replace('collectors.py','spider.py' if kind=='scrapy' else 'jobspy_adapter.py')]
    with tempfile.TemporaryFile(mode='w+t') as stderr:
        process=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=stderr,text=True,bufsize=1)
        stop=threading.Timer(300,process.kill)
        stop.start()
        try:
            assert process.stdin and process.stdout
            process.stdin.write(json.dumps(mission));process.stdin.close()
            for line in process.stdout:
                try:
                    obj=json.loads(line)
                    if isinstance(obj,dict):yield obj
                except json.JSONDecodeError:
                    pass
            code=process.wait()
            if code!=0:
                stderr.seek(0);raise RuntimeError(stderr.read()[-1500:] or f'{kind} worker exit {code}')
        finally:
            stop.cancel()
            if process.poll() is None:process.kill();process.wait()
