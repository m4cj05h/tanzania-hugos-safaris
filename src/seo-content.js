import {defaultKilimanjaroRoutes} from './data.js';

const routes=content=>defaultKilimanjaroRoutes.map(route=>({...route,...(content.kilimanjaroRoutes||[]).find(saved=>saved.slug===route.slug)}));
const published=(content,category)=>(content.packages||[]).filter(packageItem=>packageItem.published&&packageItem.category===category);
const durations=items=>[...new Set(items.map(item=>item.days).filter(Number.isFinite))].sort((a,b)=>a-b).map(days=>`${days} ${days===1?'day':'days'}`).join(', ')||'the duration shown on each trip page';
const uniqueDestinations=items=>[...new Set(items.flatMap(item=>String(item.destinations||'').split(/\s*[·,]\s*/).map(value=>value.trim()).filter(Boolean)))];
const list=(items,limit=8)=>{const shown=items.slice(0,limit);return shown.length?`${shown.join(', ')}${items.length>limit?' and more':''}`:'the published trip pages'};
export function formatPackageName(value){
  let name=String(value||'').trim()
    .replace(/\s+[–—-]\s+(\d+)\s+days?$/i,', $1 Days')
    .replace(/\s+\((\d+)\s+days?\)$/i,', $1 Days');
  if(/^kilimanjaro\s+via\s+machame$/i.test(name))return 'Machame Route';
  if(name&&name===name.toLocaleUpperCase('en')){
    name=name.toLocaleLowerCase('en').replace(/\b[a-z]/g,letter=>letter.toLocaleUpperCase('en')).replace(/\bAfcon\b/g,'AFCON');
  }
  return name;
}

export function categoryFAQs(category,content){
  const trips=published(content,category);
  const names=list(trips.map(item=>formatPackageName(item.name)),6);
  const lengths=durations(trips);
  const parks=list(uniqueDestinations(trips),6);
  const sharedQuote='Exact availability, inclusions and total cost depend on your dates and group. Request a written, itemised quotation before booking.';
  const faqs={
    Safari:[
      {question:'Which destinations are covered by the safari packages?',answer:`Published safari itineraries include ${parks}. Each package page lists its destinations and itinerary.`},
      {question:'How long are the Tanzania safari tours?',answer:`The published safari packages range from ${lengths}. Check each trip page for its day-by-day itinerary.`},
      {question:'Are wildlife sightings or migration crossings guaranteed?',answer:'No. Wildlife sightings and migration crossings depend on nature and timing, and are not guaranteed.'},
      {question:'How do I confirm the price and inclusions?',answer:sharedQuote},
    ],
    'Day trip':[
      {question:'What day trips are available?',answer:`Current day trips include ${names}. Visit each trip page for its destination and details.`},
      {question:'How long are the listed day trips?',answer:`Published day trips are listed for ${lengths}. Check the selected trip page for its plan.`},
      {question:'Where can I find what is included?',answer:'Each trip page shows the inclusions and exclusions available in the project data. If details are not listed, request them in your written quotation.'},
      {question:'How can I arrange a day trip?',answer:'Send your preferred date and group details through the trip enquiry form. The team can confirm availability and provide a quotation.'},
    ],
    Zanzibar:[
      {question:'What Zanzibar tours and stays are listed?',answer:`Current Zanzibar packages include ${names}. See the individual package pages for destinations, duration and trip details.`},
      {question:'How long are the listed Zanzibar packages?',answer:`Published packages range from ${lengths}. The itinerary on each page gives the trip-specific details.`},
      {question:'Can I combine Zanzibar with a safari?',answer:'The site lists a separate safari and Zanzibar combination package. See the combination packages page for its published details.'},
      {question:'How do I confirm the price and inclusions?',answer:sharedQuote},
    ],
    Kilimanjaro:[
      {question:'Which Kilimanjaro route should I choose?',answer:'Machame offers a varied southern approach, Lemosho starts on the western slopes, and Marangu has hut accommodation. Share your available time, experience and preferences so we can discuss a suitable itinerary.'},
      {question:'How much does a Kilimanjaro climb cost?',answer:(()=>{const machame=trips.find(item=>item.id==='machame-route');const price=Number(machame?.price);return`${Number.isFinite(price)&&price>0?`Our published ${machame.days}-day Machame journey starts at US$${price.toLocaleString('en-US')} per person. `:'Ask our team for current Kilimanjaro rates. '}Your dates, route, group size and services determine the final quote, which we confirm in writing.`})()},
      {question:'Can I spend longer on the mountain?',answer:'Yes. Ask about a longer itinerary when planning your climb. We’ll discuss pacing and confirm the duration, camps and cost with you.'},
      {question:'What is included in my quote?',answer:'Your written quotation lists the included services and exclusions. Ask us to confirm park fees, guides and porters, meals, camping or hut arrangements, equipment, transfers and accommodation before booking.'},
      {question:'Can I arrange a private climb or add a safari?',answer:'We can discuss private and group options, as well as safari or Zanzibar extensions. Send us your preferred dates and group size so we can confirm the available arrangements.'},
    ],
    Combination:[
      {question:'What is included in a safari and Zanzibar combination?',answer:`The published combination packages are ${names}. Review the selected package page and request a written quotation for exact inclusions.`},
      {question:'Can I tailor the length or order of my trip?',answer:'Send your preferred dates and the experiences you want to combine. The team can confirm what is available and provide a written itinerary and quotation.'},
      {question:'Can I include a Kilimanjaro climb?',answer:'The website describes safari, island and mountain combinations. Ask the team to confirm the route and availability for your dates.'},
      {question:'How do I confirm the total cost?',answer:sharedQuote},
    ],
    AFCON:[
      {question:'What AFCON travel support is listed?',answer:'The AFCON page lists airport pickups, match-day transfers, safari extensions and Zanzibar extensions, planned around your group and preferences.'},
      {question:'Are match tickets included?',answer:'Match tickets are not included in the published booking information.'},
      {question:'Are match dates and travel availability confirmed?',answer:'TODO: Confirm the tournament schedule, venues and travel availability for the dates you plan to publish.'},
      {question:'Can I add a safari or Zanzibar stay?',answer:'The AFCON page lists safari and Zanzibar extensions. Ask the team to confirm the available itinerary for your dates.'},
    ],
  };
  return faqs[category]||[];
}

