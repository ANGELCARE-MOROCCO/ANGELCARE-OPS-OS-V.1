"""Scrapy selector-driven public job spider. Runs in an isolated child process per mission."""
import json
import sys
from urllib.parse import urljoin,urlparse
import scrapy
from scrapy.crawler import CrawlerProcess
from collectors import public_https

class JobsSpider(scrapy.Spider):
    name='jobkix_configured_jobs'
    def __init__(self,source,**kwargs):
        super().__init__(**kwargs)
        self.settings_form=source['config']
        self.start_urls=[source['endpoint']]
        self.allowed_domains=[urlparse(source['endpoint']).hostname]
        self.pages=0
        self.items=0
        self.limit=min(int(self.settings_form.get('limit',70)),300)
        self.max_pages=min(int(self.settings_form.get('maxPages',3)),10)
    def parse(self,response):
        self.pages+=1;c=self.settings_form
        cards=response.css(c['card'])
        for card in cards:
            if self.items>=self.limit:break
            def value(field):
                css=c.get(field,'')
                return (card.css(css).get() or '').strip()[:12000] if css else ''
            link=urljoin(response.url,value('link'))
            if urlparse(link).scheme!='https' or not urlparse(link).hostname:continue
            row={'title':value('title'),'company':value('company'),'city':value('city'),'description':value('description'),'url':link}
            if row['title']:
                self.items+=1
                print(json.dumps(row,ensure_ascii=False),flush=True)
        if self.pages<self.max_pages and self.items<self.limit:
            nxt=response.css(c.get('next','')).get() if c.get('next') else None
            if nxt:
                link=urljoin(response.url,nxt)
                if urlparse(link).hostname==self.allowed_domains[0]:yield scrapy.Request(link,callback=self.parse)

if __name__=='__main__':
    mission=json.load(sys.stdin);source=mission['source'];public_https(source['endpoint'])
    conf=source['config'];delay=max(1,min(int(conf.get('downloadDelay',2)),10))
    proc=CrawlerProcess({'ROBOTSTXT_OBEY':True,'CONCURRENT_REQUESTS':1,'CONCURRENT_REQUESTS_PER_DOMAIN':1,'DOWNLOAD_DELAY':delay,'DOWNLOAD_TIMEOUT':15,'RETRY_TIMES':1,'REDIRECT_ENABLED':False,'LOG_ENABLED':False,'TELNETCONSOLE_ENABLED':False,'DEPTH_LIMIT':12,'CLOSESPIDER_TIMEOUT':240,'USER_AGENT':'JOBKIX-StrategicSupply/1.0','FEEDS':{}})
    proc.crawl(JobsSpider,source=source);proc.start()
