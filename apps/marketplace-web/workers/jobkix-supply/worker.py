"""Private, self-hosted job intake supervisor. No inbound port; pulls tasks from JOBKIX."""
import os
import random
import socket
import time
import uuid
import requests
from collectors import iter_collect

BASE=os.environ.get('JOBKIX_SUPPLY_SERVER','http://marketplace:3000').rstrip('/')
KEY=os.environ.get('JOBKIX_SUPPLY_WORKER_KEY','')
IDENT='supply-'+socket.gethostname().replace('.','-')[:35]+'-'+uuid.uuid4().hex[:8]
POLL=max(5,min(int(os.environ.get('JOBKIX_SUPPLY_POLL_SECONDS','12')),90))


def call(action,**kwargs):
    r=requests.post(BASE+'/api/jobkix/supply/worker',headers={'X-JOBKIX-Worker-Key':KEY,'Content-Type':'application/json'},json={'action':action,'worker':IDENT,**kwargs},timeout=(5,60),allow_redirects=False)
    r.raise_for_status();result=r.json()
    if not result.get('ok'):raise RuntimeError(str(result.get('error','Worker request failed')))
    return result['result']


def run(mission):
    ident=mission['id'];print('START',ident,mission['source']['kind'],flush=True)
    try:
        batch=[];total=0
        for row in iter_collect(mission):
            batch.append(row);total+=1
            if len(batch)>=15:
                call('batch',missionId=ident,items=batch);batch=[]
        if batch:call('batch',missionId=ident,items=batch)
        call('finish',missionId=ident,success=True)
        print('DONE',ident,total,flush=True)
    except Exception as ex:
        error=f'{type(ex).__name__}: {ex}'[:450]
        print('FAILED',ident,error,flush=True)
        try:call('finish',missionId=ident,success=False,error=error)
        except Exception as follow:print('FINISH_FAILED',str(follow)[:350],flush=True)


def main():
    if len(KEY)<32:raise RuntimeError('JOBKIX_SUPPLY_WORKER_KEY must be >=32 characters')
    print('JOBKIX SUPPLY WORKER ACTIVE',IDENT,flush=True)
    while True:
        try:
            mission=call('claim')
            if mission:run(mission)
            else:time.sleep(POLL)
        except Exception as err:
            print('WORKER_TRANSPORT_ERROR',str(err)[:450],flush=True)
            time.sleep(POLL+random.uniform(0,3))

if __name__=='__main__':main()
