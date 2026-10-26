"""JobSpy board adapter. Parameters are editable via the administrator's JobSpy source form."""
import json
import sys
from jobspy import scrape_jobs

BOARDS={'indeed','linkedin','glassdoor','zip_recruiter','bayt','naukri','bdjobs','hellowork'}
def clean(v):
    if v is None:return ''
    try:
        import pandas as pd
        if pd.isna(v):return ''
    except (TypeError,ValueError):pass
    return str(v)[:12000]

if __name__=='__main__':
    m=json.load(sys.stdin);c=m['source']['config'];boards=[x for x in c.get('boards',[]) if x in BOARDS][:4]
    if not boards:raise ValueError('No supported JobSpy boards selected')
    jobs=scrape_jobs(site_name=boards,search_term=c.get('query'),location=c.get('location') or None,country_indeed=c.get('countryIndeed') or 'Morocco',results_wanted=min(int(c.get('resultsWanted',30)),100),hours_old=c.get('hoursOld'),is_remote=c.get('isRemote') is True,fetch_description=c.get('fetchDescription') is True,verbose=0)
    for _,row in jobs.iterrows():
        data={'title':clean(row.get('title')),'company':clean(row.get('company')),'city':clean(row.get('location')),'country':m['country'],'description':clean(row.get('description')),'url':clean(row.get('job_url')),'externalId':clean(row.get('id')),'remote':clean(row.get('is_remote')),'salary':clean(row.get('min_amount'))+' - '+clean(row.get('max_amount')),'postedAt':clean(row.get('date_posted'))}
        print(json.dumps(data,ensure_ascii=False,default=str),flush=True)