export function relatedTripLinks(text,content,excludePath=''){
  const lower=String(text||'').toLowerCase();
  const links=[];
  const add=(href,label)=>{if(href!==excludePath&&!links.some(item=>item.href===href))links.push({href,label});};
  const destinations=[
    ['serengeti','Serengeti safari packages','/destinations/serengeti',['serengeti','migration']],
    ['ngorongoro','Ngorongoro Crater safaris','/destinations/ngorongoro',['ngorongoro']],
    ['tarangire','Tarangire National Park safaris','/destinations/tarangire',['tarangire']],
    ['lake-manyara','Lake Manyara safaris','/destinations/lake-manyara',['lake manyara']],
  ];
  for(const[,label,href,terms]of destinations)if(terms.some(term=>lower.includes(term)))add(href,label);
  if(/safari|serengeti|ngorongoro|tarangire|migration|wildlife/.test(lower))add('/safaris','Tanzania safari packages');
  if(/zanzibar|stone town|dhow|nungwi|kendwa/.test(lower))add('/zanzibar-tours','Zanzibar tours and holidays');
  if(/materuni|chemka|hot springs|day trip|waterfall/.test(lower))add('/day-trips','Tanzania day trips');
  if(/kilimanjaro|machame|lemosho|marangu|rongai|umbwe/.test(lower)){
    add('/kilimanjaro','Kilimanjaro climb routes');
    const matching=routes(content).filter(route=>lower.includes(route.slug)||lower.includes(route.name.toLowerCase()));
    for(const route of (matching.length?matching:routes(content)))add(`/kilimanjaro/routes/${route.slug}`,`${route.name} ${route.days}-day route`);
  }
  const stopwords=new Set(['tanzania','arusha','national park','serengeti','ngorongoro','tarangire','zanzibar','kilimanjaro']);
  const matches=(content.packages||[]).filter(item=>item.published).map(item=>{
    const places=[...new Set(String(item.destinations||'').split(/\s*[·,]\s*/).map(place=>place.trim()).filter(place=>place.length>3&&!stopwords.has(place.toLowerCase())))];
    const score=(lower.includes(String(item.name||'').toLowerCase())?4:0)+(lower.includes(item.id)?4:0)+places.filter(place=>lower.includes(place.toLowerCase())).length;
    return{item,score};
  }).filter(result=>result.score>0).sort((a,b)=>b.score-a.score);
  for(const{item}of matches.slice(0,3))add(`/packages/${item.id}`,formatPackageName(item.name));
  return links.slice(0,8);
}
