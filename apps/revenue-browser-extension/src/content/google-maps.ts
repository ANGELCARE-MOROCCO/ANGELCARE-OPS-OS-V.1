;(() => {
  type AdapterWindow = Window & { __ANGELCARE_MAPS_LISTENER__?: (message:any,sender:any,sendResponse:(value:any)=>void)=>boolean }
  const territories = [
    ['Casablanca',['casablanca','casa']],['Rabat',['rabat']],['Temara',['temara','témara']],['Salé',['sale','salé']],
    ['Kénitra',['kenitra','kénitra']],['Tanger',['tanger','tangier']],['Marrakech',['marrakech','marrakesh']],
    ['Fès',['fes','fès','fez']],['Agadir',['agadir']],['Mohammedia',['mohammedia']],['El Jadida',['el jadida','jadida']],
    ['Meknès',['meknes','meknès']],['Tétouan',['tetouan','tétouan']],['Oujda',['oujda']],
  ] as Array<[string,string[]]>
  function txt(value:unknown,max=500){const output=String(value||'').replace(/\s+/g,' ').trim();return output?output.slice(0,max):null}
  function fold(value:unknown){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b\d{4,6}\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
  function cityFromAddress(address:string|null){if(!address)return null;const normalized=` ${fold(address)} `;for(const [canonical,aliases] of territories){for(const alias of aliases){const candidate=fold(alias);if(candidate&&normalized.includes(` ${candidate} `))return canonical}}const last=address.split(',').map((v)=>v.trim()).filter(Boolean).at(-1)?.replace(/\b\d{4,6}\b/g,'').trim();return txt(last,120)}
  function aria(prefixes:string[]){for(const prefix of prefixes){const element=document.querySelector(`[aria-label^="${prefix}" i]`) as HTMLElement|null;if(!element)continue;const raw=element.getAttribute('aria-label')||element.textContent;const value=txt(raw);if(value)return value.replace(new RegExp(`^${prefix}\\s*[:：]?\\s*`,'i'),'')}return null}
  function extract(){
    const heading=document.querySelector('h1') as HTMLElement|null
    const name=txt(heading?.textContent,240)
    if(!heading||!name||/^Google Maps$/i.test(name))throw new Error('GOOGLE_MAPS_LISTING_REQUIRED')
    const main=txt(document.querySelector('[role="main"]')?.textContent,15000)||''
    const address=aria(['Address','Adresse'])
    const phone=aria(['Phone','Téléphone'])
    const plusCode=aria(['Plus code','Code plus'])
    const hours=aria(['Hours','Horaires'])
    const websiteButton=document.querySelector('a[data-item-id="authority"],a[aria-label^="Website" i],a[aria-label^="Site Web" i]') as HTMLAnchorElement|null
    const category=txt(document.querySelector('button[jsaction*="category"]')?.textContent||document.querySelector('[role="main"] button')?.textContent,160)
    const city=cityFromAddress(address)
    const ratingText=txt(document.querySelector('.F7nice span[aria-hidden="true"]')?.textContent||document.querySelector('[role="img"][aria-label*="star" i],[role="img"][aria-label*="étoile" i]')?.getAttribute('aria-label'),120)
    const rating=Number(String(ratingText||'').replace(',','.').match(/\d+(?:\.\d+)?/)?.[0]||0)||null
    const reviewText=txt(document.querySelector('.F7nice span[aria-label*="review" i],.F7nice span[aria-label*="avis" i]')?.getAttribute('aria-label')||document.querySelector('button[jsaction*="reviewChart"]')?.textContent,160)
    const reviewCount=Number(String(reviewText||'').replace(/[^0-9]/g,''))||null
    const status=/temporarily closed|fermé temporairement/i.test(main)?'temporarily_closed':/permanently closed|définitivement fermé/i.test(main)?'permanently_closed':'operating'
    const signalDictionary=[['family_positioning',/family|families|famille|familial|kids|children|enfant/i],['events_activity',/event|événement|wedding|mariage|conference/i],['premium_positioning',/premium|luxury|luxe|5[- ]?star|cinq étoiles/i],['education',/school|école|nursery|crèche|preschool/i],['healthcare',/clinic|clinique|pediatric|pédiatr/i]] as Array<[string,RegExp]>
    const signals=signalDictionary.filter(([,pattern])=>pattern.test(`${name} ${category||''} ${main}`)).map(([key])=>key)
    const placeMatch=location.href.match(/!1s([^!]+)/)||location.href.match(/place\/([^/]+)/)
    const website=websiteButton?.href||null
    const evidence:any[]=[
      {type:'google_maps_listing',fieldKey:'organization.name',value:name,confidence:.94,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.category',value:category||'',confidence:.86,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.address',value:address||'',confidence:.9,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.phone',value:phone||'',confidence:.9,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.website',value:website||'',confidence:.93,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.rating',value:rating??'',confidence:.82,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.reviewCount',value:reviewCount??'',confidence:.8,sourceUrl:location.href},
      {type:'google_maps_listing',fieldKey:'organization.plusCode',value:plusCode||'',confidence:.88,sourceUrl:location.href},
    ].filter((item)=>item.value!==''&&item.value!==null)
    return {
      adapterId:'google_maps',pageType:'google_maps_listing',url:location.href,origin:location.origin,title:document.title,
      organization:{name,domain:website?new URL(website).hostname.replace(/^www\./,''):null,sector:category||'Local Business',category,city,address,phone,website,googleMapsUrl:location.href,placeId:placeMatch?.[1]?decodeURIComponent(placeMatch[1]):null,description:null,signals},
      contacts:[],evidence,
      metadata:{adapterVersion:'google-maps-v2.0',humanSelected:true,rating,reviewCount,plusCode,hours,businessStatus:status,visibleTextLength:main.length},
    }
  }
  const adapterWindow=window as AdapterWindow
  const previous=adapterWindow.__ANGELCARE_MAPS_LISTENER__
  if(previous){try{chrome.runtime.onMessage.removeListener(previous)}catch{}}
  const listener=(message:any,_sender:any,sendResponse:(value:any)=>void)=>{if(message?.type!=='ANGELCARE_EXTRACT_CONTEXT')return false;try{sendResponse({ok:true,context:extract()})}catch(error){sendResponse({ok:false,error:error instanceof Error?error.message:'MAPS_EXTRACTION_FAILED'})}return true}
  adapterWindow.__ANGELCARE_MAPS_LISTENER__=listener
  chrome.runtime.onMessage.addListener(listener)
})()
